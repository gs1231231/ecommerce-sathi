import { Injectable, Inject, HttpStatus } from "@nestjs/common";
import { eq, and, sql, desc } from "drizzle-orm";
import { PinoLogger } from "nestjs-pino";
import { products, orders, orderItems, customers } from "@ecommerce-sathi/db";
import { DATABASE_TOKEN, DatabaseInstance } from "../database/database.module";
import { AppError } from "../../common/exceptions/app-error";

@Injectable()
export class RecommendationService {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: DatabaseInstance,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext("RecommendationService");
  }

  async getRecommendations(
    tenantId: string,
    productId: string,
    limit: number = 10,
  ): Promise<unknown[]> {
    // Content-based: find the source product first
    const [sourceProduct] = await this.db
      .select({
        id: products.id,
        tags: products.tags,
        productType: products.productType,
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

    if (!sourceProduct) {
      throw new AppError(
        "PRODUCT_NOT_FOUND",
        "Product not found",
        HttpStatus.NOT_FOUND,
      );
    }

    // Find products with same tags or product type
    const recommended = await this.db
      .select()
      .from(products)
      .where(
        and(
          eq(products.tenantId, tenantId),
          sql`${products.deletedAt} IS NULL`,
          eq(products.status, "active"),
          sql`${products.id} != ${productId}`,
          sql`(${products.tags} && ${sourceProduct.tags ?? []}::text[] OR ${products.productType} = ${sourceProduct.productType})`,
        ),
      )
      .orderBy(desc(products.createdAt))
      .limit(limit);

    this.logger.info(
      { tenantId, productId, count: recommended.length },
      "Recommendations generated",
    );

    return recommended;
  }

  async getPersonalized(
    tenantId: string,
    customerId: string,
    limit: number = 10,
  ): Promise<unknown[]> {
    // MVP: return top-selling products for the tenant
    const topSelling = await this.db
      .select({
        productId: orderItems.productId,
        title: orderItems.title,
        totalQuantity: sql<number>`SUM(${orderItems.quantity})::int`,
      })
      .from(orderItems)
      .where(eq(orderItems.tenantId, tenantId))
      .groupBy(orderItems.productId, orderItems.title)
      .orderBy(sql`SUM(${orderItems.quantity}) DESC`)
      .limit(limit);

    // Fetch full product details for top sellers
    const productIds = topSelling.map((p) => p.productId);
    if (productIds.length === 0) {
      return [];
    }

    const recommendedProducts = await this.db
      .select()
      .from(products)
      .where(
        and(
          eq(products.tenantId, tenantId),
          sql`${products.deletedAt} IS NULL`,
          eq(products.status, "active"),
          sql`${products.id} = ANY(${productIds}::text[])`,
        ),
      )
      .limit(limit);

    this.logger.info(
      { tenantId, customerId, count: recommendedProducts.length },
      "Personalized recommendations generated",
    );

    return recommendedProducts;
  }

  async getTrending(
    tenantId: string,
    limit: number = 10,
  ): Promise<unknown[]> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trending = await this.db
      .select({
        productId: orderItems.productId,
        title: orderItems.title,
        totalQuantity: sql<number>`SUM(${orderItems.quantity})::int`,
        totalRevenue: sql<string>`SUM(${orderItems.total}::numeric)::text`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(
        and(
          eq(orderItems.tenantId, tenantId),
          sql`${orders.createdAt} >= ${sevenDaysAgo}`,
        ),
      )
      .groupBy(orderItems.productId, orderItems.title)
      .orderBy(sql`SUM(${orderItems.quantity}) DESC`)
      .limit(limit);

    this.logger.info(
      { tenantId, count: trending.length },
      "Trending products retrieved",
    );

    return trending;
  }

  async getFrequentlyBoughtTogether(
    tenantId: string,
    productId: string,
  ): Promise<unknown[]> {
    // Find orders containing this product, then find other products in those orders
    const relatedProducts = await this.db
      .select({
        productId: orderItems.productId,
        title: orderItems.title,
        frequency: sql<number>`count(DISTINCT ${orderItems.orderId})::int`,
      })
      .from(orderItems)
      .where(
        and(
          eq(orderItems.tenantId, tenantId),
          sql`${orderItems.productId} != ${productId}`,
          sql`${orderItems.orderId} IN (
            SELECT ${orderItems.orderId} FROM ${orderItems}
            WHERE ${orderItems.productId} = ${productId}
            AND ${orderItems.tenantId} = ${tenantId}
          )`,
        ),
      )
      .groupBy(orderItems.productId, orderItems.title)
      .orderBy(sql`count(DISTINCT ${orderItems.orderId}) DESC`)
      .limit(10);

    this.logger.info(
      { tenantId, productId, count: relatedProducts.length },
      "Frequently bought together retrieved",
    );

    return relatedProducts;
  }
}
