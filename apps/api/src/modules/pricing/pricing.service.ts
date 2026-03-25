import { Injectable, Inject, HttpStatus } from "@nestjs/common";
import { eq, and, sql, desc } from "drizzle-orm";
import { PinoLogger } from "nestjs-pino";
import { products, customers } from "@ecommerce-sathi/db";
import { DATABASE_TOKEN, DatabaseInstance } from "../database/database.module";
import { AppError } from "../../common/exceptions/app-error";

interface PricingContext {
  quantity?: number;
  customerId?: string;
  time?: string;
}

interface PricingRule {
  id: string;
  tenantId: string;
  productId?: string;
  categoryId?: string;
  ruleType: string;
  value: number;
  conditions: Record<string, unknown>;
  createdAt: Date;
}

interface DiscountEntry {
  type: string;
  label: string;
  percentage: number;
  amount: string;
}

interface PricingResult {
  originalPrice: string;
  finalPrice: string;
  discounts: DiscountEntry[];
}

// In-memory rule storage (per-tenant)
const pricingRulesStore = new Map<string, PricingRule[]>();

@Injectable()
export class PricingService {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: DatabaseInstance,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext("PricingService");
  }

  async calculateDynamicPrice(
    tenantId: string,
    productId: string,
    context: PricingContext,
  ): Promise<PricingResult> {
    // Fetch product price from the first active variant
    const [product] = await this.db
      .select({
        id: products.id,
        title: products.title,
      })
      .from(products)
      .where(
        and(
          eq(products.id, productId),
          eq(products.tenantId, tenantId),
          sql`${products.deletedAt} IS NULL`,
        ),
      )
      .limit(1);

    if (!product) {
      throw new AppError(
        "PRODUCT_NOT_FOUND",
        "Product not found",
        HttpStatus.NOT_FOUND,
      );
    }

    // Get product price from variant
    const [variant] = await this.db
      .select({
        price: sql<string>`price`,
      })
      .from(sql`product_variants`)
      .where(
        and(
          sql`product_id = ${productId}`,
          sql`tenant_id = ${tenantId}`,
          sql`is_active = true`,
        ),
      )
      .limit(1);

    const originalPrice = variant?.price ?? "0";
    let price = parseFloat(originalPrice);
    const discounts: DiscountEntry[] = [];

    // Rule 1: Bulk discount
    const quantity = context.quantity ?? 1;
    if (quantity >= 10) {
      const discountAmount = price * 0.1;
      discounts.push({
        type: "bulk",
        label: "Bulk discount (10+ items): 10% off",
        percentage: 10,
        amount: discountAmount.toFixed(2),
      });
      price -= discountAmount;
    } else if (quantity >= 5) {
      const discountAmount = price * 0.05;
      discounts.push({
        type: "bulk",
        label: "Bulk discount (5+ items): 5% off",
        percentage: 5,
        amount: discountAmount.toFixed(2),
      });
      price -= discountAmount;
    }

    // Rule 2: VIP customer discount
    if (context.customerId) {
      const [customer] = await this.db
        .select({
          totalOrders: customers.totalOrders,
        })
        .from(customers)
        .where(
          and(
            eq(customers.id, context.customerId),
            eq(customers.tenantId, tenantId),
          ),
        )
        .limit(1);

      if (customer && (customer.totalOrders ?? 0) > 10) {
        const discountAmount = price * 0.05;
        discounts.push({
          type: "vip",
          label: "VIP customer discount: 5% off",
          percentage: 5,
          amount: discountAmount.toFixed(2),
        });
        price -= discountAmount;
      }
    }

    // Rule 3: Time-based (weekend = no change for MVP)
    // No-op for now

    // Apply any custom in-memory rules
    const tenantRules = pricingRulesStore.get(tenantId) ?? [];
    for (const rule of tenantRules) {
      if (rule.productId && rule.productId !== productId) continue;
      if (rule.ruleType === "percentage_discount") {
        const discountAmount = price * (rule.value / 100);
        discounts.push({
          type: "custom_rule",
          label: `Custom rule: ${rule.value}% off`,
          percentage: rule.value,
          amount: discountAmount.toFixed(2),
        });
        price -= discountAmount;
      } else if (rule.ruleType === "fixed_discount") {
        discounts.push({
          type: "custom_rule",
          label: `Custom rule: flat ${rule.value} off`,
          percentage: 0,
          amount: String(rule.value),
        });
        price -= rule.value;
      }
    }

    const finalPrice = Math.max(price, 0).toFixed(2);

    this.logger.info(
      { tenantId, productId, originalPrice, finalPrice, discountCount: discounts.length },
      "Dynamic price calculated",
    );

    return {
      originalPrice,
      finalPrice,
      discounts,
    };
  }

  async getPriceHistory(
    tenantId: string,
    productId: string,
  ): Promise<Array<{ date: string; price: string }>> {
    // Mock price history for MVP
    const today = new Date();
    const history: Array<{ date: string; price: string }> = [];

    // Fetch current price
    const [variant] = await this.db
      .select({
        price: sql<string>`price`,
      })
      .from(sql`product_variants`)
      .where(
        and(
          sql`product_id = ${productId}`,
          sql`tenant_id = ${tenantId}`,
          sql`is_active = true`,
        ),
      )
      .limit(1);

    const currentPrice = parseFloat(variant?.price ?? "100");

    for (let i = 30; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      // Simulate slight price variations (+/- 5%)
      const variation = 1 + (Math.sin(i * 0.5) * 0.05);
      history.push({
        date: date.toISOString().split("T")[0] as string,
        price: (currentPrice * variation).toFixed(2),
      });
    }

    return history;
  }

  setRule(
    tenantId: string,
    input: {
      productId?: string;
      categoryId?: string;
      ruleType: string;
      value: number;
      conditions?: Record<string, unknown>;
    },
  ): PricingRule {
    const rule: PricingRule = {
      id: crypto.randomUUID(),
      tenantId,
      productId: input.productId,
      categoryId: input.categoryId,
      ruleType: input.ruleType,
      value: input.value,
      conditions: input.conditions ?? {},
      createdAt: new Date(),
    };

    const existing = pricingRulesStore.get(tenantId) ?? [];
    existing.push(rule);
    pricingRulesStore.set(tenantId, existing);

    this.logger.info(
      { tenantId, ruleId: rule.id, ruleType: rule.ruleType },
      "Pricing rule created",
    );

    return rule;
  }

  listRules(tenantId: string): PricingRule[] {
    return pricingRulesStore.get(tenantId) ?? [];
  }
}
