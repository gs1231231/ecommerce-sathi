import { Injectable, Inject, HttpStatus } from "@nestjs/common";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import { eq, and, sql } from "drizzle-orm";
import { PinoLogger } from "nestjs-pino";
import { products, productVariants } from "@ecommerce-sathi/db";
import { AppError } from "../../common/exceptions/app-error";
import { DATABASE_TOKEN, DatabaseInstance } from "../database/database.module";
import { ProductService } from "./product.service";

interface CsvRow {
  title: string;
  description?: string;
  status?: string;
  product_type?: string;
  vendor?: string;
  tags?: string;
  variant_title?: string;
  sku?: string;
  price?: string;
  compare_at_price?: string;
  inventory_quantity?: string;
  hsn_code?: string;
  gst_rate?: string;
  weight?: string;
  weight_unit?: string;
  image_url?: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface ImportResult {
  valid: number;
  errors: ValidationError[];
  imported: number;
}

@Injectable()
export class ProductImportService {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: DatabaseInstance,
    private readonly productService: ProductService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext("ProductImportService");
  }

  async validateCsv(csvContent: string): Promise<{
    valid: number;
    errors: ValidationError[];
    rows: CsvRow[];
  }> {
    const rows: CsvRow[] = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const errors: ValidationError[] = [];
    let valid = 0;

    rows.forEach((row, index) => {
      const rowNum = index + 2; // +2 for header + 0-index

      if (!row.title || row.title.trim() === "") {
        errors.push({ row: rowNum, field: "title", message: "Title is required" });
      }

      if (row.price && isNaN(parseFloat(row.price))) {
        errors.push({ row: rowNum, field: "price", message: "Price must be a number" });
      }

      if (row.price && parseFloat(row.price) < 0) {
        errors.push({ row: rowNum, field: "price", message: "Price must be positive" });
      }

      if (row.inventory_quantity && isNaN(parseInt(row.inventory_quantity))) {
        errors.push({ row: rowNum, field: "inventory_quantity", message: "Inventory must be a number" });
      }

      if (row.hsn_code && !/^\d{4,8}$/.test(row.hsn_code)) {
        errors.push({ row: rowNum, field: "hsn_code", message: "HSN code must be 4-8 digits" });
      }

      if (errors.filter((e) => e.row === rowNum).length === 0) {
        valid++;
      }
    });

    return { valid, errors, rows };
  }

  async importCsv(
    tenantId: string,
    userId: string,
    csvContent: string,
  ): Promise<ImportResult> {
    const { valid, errors, rows } = await this.validateCsv(csvContent);

    if (errors.length > 0) {
      return { valid, errors, imported: 0 };
    }

    let imported = 0;

    // Group rows by product title (multiple variants per product)
    const productMap = new Map<string, CsvRow[]>();
    for (const row of rows) {
      const key = row.title;
      if (!productMap.has(key)) {
        productMap.set(key, []);
      }
      productMap.get(key)!.push(row);
    }

    for (const [title, variantRows] of productMap) {
      try {
        const firstRow = variantRows[0]!;
        await this.productService.create(tenantId, userId, {
          title,
          description: firstRow.description,
          status: (firstRow.status as "draft" | "active" | "archived") ?? "draft",
          productType: (firstRow.product_type as "physical" | "digital" | "service" | "subscription") ?? "physical",
          vendor: firstRow.vendor,
          tags: firstRow.tags ? firstRow.tags.split(",").map((t) => t.trim()) : undefined,
          variants: variantRows.map((row) => ({
            title: row.variant_title ?? title,
            sku: row.sku,
            price: parseFloat(row.price ?? "0"),
            compareAtPrice: row.compare_at_price ? parseFloat(row.compare_at_price) : undefined,
            inventoryQuantity: row.inventory_quantity ? parseInt(row.inventory_quantity) : 0,
            hsnCode: row.hsn_code,
            gstRate: row.gst_rate ? parseFloat(row.gst_rate) : undefined,
            weight: row.weight ? parseFloat(row.weight) : undefined,
            weightUnit: (row.weight_unit as "g" | "kg") ?? "g",
            imageUrl: row.image_url,
          })),
        });
        imported++;
      } catch (error) {
        this.logger.error({ title, error }, "Failed to import product");
      }
    }

    this.logger.info({ tenantId, imported, total: productMap.size }, "CSV import completed");

    return { valid, errors: [], imported };
  }

  async exportCsv(tenantId: string): Promise<string> {
    const allProducts = await this.db
      .select()
      .from(products)
      .where(
        and(
          eq(products.tenantId, tenantId),
          sql`${products.deletedAt} IS NULL`,
        ),
      );

    const rows: Record<string, string>[] = [];

    for (const product of allProducts) {
      const variants = await this.db
        .select()
        .from(productVariants)
        .where(eq(productVariants.productId, product.id));

      for (const variant of variants) {
        rows.push({
          title: product.title,
          description: product.description ?? "",
          status: product.status,
          product_type: product.productType,
          vendor: product.vendor ?? "",
          tags: (product.tags ?? []).join(", "),
          variant_title: variant.title,
          sku: variant.sku ?? "",
          price: variant.price,
          compare_at_price: variant.compareAtPrice ?? "",
          inventory_quantity: String(variant.inventoryQuantity),
          hsn_code: variant.hsnCode ?? "",
          gst_rate: variant.gstRate ?? "",
          weight: variant.weight ?? "",
          weight_unit: variant.weightUnit ?? "g",
          image_url: variant.imageUrl ?? "",
        });
      }
    }

    return stringify(rows, { header: true });
  }

  async duplicateProduct(
    tenantId: string,
    userId: string,
    productId: string,
  ): Promise<Record<string, unknown>> {
    const product = (await this.productService.findById(tenantId, productId)) as {
      title: string;
      description?: string;
      descriptionHtml?: string;
      status: string;
      productType: string;
      vendor?: string;
      tags?: string[];
      metadata?: Record<string, unknown>;
      variants: Array<{
        title: string;
        sku?: string;
        price: string;
        compareAtPrice?: string;
        costPrice?: string;
        inventoryQuantity: number;
        hsnCode?: string;
        gstRate?: string;
        weight?: string;
        weightUnit?: string;
        option1Name?: string;
        option1Value?: string;
        imageUrl?: string;
      }>;
    };

    return this.productService.create(tenantId, userId, {
      title: `${product.title} (Copy)`,
      description: product.description,
      descriptionHtml: product.descriptionHtml,
      status: "draft",
      productType: product.productType as "physical" | "digital" | "service" | "subscription",
      vendor: product.vendor,
      tags: product.tags,
      metadata: product.metadata,
      variants: product.variants.map((v) => ({
        title: v.title,
        sku: v.sku ? `${v.sku}-copy` : undefined,
        price: parseFloat(v.price),
        compareAtPrice: v.compareAtPrice ? parseFloat(v.compareAtPrice) : undefined,
        costPrice: v.costPrice ? parseFloat(v.costPrice) : undefined,
        inventoryQuantity: v.inventoryQuantity,
        hsnCode: v.hsnCode,
        gstRate: v.gstRate ? parseFloat(v.gstRate) : undefined,
        weight: v.weight ? parseFloat(v.weight) : undefined,
        weightUnit: v.weightUnit as "g" | "kg" | undefined,
        option1Name: v.option1Name,
        option1Value: v.option1Value,
        imageUrl: v.imageUrl,
      })),
    });
  }
}
