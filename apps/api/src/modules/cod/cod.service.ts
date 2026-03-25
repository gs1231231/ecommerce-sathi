import { Injectable, Inject, HttpStatus } from "@nestjs/common";
import { eq, and } from "drizzle-orm";
import { createHash, randomInt } from "crypto";
import { PinoLogger } from "nestjs-pino";
import { orders } from "@ecommerce-sathi/db";
import { AppError } from "../../common/exceptions/app-error";
import {
  DATABASE_TOKEN,
  DatabaseInstance,
} from "../database/database.module";

// In-memory OTP store for MVP (replace with Redis in production)
interface OtpRecord {
  hash: string;
  expiresAt: Date;
  attempts: number;
  phone: string;
}

// Risk scoring thresholds
const RISK_THRESHOLDS = {
  HIGH_VALUE_ORDER: 5000,
  VERY_HIGH_VALUE_ORDER: 15000,
  MAX_OTP_ATTEMPTS: 3,
  OTP_EXPIRY_MINUTES: 10,
  RISKY_PINCODE_PREFIXES: ["110", "400", "500"], // High COD failure metros (placeholder)
};

interface RiskScoreInput {
  pincode: string;
  phone: string;
  orderValue: number;
  previousOrders: number;
}

interface RiskScoreResult {
  score: number;
  level: "low" | "medium" | "high";
  factors: string[];
  requiresVerification: boolean;
}

interface PrepaidNudge {
  originalAmount: number;
  discountPercent: number;
  discountAmount: number;
  prepaidPrice: number;
  message: string;
}

@Injectable()
export class CodService {
  private readonly otpStore: Map<string, OtpRecord> = new Map();

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: DatabaseInstance,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext("CodService");
  }

  async sendVerificationOtp(
    orderId: string,
    phone: string,
  ): Promise<{ sent: boolean; expiresInSeconds: number }> {
    // Validate phone format (Indian mobile)
    const phoneRegex = /^[6-9]\d{9}$/;
    const cleanPhone = phone.replace(/[+\s-]/g, "").replace(/^91/, "");
    if (!phoneRegex.test(cleanPhone)) {
      throw new AppError(
        "INVALID_PHONE",
        "Invalid Indian mobile number",
        HttpStatus.BAD_REQUEST,
      );
    }

    // Check for existing unexpired OTP
    const existingOtp = this.otpStore.get(orderId);
    if (existingOtp && existingOtp.expiresAt > new Date()) {
      const remainingMs = existingOtp.expiresAt.getTime() - Date.now();
      if (remainingMs > (RISK_THRESHOLDS.OTP_EXPIRY_MINUTES - 1) * 60 * 1000) {
        // OTP was sent less than 1 minute ago, rate limit
        throw new AppError(
          "OTP_RATE_LIMITED",
          "Please wait before requesting a new OTP",
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    // Generate 6-digit OTP
    const otp = String(randomInt(100000, 999999));
    const otpHash = this.hashOtp(otp);

    const expiresAt = new Date(
      Date.now() + RISK_THRESHOLDS.OTP_EXPIRY_MINUTES * 60 * 1000,
    );

    // Store OTP hash
    this.otpStore.set(orderId, {
      hash: otpHash,
      expiresAt,
      attempts: 0,
      phone: cleanPhone,
    });

    // Update order with OTP hash (for persistence)
    await this.db
      .update(orders)
      .set({
        codVerificationOtp: otpHash,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    // In production: send OTP via SMS gateway (MSG91, Twilio, etc.)
    this.logger.info(
      { orderId, phone: cleanPhone, otp: process.env.NODE_ENV !== "production" ? otp : "***" },
      "COD verification OTP generated",
    );

    return {
      sent: true,
      expiresInSeconds: RISK_THRESHOLDS.OTP_EXPIRY_MINUTES * 60,
    };
  }

  async verifyOtp(
    orderId: string,
    otp: string,
  ): Promise<{ verified: boolean; orderId: string }> {
    const record = this.otpStore.get(orderId);

    if (!record) {
      // Fall back to DB stored hash
      const [order] = await this.db
        .select({
          id: orders.id,
          codVerificationOtp: orders.codVerificationOtp,
        })
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (!order || !order.codVerificationOtp) {
        throw new AppError(
          "OTP_NOT_FOUND",
          "No OTP found for this order. Please request a new one.",
          HttpStatus.BAD_REQUEST,
        );
      }

      // DB-only verification (no expiry check possible without stored timestamp)
      const otpHash = this.hashOtp(otp);
      if (otpHash !== order.codVerificationOtp) {
        throw new AppError(
          "OTP_INVALID",
          "Invalid OTP",
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.markOrderVerified(orderId);
      return { verified: true, orderId };
    }

    // Check expiry
    if (record.expiresAt < new Date()) {
      this.otpStore.delete(orderId);
      throw new AppError(
        "OTP_EXPIRED",
        "OTP has expired. Please request a new one.",
        HttpStatus.BAD_REQUEST,
      );
    }

    // Check attempts
    if (record.attempts >= RISK_THRESHOLDS.MAX_OTP_ATTEMPTS) {
      this.otpStore.delete(orderId);
      throw new AppError(
        "OTP_MAX_ATTEMPTS",
        "Maximum verification attempts exceeded. Please request a new OTP.",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Verify OTP
    const otpHash = this.hashOtp(otp);
    if (otpHash !== record.hash) {
      record.attempts += 1;
      throw new AppError(
        "OTP_INVALID",
        `Invalid OTP. ${RISK_THRESHOLDS.MAX_OTP_ATTEMPTS - record.attempts} attempts remaining.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // OTP verified - clean up and mark order
    this.otpStore.delete(orderId);
    await this.markOrderVerified(orderId);

    this.logger.info({ orderId }, "COD order verified via OTP");

    return { verified: true, orderId };
  }

  calculateRiskScore(input: RiskScoreInput): RiskScoreResult {
    const factors: string[] = [];
    let score = 0;

    // Factor 1: Order value (0-25 points)
    if (input.orderValue > RISK_THRESHOLDS.VERY_HIGH_VALUE_ORDER) {
      score += 25;
      factors.push("Very high order value (>15000)");
    } else if (input.orderValue > RISK_THRESHOLDS.HIGH_VALUE_ORDER) {
      score += 15;
      factors.push("High order value (>5000)");
    }

    // Factor 2: Previous orders - trust signal (0 to -30 or +20)
    if (input.previousOrders === 0) {
      score += 20;
      factors.push("First-time buyer (no order history)");
    } else if (input.previousOrders >= 3) {
      score -= 30;
      factors.push("Repeat customer (3+ previous orders)");
    } else {
      score -= 10;
      factors.push(`${input.previousOrders} previous order(s)`);
    }

    // Factor 3: Pincode risk (0-20 points)
    const pincodePrefix = input.pincode.substring(0, 3);
    if (RISK_THRESHOLDS.RISKY_PINCODE_PREFIXES.includes(pincodePrefix)) {
      score += 20;
      factors.push("High RTO-risk pincode area");
    }

    // Factor 4: Phone number validation (0-15 points)
    const cleanPhone = input.phone.replace(/[+\s-]/g, "").replace(/^91/, "");
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      score += 15;
      factors.push("Invalid or suspicious phone number");
    }

    // Factor 5: Very low value orders can also be suspicious (0-10)
    if (input.orderValue < 100) {
      score += 10;
      factors.push("Unusually low order value");
    }

    // Clamp score to 0-100
    score = Math.max(0, Math.min(100, score));

    let level: "low" | "medium" | "high";
    if (score >= 60) {
      level = "high";
    } else if (score >= 30) {
      level = "medium";
    } else {
      level = "low";
    }

    this.logger.info(
      { pincode: input.pincode, orderValue: input.orderValue, score, level },
      "COD risk score calculated",
    );

    return {
      score,
      level,
      factors,
      requiresVerification: score >= 40,
    };
  }

  getPrepaidNudge(orderValue: number): PrepaidNudge {
    // Tiered discount strategy to encourage prepaid
    let discountPercent: number;
    let message: string;

    if (orderValue >= 10000) {
      discountPercent = 5;
      message = "Pay online and save 5%! Secure your order with instant confirmation.";
    } else if (orderValue >= 5000) {
      discountPercent = 3;
      message = "Switch to prepaid and get 3% off! Faster processing guaranteed.";
    } else if (orderValue >= 1000) {
      discountPercent = 2;
      message = "Pay online for 2% instant discount. Quick and hassle-free!";
    } else {
      discountPercent = 0;
      message = "Pay online for faster delivery and instant order confirmation!";
    }

    const discountAmount = Math.round((orderValue * discountPercent) / 100);
    const prepaidPrice = orderValue - discountAmount;

    return {
      originalAmount: orderValue,
      discountPercent,
      discountAmount,
      prepaidPrice,
      message,
    };
  }

  private hashOtp(otp: string): string {
    return createHash("sha256").update(otp).digest("hex");
  }

  private async markOrderVerified(orderId: string): Promise<void> {
    await this.db
      .update(orders)
      .set({
        codVerified: true,
        codVerificationOtp: null,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));
  }
}
