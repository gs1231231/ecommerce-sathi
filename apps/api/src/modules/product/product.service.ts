import { Injectable, Inject, HttpStatus } from "@nestjs/common";
import { eq, and, ilike, sql, desc, asc, inArray } from "drizzle-orm";
import { PinoLogger } from "nestjs-pino";
import {
  products,
  productVariants,
  productImages,
  productCategories,
} from "@ecommerce-sathi/db";
import { AppError } from "../../common/exceptions/app-error";
import {
  DATABASE_TOKEN,
  DatabaseInstance,
} from "../database/database.module";

interface CreateProductInput {
  title: string;
  description?: string;
  descriptionHtml?: string;
  status?: "draft" | "active" | "archived";
  productType?: "physical" | "digital" | "service" | "subscription";
  vendor?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  seoTitle?: string;
  seoDescription?: string;
  categoryIds?: string[];
  variants: Array<{
    title: string;
    sku?: string;
    price: number;
    compareAtPrice?: number;
    costPrice?: number;
    inventoryQuantity?: number;
    trackInventory?: boolean;
    allowBackorder?: boolean;
    hsnCode?: string;
    gstRate?: number;
    weight?: number;
    weightUnit?: "g" | "kg";
    option1Name?: string;
    option1Value?: string;
    option2Name?: string;
    option2Value?: string;
    option3Name?: string;
    option3Value?: string;
    imageUrl?: string;
    isActive?: boolean;
  }>;
}

interface ProductFilterOptions {
  page?: number;
  limit?: number;
  status?: "draft" | "active" | "archived";
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

@Injectable()
export class ProductService {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: DatabaseInstance,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext("ProductService");
  }

  async create(
    tenantId: string,
    userId: string,
    input: CreateProductInput,
  ): Promise<Record<string, unknown>> {
    const slug = await this.generateUniqueSlug(tenantId, input.title);

    // Validate SKU uniqueness
    for (const variant of input.variants) {
      if (variant.sku) {
        await this.validateSkuUniqueness(tenantId, variant.sku);
      }
    }

    const result = await this.db.transaction(async (tx: DatabaseInstance) => {
      const [product] = await tx
        .insert(products)
        .values({
          tenantId,
          title: input.title,
          slug,
          description: input.description,
          descriptionHtml: input.descriptionHtml,
          status: input.status ?? "draft",
          productType: input.productType ?? "physical",
          vendor: input.vendor,
          tags: input.tags,
          metadata: input.metadata,
          seoTitle: input.seoTitle ?? input.title,
          seoDescription: input.seoDescription,
          createdBy: userId,
        })
        .returning();

      if (!product) {
        throw new AppError(
          "PRODUCT_CREATE_FAILED",
          "Failed to create product",
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // Insert variants
      const variantValues = input.variants.map((v, i) => ({
        tenantId,
        productId: product.id,
        title: v.title,
        sku: v.sku,
        price: String(v.price),
        compareAtPrice: v.compareAtPrice ? String(v.compareAtPrice) : undefined,
        costPrice: v.costPrice ? String(v.costPrice) : undefined,
        inventoryQuantity: v.inventoryQuantity ?? 0,
        trackInventory: v.trackInventory ?? true,
        allowBackorder: v.allowBackorder ?? false,
        hsnCode: v.hsnCode,
        gstRate: v.gstRate !== undefined ? String(v.gstRate) : undefined,
        weight: v.weight ? String(v.weight) : undefined,
        weightUnit: v.weightUnit,
        option1Name: v.option1Name,
        option1Value: v.option1Value,
        option2Name: v.option2Name,
        option2Value: v.option2Value,
        option3Name: v.option3Name,
        option3Value: v.option3Value,
        imageUrl: v.imageUrl,
        position: i,
        isActive: v.isActive ?? true,
      }));

      const insertedVariants = await tx
        .insert(productVariants)
        .values(variantValues)
        .returning();

      // Insert category associations
      if (input.categoryIds && input.categoryIds.length > 0) {
        await tx.insert(productCategories).values(
          input.categoryIds.map((catId, i) => ({
            productId: product.id,
            categoryId: catId,
            tenantId,
            position: i,
          })),
        );
      }

      return { ...product, variants: insertedVariants };
    });

    this.logger.info(
      { tenantId, productId: result.id },
      "Product created",
    );

    return result;
  }

  async findAll(
    tenantId: string,
    options: ProductFilterOptions,
  ): Promise<{ data: unknown[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;
    const offset = (page - 1) * limit;

    const conditions = [
      eq(products.tenantId, tenantId),
      sql`${products.deletedAt} IS NULL`,
    ];

    if (options.status) {
      conditions.push(eq(products.status, options.status));
    }

    if (options.search) {
      conditions.push(
        ilike(products.title, `%${options.search}%`),
      );
    }

    const where = and(...conditions);

    // Get total count
    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(where);

    const total = countResult?.count ?? 0;

    // Determine sort
    const sortColumn =
      options.sortBy === "title"
        ? products.title
        : products.createdAt;
    const sortFn = options.sortOrder === "asc" ? asc : desc;

    const data = await this.db
      .select()
      .from(products)
      .where(where)
      .orderBy(sortFn(sortColumn))
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
    productId: string,
  ): Promise<Record<string, unknown>> {
    const [product] = await this.db
      .select()
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

    const variants = await this.db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, productId))
      .orderBy(asc(productVariants.position));

    const images = await this.db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, productId))
      .orderBy(asc(productImages.position));

    return { ...product, variants, images };
  }

  async update(
    tenantId: string,
    productId: string,
    input: Partial<CreateProductInput>,
  ): Promise<Record<string, unknown>> {
    const existing = await this.findById(tenantId, productId);
    if (!existing) {
      throw new AppError("PRODUCT_NOT_FOUND", "Product not found", HttpStatus.NOT_FOUND);
    }

    const updateData: Record<string, unknown> = {};
    if (input.title !== undefined) {
      updateData.title = input.title;
      updateData.slug = await this.generateUniqueSlug(tenantId, input.title, productId);
    }
    if (input.description !== undefined) updateData.description = input.description;
    if (input.descriptionHtml !== undefined) updateData.descriptionHtml = input.descriptionHtml;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.vendor !== undefined) updateData.vendor = input.vendor;
    if (input.tags !== undefined) updateData.tags = input.tags;
    if (input.metadata !== undefined) updateData.metadata = input.metadata;
    if (input.seoTitle !== undefined) updateData.seoTitle = input.seoTitle;
    if (input.seoDescription !== undefined) updateData.seoDescription = input.seoDescription;

    if (Object.keys(updateData).length > 0) {
      updateData.updatedAt = new Date();
      await this.db
        .update(products)
        .set(updateData)
        .where(
          and(eq(products.id, productId), eq(products.tenantId, tenantId)),
        );
    }

    return this.findById(tenantId, productId);
  }

  async softDelete(tenantId: string, productId: string): Promise<void> {
    const [product] = await this.db
      .select({ id: products.id })
      .from(products)
      .where(
        and(eq(products.id, productId), eq(products.tenantId, tenantId)),
      )
      .limit(1);

    if (!product) {
      throw new AppError("PRODUCT_NOT_FOUND", "Product not found", HttpStatus.NOT_FOUND);
    }

    await this.db
      .update(products)
      .set({ deletedAt: new Date() })
      .where(eq(products.id, productId));
  }

  async addVariant(
    tenantId: string,
    productId: string,
    input: CreateProductInput["variants"][0],
  ): Promise<unknown> {
    await this.findById(tenantId, productId);

    if (input.sku) {
      await this.validateSkuUniqueness(tenantId, input.sku);
    }

    const [variant] = await this.db
      .insert(productVariants)
      .values({
        tenantId,
        productId,
        title: input.title,
        sku: input.sku,
        price: String(input.price),
        compareAtPrice: input.compareAtPrice ? String(input.compareAtPrice) : undefined,
        costPrice: input.costPrice ? String(input.costPrice) : undefined,
        inventoryQuantity: input.inventoryQuantity ?? 0,
        trackInventory: input.trackInventory ?? true,
        hsnCode: input.hsnCode,
        gstRate: input.gstRate !== undefined ? String(input.gstRate) : undefined,
        option1Name: input.option1Name,
        option1Value: input.option1Value,
        option2Name: input.option2Name,
        option2Value: input.option2Value,
        option3Name: input.option3Name,
        option3Value: input.option3Value,
        imageUrl: input.imageUrl,
        isActive: input.isActive ?? true,
      })
      .returning();

    return variant;
  }

  async updateVariant(
    tenantId: string,
    productId: string,
    variantId: string,
    input: Partial<CreateProductInput["variants"][0]>,
  ): Promise<unknown> {
    const [existing] = await this.db
      .select()
      .from(productVariants)
      .where(
        and(
          eq(productVariants.id, variantId),
          eq(productVariants.productId, productId),
          eq(productVariants.tenantId, tenantId),
        ),
      )
      .limit(1);

    if (!existing) {
      throw new AppError("VARIANT_NOT_FOUND", "Variant not found", HttpStatus.NOT_FOUND);
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (input.title !== undefined) updateData.title = input.title;
    if (input.sku !== undefined) {
      await this.validateSkuUniqueness(tenantId, input.sku, variantId);
      updateData.sku = input.sku;
    }
    if (input.price !== undefined) updateData.price = String(input.price);
    if (input.inventoryQuantity !== undefined) updateData.inventoryQuantity = input.inventoryQuantity;
    if (input.hsnCode !== undefined) updateData.hsnCode = input.hsnCode;
    if (input.gstRate !== undefined) updateData.gstRate = String(input.gstRate);
    if (input.isActive !== undefined) updateData.isActive = input.isActive;

    const [updated] = await this.db
      .update(productVariants)
      .set(updateData)
      .where(eq(productVariants.id, variantId))
      .returning();

    return updated;
  }

  async deleteVariant(
    tenantId: string,
    productId: string,
    variantId: string,
  ): Promise<void> {
    const [existing] = await this.db
      .select({ id: productVariants.id })
      .from(productVariants)
      .where(
        and(
          eq(productVariants.id, variantId),
          eq(productVariants.productId, productId),
          eq(productVariants.tenantId, tenantId),
        ),
      )
      .limit(1);

    if (!existing) {
      throw new AppError("VARIANT_NOT_FOUND", "Variant not found", HttpStatus.NOT_FOUND);
    }

    await this.db
      .delete(productVariants)
      .where(eq(productVariants.id, variantId));
  }

  async bulkAction(
    tenantId: string,
    productIds: string[],
    action: "activate" | "archive" | "delete",
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    const batchSize = 50;

    for (let i = 0; i < productIds.length; i += batchSize) {
      const batch = productIds.slice(i, i + batchSize);

      if (action === "delete") {
        const result = await this.db
          .update(products)
          .set({ deletedAt: new Date() })
          .where(
            and(
              inArray(products.id, batch),
              eq(products.tenantId, tenantId),
            ),
          );
        success += batch.length;
      } else {
        const status = action === "activate" ? "active" : "archived";
        await this.db
          .update(products)
          .set({ status, updatedAt: new Date() })
          .where(
            and(
              inArray(products.id, batch),
              eq(products.tenantId, tenantId),
            ),
          );
        success += batch.length;
      }
    }

    return { success, failed: productIds.length - success };
  }

  private async generateUniqueSlug(
    tenantId: string,
    title: string,
    excludeProductId?: string,
  ): Promise<string> {
    const baseSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/^-+|-+$/g, "");

    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const conditions = [
        eq(products.tenantId, tenantId),
        eq(products.slug, slug),
      ];

      if (excludeProductId) {
        conditions.push(sql`${products.id} != ${excludeProductId}`);
      }

      const [existing] = await this.db
        .select({ id: products.id })
        .from(products)
        .where(and(...conditions))
        .limit(1);

      if (!existing) break;

      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  private async validateSkuUniqueness(
    tenantId: string,
    sku: string,
    excludeVariantId?: string,
  ): Promise<void> {
    const conditions = [
      eq(productVariants.tenantId, tenantId),
      eq(productVariants.sku, sku),
    ];

    if (excludeVariantId) {
      conditions.push(sql`${productVariants.id} != ${excludeVariantId}`);
    }

    const [existing] = await this.db
      .select({ id: productVariants.id })
      .from(productVariants)
      .where(and(...conditions))
      .limit(1);

    if (existing) {
      throw new AppError(
        "SKU_ALREADY_EXISTS",
        `SKU '${sku}' already exists`,
        HttpStatus.CONFLICT,
      );
    }
  }
}
