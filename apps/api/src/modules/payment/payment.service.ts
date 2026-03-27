import { Injectable, Inject, HttpStatus } from "@nestjs/common";
import { eq, and } from "drizzle-orm";
import { PinoLogger } from "nestjs-pino";
import { payments, orders } from "@ecommerce-sathi/db";
import { AppError } from "../../common/exceptions/app-error";
import { DATABASE_TOKEN, DatabaseInstance } from "../database/database.module";

// Gateway abstraction interface
interface GatewayOrder {
  gatewayOrderId: string;
  amount: number;
  currency: string;
  status: string;
}

interface PaymentGateway {
  createOrder(amount: number, currency: string, metadata: Record<string, unknown>): Promise<GatewayOrder>;
  verifyPayment(gatewayOrderId: string, paymentId: string, signature: string): Promise<boolean>;
  refundPayment(paymentId: string, amount: number, reason: string): Promise<{ refundId: string; status: string }>;
}

// Razorpay Gateway with real SDK integration
class RazorpayGateway implements PaymentGateway {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private rzInstance: any = null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getRazorpay(): any {
    if (!this.rzInstance) {
      const keyId = process.env.RAZORPAY_KEY_ID;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      if (keyId && keySecret && keyId !== "your-razorpay-key-id") {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const Razorpay = require("razorpay");
        this.rzInstance = new Razorpay({ key_id: keyId, key_secret: keySecret });
      }
    }
    return this.rzInstance;
  }

  async createOrder(amount: number, currency: string, metadata: Record<string, unknown>): Promise<GatewayOrder> {
    const rz = this.getRazorpay();
    if (rz) {
      const order = await rz.orders.create({
        amount: Math.round(amount * 100),
        currency,
        receipt: String(metadata.orderNumber ?? Date.now()),
        notes: { orderId: String(metadata.orderId ?? "") },
      });
      return {
        gatewayOrderId: String(order.id),
        amount,
        currency,
        status: String(order.status),
      };
    }
    return { gatewayOrderId: `order_mock_${Date.now()}`, amount, currency, status: "created" };
  }

  async verifyPayment(gatewayOrderId: string, paymentId: string, signature: string): Promise<boolean> {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (keySecret && keySecret !== "your-razorpay-key-secret") {
      const { createHmac } = require("crypto");
      const expected = createHmac("sha256", keySecret)
        .update(`${gatewayOrderId}|${paymentId}`)
        .digest("hex");
      return expected === signature;
    }
    return true;
  }

  async refundPayment(paymentId: string, amount: number, _reason: string): Promise<{ refundId: string; status: string }> {
    const rz = this.getRazorpay();
    if (rz) {
      const refund = await rz.payments.refund(paymentId, { amount: Math.round(amount * 100) });
      return { refundId: String(refund.id), status: "processed" };
    }
    return { refundId: `rfnd_mock_${Date.now()}`, status: "processed" };
  }
}

// Manual Gateway (for COD and bank transfers)
class ManualGateway implements PaymentGateway {
  async createOrder(amount: number, currency: string): Promise<GatewayOrder> {
    return {
      gatewayOrderId: `manual_${Date.now()}`,
      amount,
      currency,
      status: "pending",
    };
  }

  async verifyPayment(): Promise<boolean> {
    return true;
  }

  async refundPayment(_paymentId: string, amount: number): Promise<{ refundId: string; status: string }> {
    return { refundId: `manual_rfnd_${Date.now()}`, status: "processed" };
  }
}

@Injectable()
export class PaymentService {
  private readonly gateways: Map<string, PaymentGateway>;

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: DatabaseInstance,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext("PaymentService");
    this.gateways = new Map<string, PaymentGateway>([
      ["razorpay", new RazorpayGateway()],
      ["manual", new ManualGateway()],
      ["cod", new ManualGateway()],
    ]);
  }

  async createPaymentOrder(
    tenantId: string,
    orderId: string,
    gateway: string,
    method?: string,
  ): Promise<Record<string, unknown>> {
    const [order] = await this.db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.tenantId, tenantId)))
      .limit(1);

    if (!order) {
      throw new AppError("ORDER_NOT_FOUND", "Order not found", HttpStatus.NOT_FOUND);
    }

    const gatewayInstance = this.gateways.get(gateway);
    if (!gatewayInstance) {
      throw new AppError("INVALID_GATEWAY", `Gateway '${gateway}' not supported`, HttpStatus.BAD_REQUEST);
    }

    const amount = parseFloat(order.grandTotal);
    const gatewayOrder = await gatewayInstance.createOrder(amount, order.currency, {
      orderId: order.id,
      orderNumber: order.orderNumber,
    });

    const [payment] = await this.db
      .insert(payments)
      .values({
        tenantId,
        orderId,
        gateway: gateway as typeof payments.gateway.enumValues[number],
        method: method as typeof payments.method.enumValues[number] | undefined,
        status: "pending",
        amount: String(amount),
        currency: order.currency,
        gatewayOrderId: gatewayOrder.gatewayOrderId,
      })
      .returning();

    return { payment, gatewayOrder };
  }

  async verifyPayment(
    tenantId: string,
    gatewayOrderId: string,
    paymentId: string,
    signature: string,
    gateway: string,
  ): Promise<Record<string, unknown>> {
    const gatewayInstance = this.gateways.get(gateway);
    if (!gatewayInstance) {
      throw new AppError("INVALID_GATEWAY", `Gateway '${gateway}' not supported`, HttpStatus.BAD_REQUEST);
    }

    const verified = await gatewayInstance.verifyPayment(gatewayOrderId, paymentId, signature);

    if (!verified) {
      throw new AppError("PAYMENT_VERIFICATION_FAILED", "Payment verification failed", HttpStatus.BAD_REQUEST);
    }

    // Update payment record
    const [payment] = await this.db
      .update(payments)
      .set({
        status: "captured",
        gatewayPaymentId: paymentId,
        gatewaySignature: signature,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(payments.gatewayOrderId, gatewayOrderId),
          eq(payments.tenantId, tenantId),
        ),
      )
      .returning();

    if (payment) {
      // Update order payment status
      await this.db
        .update(orders)
        .set({
          paymentStatus: "captured",
          paymentMethod: gateway,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, payment.orderId));
    }

    return { payment, verified: true };
  }

  async refund(
    tenantId: string,
    paymentId: string,
    amount: number,
    reason: string,
  ): Promise<Record<string, unknown>> {
    const [payment] = await this.db
      .select()
      .from(payments)
      .where(and(eq(payments.id, paymentId), eq(payments.tenantId, tenantId)))
      .limit(1);

    if (!payment) {
      throw new AppError("PAYMENT_NOT_FOUND", "Payment not found", HttpStatus.NOT_FOUND);
    }

    const gatewayInstance = this.gateways.get(payment.gateway);
    if (!gatewayInstance) {
      throw new AppError("INVALID_GATEWAY", "Gateway not configured", HttpStatus.BAD_REQUEST);
    }

    const refundResult = await gatewayInstance.refundPayment(
      payment.gatewayPaymentId ?? "",
      amount,
      reason,
    );

    const [updated] = await this.db
      .update(payments)
      .set({
        status: "refunded",
        refundId: refundResult.refundId,
        refundAmount: String(amount),
        updatedAt: new Date(),
      })
      .where(eq(payments.id, paymentId))
      .returning();

    return updated ?? {};
  }
}
