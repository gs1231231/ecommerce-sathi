import { Injectable, Inject, HttpStatus } from "@nestjs/common";
import { eq, and, sql, desc } from "drizzle-orm";
import { PinoLogger } from "nestjs-pino";
import { discounts } from "@ecommerce-sathi/db";
import { AppError } from "../../common/exceptions/app-error";
import {
  DATABASE_TOKEN,
  DatabaseInstance,
} from "../database/database.module";

interface CreateDiscountInput {
  code: string;
  title: string;
  type: "percentage" | "fixed_amount" | "buy_x_get_y" | "free_shipping";
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  perCustomerLimit?: number;
  isActive?: boolean;
  startsAt?: string;
  endsAt?: string;
  conditions?: Record<string, unknown>;
}

interface UpdateDiscountInput {
  title?: string;
  type?: "percentage" | "fixed_amount" | "buy_x_get_y" | "free_shipping";
  value?: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  perCustomerLimit?: number;
  isActive?: boolean;
  startsAt?: string;
  endsAt?: string;
  conditions?: Record<string, unknown>;
}

interface DiscountFilterOptions {
  page?: number;
  limit?: number;
  isActive?: boolean;
}

interface ValidateResult {
  valid: boolean;
  discount?: Record<string, unknown>;
  discountAmount?: number;
  reason?: string;
}

@Injectable()
export class DiscountService {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: DatabaseInstance,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext("DiscountService");
  }

  async create(
    tenantId: string,
    input: CreateDiscountInput,
  ): Promise<Record<string, unknown>> {
    // Check code uniqueness per tenant
    const [existing] = await this.db
      .select({ id: discounts.id })
      .from(discounts)
      .where(
        and(
          eq(discounts.tenantId, tenantId),
          eq(discounts.code, input.code.toUpperCase()),
          sql`${discounts.deletedAt} IS NULL`,
        ),
      )
      .limit(1);

    if (existing) {
      throw new AppError(
        "DISCOUNT_CODE_EXISTS",
        `Discount code '${input.code}' already exists`,
        HttpStatus.CONFLICT,
      );
    }

    const [discount] = await this.db
      .insert(discounts)
      .values({
        tenantId,
        code: input.code.toUpperCase(),
        title: input.title,
        type: input.type,
        value: String(input.value),
        minOrderAmount: input.minOrderAmount !== undefined ? String(input.minOrderAmount) : undefined,
        maxDiscount: input.maxDiscount !== undefined ? String(input.maxDiscount) : undefined,
        usageLimit: input.usageLimit,
        perCustomerLimit: input.perCustomerLimit,
        isActive: input.isActive ?? true,
        startsAt: input.startsAt ? new Date(input.startsAt) : undefined,
        endsAt: input.endsAt ? new Date(input.endsAt) : undefined,
        conditions: input.conditions,
      })
      .returning();

    if (!discount) {
      throw new AppError(
        "DISCOUNT_CREATE_FAILED",
        "Failed to create discount",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    this.logger.info(
      { tenantId, discountId: discount.id },
      "Discount created",
    );

    return discount;
  }

  async findAll(
    tenantId: string,
    options: DiscountFilterOptions,
  ): Promise<{
    data: unknown[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;
    const offset = (page - 1) * limit;

    const conditions = [
      eq(discounts.tenantId, tenantId),
      sql`${discounts.deletedAt} IS NULL`,
    ];

    if (options.isActive !== undefined) {
      conditions.push(eq(discounts.isActive, options.isActive));
    }

    const where = and(...conditions);

    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(discounts)
      .where(where);

    const total = countResult?.count ?? 0;

    const data = await this.db
      .select()
      .from(discounts)
      .where(where)
      .orderBy(desc(discounts.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByCode(
    tenantId: string,
    code: string,
  ): Promise<Record<string, unknown>> {
    const [discount] = await this.db
      .select()
      .from(discounts)
      .where(
        and(
          eq(discounts.tenantId, tenantId),
          eq(discounts.code, code.toUpperCase()),
          sql`${discounts.deletedAt} IS NULL`,
        ),
      )
      .limit(1);

    if (!discount) {
      throw new AppError(
        "DISCOUNT_NOT_FOUND",
        "Discount not found",
        HttpStatus.NOT_FOUND,
      );
    }

    return discount;
  }

  async findById(
    tenantId: string,
    discountId: string,
  ): Promise<Record<string, unknown>> {
    const [discount] = await this.db
      .select()
      .from(discounts)
      .where(
        and(
          eq(discounts.id, discountId),
          eq(discounts.tenantId, tenantId),
          sql`${discounts.deletedAt} IS NULL`,
        ),
      )
      .limit(1);

    if (!discount) {
      throw new AppError(
        "DISCOUNT_NOT_FOUND",
        "Discount not found",
        HttpStatus.NOT_FOUND,
      );
    }

    return discount;
  }

  async validateDiscount(
    tenantId: string,
    code: string,
    orderAmount: number,
    _customerId: string,
  ): Promise<ValidateResult> {
    const [discount] = await this.db
      .select()
      .from(discounts)
      .where(
        and(
          eq(discounts.tenantId, tenantId),
          eq(discounts.code, code.toUpperCase()),
          sql`${discounts.deletedAt} IS NULL`,
        ),
      )
      .limit(1);

    if (!discount) {
      return { valid: false, reason: "Discount code not found" };
    }

    // Check if active
    if (!discount.isActive) {
      return { valid: false, reason: "Discount code is inactive" };
    }

    // Check date range
    const now = new Date();
    if (discount.startsAt && now < discount.startsAt) {
      return { valid: false, reason: "Discount code is not yet active" };
    }
    if (discount.endsAt && now > discount.endsAt) {
      return { valid: false, reason: "Discount code has expired" };
    }

    // Check usage limit
    if (
      discount.usageLimit !== null &&
      discount.usageCount >= discount.usageLimit
    ) {
      return { valid: false, reason: "Discount code usage limit reached" };
    }

    // Check minimum order amount
    if (
      discount.minOrderAmount !== null &&
      orderAmount < parseFloat(discount.minOrderAmount)
    ) {
      return {
        valid: false,
        reason: `Minimum order amount of ${discount.minOrderAmount} required`,
      };
    }

    // Calculate discount amount
    let discountAmount = 0;
    const value = parseFloat(discount.value);

    if (discount.type === "percentage") {
      discountAmount = (orderAmount * value) / 100;
      // Apply max discount cap
      if (
        discount.maxDiscount !== null &&
        discountAmount > parseFloat(discount.maxDiscount)
      ) {
        discountAmount = parseFloat(discount.maxDiscount);
      }
    } else if (discount.type === "fixed_amount") {
      discountAmount = value;
      if (discountAmount > orderAmount) {
        discountAmount = orderAmount;
      }
    } else if (discount.type === "free_shipping") {
      discountAmount = 0; // Shipping discount handled separately
    }

    return {
      valid: true,
      discount,
      discountAmount: Math.round(discountAmount * 100) / 100,
    };
  }

  async incrementUsage(discountId: string): Promise<void> {
    await this.db
      .update(discounts)
      .set({
        usageCount: sql`${discounts.usageCount} + 1`,
      })
      .where(eq(discounts.id, discountId));

    this.logger.info({ discountId }, "Discount usage incremented");
  }

  async update(
    tenantId: string,
    discountId: string,
    input: UpdateDiscountInput,
  ): Promise<Record<string, unknown>> {
    const [existing] = await this.db
      .select({ id: discounts.id })
      .from(discounts)
      .where(
        and(
          eq(discounts.id, discountId),
          eq(discounts.tenantId, tenantId),
          sql`${discounts.deletedAt} IS NULL`,
        ),
      )
      .limit(1);

    if (!existing) {
      throw new AppError(
        "DISCOUNT_NOT_FOUND",
        "Discount not found",
        HttpStatus.NOT_FOUND,
      );
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (input.title !== undefined) updateData.title = input.title;
    if (input.type !== undefined) updateData.type = input.type;
    if (input.value !== undefined) updateData.value = String(input.value);
    if (input.minOrderAmount !== undefined)
      updateData.minOrderAmount = input.minOrderAmount !== null ? String(input.minOrderAmount) : null;
    if (input.maxDiscount !== undefined)
      updateData.maxDiscount = input.maxDiscount !== null ? String(input.maxDiscount) : null;
    if (input.usageLimit !== undefined) updateData.usageLimit = input.usageLimit;
    if (input.perCustomerLimit !== undefined)
      updateData.perCustomerLimit = input.perCustomerLimit;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;
    if (input.startsAt !== undefined)
      updateData.startsAt = input.startsAt ? new Date(input.startsAt) : null;
    if (input.endsAt !== undefined)
      updateData.endsAt = input.endsAt ? new Date(input.endsAt) : null;
    if (input.conditions !== undefined) updateData.conditions = input.conditions;

    await this.db
      .update(discounts)
      .set(updateData)
      .where(
        and(eq(discounts.id, discountId), eq(discounts.tenantId, tenantId)),
      );

    this.logger.info(
      { tenantId, discountId },
      "Discount updated",
    );

    return this.findById(tenantId, discountId);
  }

  async deactivate(
    tenantId: string,
    discountId: string,
  ): Promise<void> {
    const [existing] = await this.db
      .select({ id: discounts.id })
      .from(discounts)
      .where(
        and(
          eq(discounts.id, discountId),
          eq(discounts.tenantId, tenantId),
          sql`${discounts.deletedAt} IS NULL`,
        ),
      )
      .limit(1);

    if (!existing) {
      throw new AppError(
        "DISCOUNT_NOT_FOUND",
        "Discount not found",
        HttpStatus.NOT_FOUND,
      );
    }

    await this.db
      .update(discounts)
      .set({ isActive: false, updatedAt: new Date() })
      .where(
        and(eq(discounts.id, discountId), eq(discounts.tenantId, tenantId)),
      );

    this.logger.info(
      { tenantId, discountId },
      "Discount deactivated",
    );
  }
}
