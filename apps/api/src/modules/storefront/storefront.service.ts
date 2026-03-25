import { Injectable, Inject, HttpStatus } from "@nestjs/common";
import { eq, and, asc } from "drizzle-orm";
import { PinoLogger } from "nestjs-pino";
import {
  products,
  productVariants,
  productImages,
  categories,
  tenants,
} from "@ecommerce-sathi/db";
import { AppError } from "../../common/exceptions/app-error";
import { DATABASE_TOKEN, DatabaseInstance } from "../database/database.module";

@Injectable()
export class StorefrontService {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: DatabaseInstance,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext("StorefrontService");
  }

  async getStoreBySlug(slug: string): Promise<Record<string, unknown>> {
    const [tenant] = await this.db
      .select({
        id: tenants.id,
        name: tenants.name,
        slug: tenants.slug,
        logoUrl: tenants.logoUrl,
        settings: tenants.settings,
      })
      .from(tenants)
      .where(and(eq(tenants.slug, slug), eq(tenants.status, "active")))
      .limit(1);

    if (!tenant) {
      throw new AppError("STORE_NOT_FOUND", "Store not found", HttpStatus.NOT_FOUND);
    }

    return tenant;
  }

  async getActiveProducts(
    tenantId: string,
    options: { page?: number; limit?: number; categorySlug?: string; search?: string },
  ): Promise<{ data: unknown[]; meta: { page: number; limit: number; total: number } }> {
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;
    const offset = (page - 1) * limit;

    const data = await this.db
      .select()
      .from(products)
      .where(
        and(
          eq(products.tenantId, tenantId),
          eq(products.status, "active"),
        ),
      )
      .orderBy(asc(products.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data,
      meta: { page, limit, total: data.length },
    };
  }

  async getProductBySlug(
    tenantId: string,
    slug: string,
  ): Promise<Record<string, unknown>> {
    const [product] = await this.db
      .select()
      .from(products)
      .where(
        and(
          eq(products.tenantId, tenantId),
          eq(products.slug, slug),
          eq(products.status, "active"),
        ),
      )
      .limit(1);

    if (!product) {
      throw new AppError("PRODUCT_NOT_FOUND", "Product not found", HttpStatus.NOT_FOUND);
    }

    const variants = await this.db
      .select()
      .from(productVariants)
      .where(
        and(
          eq(productVariants.productId, product.id),
          eq(productVariants.isActive, true),
        ),
      )
      .orderBy(asc(productVariants.position));

    const images = await this.db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, product.id))
      .orderBy(asc(productImages.position));

    return { ...product, variants, images };
  }

  async getCategories(tenantId: string): Promise<unknown[]> {
    return this.db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.tenantId, tenantId),
          eq(categories.isActive, true),
        ),
      )
      .orderBy(asc(categories.position));
  }
}
