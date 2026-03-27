import { Injectable, Inject } from "@nestjs/common";
import { eq, and, sql } from "drizzle-orm";
import { PinoLogger } from "nestjs-pino";
import { orders, orderItems, customers, products } from "@ecommerce-sathi/db";
import { DATABASE_TOKEN, DatabaseInstance } from "../database/database.module";

@Injectable()
export class AnalyticsService {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: DatabaseInstance,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext("AnalyticsService");
  }

  async getDashboardStats(
    tenantId: string,
    period: "today" | "7d" | "30d" | "90d",
  ): Promise<Record<string, unknown>> {
    const now = new Date();
    const startDate = new Date();

    switch (period) {
      case "today":
        startDate.setHours(0, 0, 0, 0);
        break;
      case "7d":
        startDate.setDate(now.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(now.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(now.getDate() - 90);
        break;
    }

    const [orderStats] = await this.db
      .select({
        totalOrders: sql<number>`count(*)::int`,
        totalRevenue: sql<string>`COALESCE(SUM(${orders.grandTotal}::numeric), 0)::text`,
        avgOrderValue: sql<string>`COALESCE(AVG(${orders.grandTotal}::numeric), 0)::text`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.tenantId, tenantId),
          sql`${orders.createdAt} >= ${startDate.toISOString()}::timestamptz`,
        ),
      );

    const [customerStats] = await this.db
      .select({
        totalCustomers: sql<number>`count(*)::int`,
        newCustomers: sql<number>`count(*) FILTER (WHERE ${customers.createdAt} >= ${startDate.toISOString()}::timestamptz)::int`,
      })
      .from(customers)
      .where(eq(customers.tenantId, tenantId));

    const [productStats] = await this.db
      .select({
        totalProducts: sql<number>`count(*)::int`,
        activeProducts: sql<number>`count(*) FILTER (WHERE ${products.status} = 'active')::int`,
      })
      .from(products)
      .where(
        and(
          eq(products.tenantId, tenantId),
          sql`${products.deletedAt} IS NULL`,
        ),
      );

    return {
      period,
      orders: {
        total: orderStats?.totalOrders ?? 0,
        revenue: orderStats?.totalRevenue ?? "0",
        avgOrderValue: orderStats?.avgOrderValue ?? "0",
      },
      customers: {
        total: customerStats?.totalCustomers ?? 0,
        new: customerStats?.newCustomers ?? 0,
      },
      products: {
        total: productStats?.totalProducts ?? 0,
        active: productStats?.activeProducts ?? 0,
      },
    };
  }

  async getTopProducts(
    tenantId: string,
    limit: number = 10,
  ): Promise<unknown[]> {
    const topProducts = await this.db
      .select({
        productId: orderItems.productId,
        title: orderItems.title,
        totalQuantity: sql<number>`SUM(${orderItems.quantity})::int`,
        totalRevenue: sql<string>`SUM(${orderItems.total}::numeric)::text`,
      })
      .from(orderItems)
      .where(eq(orderItems.tenantId, tenantId))
      .groupBy(orderItems.productId, orderItems.title)
      .orderBy(sql`SUM(${orderItems.quantity}) DESC`)
      .limit(limit);

    return topProducts;
  }

  async getRevenueByDay(
    tenantId: string,
    days: number = 30,
  ): Promise<unknown[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const dailyRevenue = await this.db
      .select({
        date: sql<string>`DATE(${orders.createdAt})::text`,
        orders: sql<number>`count(*)::int`,
        revenue: sql<string>`COALESCE(SUM(${orders.grandTotal}::numeric), 0)::text`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.tenantId, tenantId),
          sql`${orders.createdAt} >= ${startDate.toISOString()}::timestamptz`,
        ),
      )
      .groupBy(sql`DATE(${orders.createdAt})`)
      .orderBy(sql`DATE(${orders.createdAt})`);

    return dailyRevenue;
  }

  async getOrdersByStatus(tenantId: string): Promise<unknown[]> {
    const statusBreakdown = await this.db
      .select({
        status: orders.status,
        count: sql<number>`count(*)::int`,
      })
      .from(orders)
      .where(eq(orders.tenantId, tenantId))
      .groupBy(orders.status);

    return statusBreakdown;
  }
}
