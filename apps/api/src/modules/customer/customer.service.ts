import { Injectable, Inject, HttpStatus } from "@nestjs/common";
import { eq, and, sql, desc, ilike, or } from "drizzle-orm";
import { PinoLogger } from "nestjs-pino";
import { customers, orders } from "@ecommerce-sathi/db";
import { AppError } from "../../common/exceptions/app-error";
import {
  DATABASE_TOKEN,
  DatabaseInstance,
} from "../database/database.module";

interface CustomerFilterOptions {
  page?: number;
  limit?: number;
  search?: string;
  tags?: string[];
}

interface UpdateCustomerInput {
  tags?: string[];
  notes?: string;
  acceptsMarketing?: boolean;
}

interface CustomerSegments {
  new: number;
  returning: number;
  vip: number;
  atRisk: number;
}

@Injectable()
export class CustomerService {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: DatabaseInstance,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext("CustomerService");
  }

  async findAll(
    tenantId: string,
    options: CustomerFilterOptions,
  ): Promise<{
    data: unknown[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;
    const offset = (page - 1) * limit;

    const conditions = [
      eq(customers.tenantId, tenantId),
      sql`${customers.deletedAt} IS NULL`,
    ];

    if (options.search) {
      conditions.push(
        or(
          ilike(customers.name, `%${options.search}%`),
          ilike(customers.email, `%${options.search}%`),
          ilike(customers.phone, `%${options.search}%`),
        )!,
      );
    }

    if (options.tags && options.tags.length > 0) {
      conditions.push(
        sql`${customers.tags} && ARRAY[${sql.join(options.tags.map(t => sql`${t}`), sql`, `)}]::text[]`,
      );
    }

    const where = and(...conditions);

    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(customers)
      .where(where);

    const total = countResult?.count ?? 0;

    const data = await this.db
      .select()
      .from(customers)
      .where(where)
      .orderBy(desc(customers.createdAt))
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

  async findById(
    tenantId: string,
    customerId: string,
  ): Promise<Record<string, unknown>> {
    const [customer] = await this.db
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.id, customerId),
          eq(customers.tenantId, tenantId),
          sql`${customers.deletedAt} IS NULL`,
        ),
      )
      .limit(1);

    if (!customer) {
      throw new AppError(
        "CUSTOMER_NOT_FOUND",
        "Customer not found",
        HttpStatus.NOT_FOUND,
      );
    }

    // Get order history summary
    const [orderSummary] = await this.db
      .select({
        totalOrders: sql<number>`count(*)::int`,
        totalSpent: sql<string>`coalesce(sum(${orders.grandTotal}::numeric), 0)::text`,
        lastOrderAt: sql<Date | null>`max(${orders.createdAt})`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.customerId, customerId),
          eq(orders.tenantId, tenantId),
        ),
      );

    return {
      ...customer,
      orderSummary: {
        totalOrders: orderSummary?.totalOrders ?? 0,
        totalSpent: orderSummary?.totalSpent ?? "0",
        lastOrderAt: orderSummary?.lastOrderAt ?? null,
      },
    };
  }

  async update(
    tenantId: string,
    customerId: string,
    input: UpdateCustomerInput,
  ): Promise<Record<string, unknown>> {
    const [existing] = await this.db
      .select({ id: customers.id })
      .from(customers)
      .where(
        and(
          eq(customers.id, customerId),
          eq(customers.tenantId, tenantId),
          sql`${customers.deletedAt} IS NULL`,
        ),
      )
      .limit(1);

    if (!existing) {
      throw new AppError(
        "CUSTOMER_NOT_FOUND",
        "Customer not found",
        HttpStatus.NOT_FOUND,
      );
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (input.tags !== undefined) updateData.tags = input.tags;
    if (input.notes !== undefined) updateData.notes = input.notes;
    if (input.acceptsMarketing !== undefined)
      updateData.acceptsMarketing = input.acceptsMarketing;

    await this.db
      .update(customers)
      .set(updateData)
      .where(
        and(eq(customers.id, customerId), eq(customers.tenantId, tenantId)),
      );

    this.logger.info(
      { tenantId, customerId },
      "Customer updated",
    );

    return this.findById(tenantId, customerId);
  }

  async getSegments(tenantId: string): Promise<CustomerSegments> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const baseConditions = and(
      eq(customers.tenantId, tenantId),
      sql`${customers.deletedAt} IS NULL`,
    );

    // New customers: created within last 30 days
    const [newCount] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(customers)
      .where(
        and(
          baseConditions,
          sql`${customers.createdAt} >= ${thirtyDaysAgo.toISOString()}::timestamptz`,
        ),
      );

    // Returning customers: 2+ orders
    const [returningCount] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(customers)
      .where(
        and(
          baseConditions,
          sql`${customers.totalOrders} >= 2`,
        ),
      );

    // VIP customers: >10 orders or >50k spent
    const [vipCount] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(customers)
      .where(
        and(
          baseConditions,
          or(
            sql`${customers.totalOrders} > 10`,
            sql`${customers.totalSpent}::numeric > 50000`,
          ),
        ),
      );

    // At risk: no order in 90 days (has at least 1 order but last order > 90 days ago)
    const [atRiskCount] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(customers)
      .where(
        and(
          baseConditions,
          sql`${customers.totalOrders} > 0`,
          sql`${customers.id} NOT IN (
            SELECT DISTINCT ${orders.customerId}
            FROM ${orders}
            WHERE ${orders.tenantId} = ${tenantId}
              AND ${orders.createdAt} >= ${ninetyDaysAgo.toISOString()}::timestamptz
              AND ${orders.customerId} IS NOT NULL
          )`,
        ),
      );

    return {
      new: newCount?.count ?? 0,
      returning: returningCount?.count ?? 0,
      vip: vipCount?.count ?? 0,
      atRisk: atRiskCount?.count ?? 0,
    };
  }
}
