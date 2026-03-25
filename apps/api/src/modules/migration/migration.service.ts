import { Injectable, Inject, HttpStatus } from "@nestjs/common";
import { eq, and, sql, desc } from "drizzle-orm";
import { PinoLogger } from "nestjs-pino";
import { products } from "@ecommerce-sathi/db";
import { DATABASE_TOKEN, DatabaseInstance } from "../database/database.module";
import { AppError } from "../../common/exceptions/app-error";

interface ValidationResult {
  valid: boolean;
  errors: string[];
  rowCount: number;
}

interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

const SHOPIFY_HEADERS = [
  "Handle",
  "Title",
  "Body",
  "Vendor",
  "Type",
  "Tags",
  "Published",
  "Option1 Name",
  "Option1 Value",
  "Variant SKU",
  "Variant Price",
  "Variant Inventory Qty",
];

const WOOCOMMERCE_HEADERS = [
  "ID",
  "Type",
  "SKU",
  "Name",
  "Published",
  "Short description",
  "Description",
  "Regular price",
  "Sale price",
  "Stock",
];

const GENERIC_HEADERS = [
  "Title",
  "Description",
  "SKU",
  "Price",
  "Inventory",
  "Tags",
  "Status",
];

@Injectable()
export class MigrationService {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: DatabaseInstance,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext("MigrationService");
  }

  async importFromShopify(
    tenantId: string,
    userId: string,
    csvContent: string,
  ): Promise<ImportResult> {
    const validation = this.validateImport("shopify", csvContent);
    if (!validation.valid) {
      throw new AppError(
        "INVALID_CSV",
        `Invalid Shopify CSV: ${validation.errors.join(", ")}`,
        HttpStatus.BAD_REQUEST,
        { errors: validation.errors },
      );
    }

    const rows = this.parseCsv(csvContent);
    const headers = rows[0] as string[];
    const dataRows = rows.slice(1);

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i] as string[];
      try {
        const getCol = (name: string): string =>
          row[headers.indexOf(name)] ?? "";

        const title = getCol("Title");
        if (!title) {
          skipped++;
          continue;
        }

        const handle = getCol("Handle") || this.slugify(title);
        const tags = getCol("Tags")
          ? getCol("Tags").split(",").map((t) => t.trim())
          : [];
        const price = getCol("Variant Price") || "0";
        const inventory = parseInt(getCol("Variant Inventory Qty")) || 0;

        await this.db.insert(products).values({
          tenantId,
          title,
          slug: handle,
          description: getCol("Body"),
          vendor: getCol("Vendor"),
          productType: "physical",
          tags,
          status: getCol("Published").toLowerCase() === "true" ? "active" : "draft",
          createdBy: userId,
        });

        imported++;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        errors.push(`Row ${i + 2}: ${message}`);
        skipped++;
      }
    }

    this.logger.info(
      { tenantId, platform: "shopify", imported, skipped },
      "Shopify import completed",
    );

    return { imported, skipped, errors };
  }

  async importFromWooCommerce(
    tenantId: string,
    userId: string,
    csvContent: string,
  ): Promise<ImportResult> {
    const validation = this.validateImport("woocommerce", csvContent);
    if (!validation.valid) {
      throw new AppError(
        "INVALID_CSV",
        `Invalid WooCommerce CSV: ${validation.errors.join(", ")}`,
        HttpStatus.BAD_REQUEST,
        { errors: validation.errors },
      );
    }

    const rows = this.parseCsv(csvContent);
    const headers = rows[0] as string[];
    const dataRows = rows.slice(1);

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i] as string[];
      try {
        const getCol = (name: string): string =>
          row[headers.indexOf(name)] ?? "";

        const name = getCol("Name");
        if (!name) {
          skipped++;
          continue;
        }

        const slug = this.slugify(name);
        const price = getCol("Regular price") || "0";
        const stock = parseInt(getCol("Stock")) || 0;

        await this.db.insert(products).values({
          tenantId,
          title: name,
          slug,
          description: getCol("Description") || getCol("Short description"),
          productType: getCol("Type") === "virtual" ? "digital" : "physical",
          tags: [],
          status: getCol("Published") === "1" ? "active" : "draft",
          createdBy: userId,
        });

        imported++;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        errors.push(`Row ${i + 2}: ${message}`);
        skipped++;
      }
    }

    this.logger.info(
      { tenantId, platform: "woocommerce", imported, skipped },
      "WooCommerce import completed",
    );

    return { imported, skipped, errors };
  }

  getImportTemplate(platform: string): string {
    switch (platform) {
      case "shopify":
        return SHOPIFY_HEADERS.join(",");
      case "woocommerce":
        return WOOCOMMERCE_HEADERS.join(",");
      case "generic":
        return GENERIC_HEADERS.join(",");
      default:
        throw new AppError(
          "UNSUPPORTED_PLATFORM",
          `Unsupported platform: ${platform}. Supported: shopify, woocommerce, generic`,
          HttpStatus.BAD_REQUEST,
        );
    }
  }

  validateImport(platform: string, csvContent: string): ValidationResult {
    const errors: string[] = [];

    if (!csvContent || csvContent.trim().length === 0) {
      return { valid: false, errors: ["CSV content is empty"], rowCount: 0 };
    }

    const rows = this.parseCsv(csvContent);
    if (rows.length < 2) {
      return {
        valid: false,
        errors: ["CSV must have at least a header row and one data row"],
        rowCount: 0,
      };
    }

    const headers = rows[0] as string[];
    let expectedHeaders: string[];

    switch (platform) {
      case "shopify":
        expectedHeaders = SHOPIFY_HEADERS;
        break;
      case "woocommerce":
        expectedHeaders = WOOCOMMERCE_HEADERS;
        break;
      case "generic":
        expectedHeaders = GENERIC_HEADERS;
        break;
      default:
        return {
          valid: false,
          errors: [`Unsupported platform: ${platform}`],
          rowCount: 0,
        };
    }

    // Check required headers are present
    const missingHeaders = expectedHeaders.filter(
      (h) => !headers.includes(h),
    );
    if (missingHeaders.length > 0) {
      errors.push(`Missing required columns: ${missingHeaders.join(", ")}`);
    }

    // Validate data rows have correct column count
    const dataRows = rows.slice(1);
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i] as string[];
      if (row.length !== headers.length) {
        errors.push(
          `Row ${i + 2}: expected ${headers.length} columns, got ${row.length}`,
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      rowCount: dataRows.length,
    };
  }

  private parseCsv(content: string): string[][] {
    const lines = content.trim().split("\n");
    return lines.map((line) => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === "," && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    });
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
}
