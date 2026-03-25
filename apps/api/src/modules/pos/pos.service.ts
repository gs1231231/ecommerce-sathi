import { Injectable, Inject, HttpStatus } from "@nestjs/common";
import { eq, and, ilike } from "drizzle-orm";
import { PinoLogger } from "nestjs-pino";
import { products, productVariants } from "@ecommerce-sathi/db";
import { AppError } from "../../common/exceptions/app-error";
import { DATABASE_TOKEN, DatabaseInstance } from "../database/database.module";

@Injectable()
export class PosService {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: DatabaseInstance,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext("PosService");
  }

  async searchByBarcode(
    tenantId: string,
    barcode: string,
  ): Promise<Record<string, unknown>> {
    const [variant] = await this.db
      .select()
      .from(productVariants)
      .where(
        and(
          eq(productVariants.tenantId, tenantId),
          eq(productVariants.barcode, barcode),
        ),
      )
      .limit(1);

    if (!variant) {
      throw new AppError("PRODUCT_NOT_FOUND", "No product found for barcode", HttpStatus.NOT_FOUND);
    }

    const [product] = await this.db
      .select()
      .from(products)
      .where(eq(products.id, variant.productId))
      .limit(1);

    return { product, variant };
  }

  async quickSearch(
    tenantId: string,
    query: string,
  ): Promise<unknown[]> {
    const results = await this.db
      .select({
        productId: products.id,
        title: products.title,
        variantId: productVariants.id,
        variantTitle: productVariants.title,
        sku: productVariants.sku,
        price: productVariants.price,
        inventoryQuantity: productVariants.inventoryQuantity,
      })
      .from(products)
      .innerJoin(productVariants, eq(products.id, productVariants.productId))
      .where(
        and(
          eq(products.tenantId, tenantId),
          eq(products.status, "active"),
          ilike(products.title, `%${query}%`),
        ),
      )
      .limit(20);

    return results;
  }

  async generateReceipt(
    items: Array<{ title: string; quantity: number; price: number; total: number }>,
    payment: { method: string; amount: number; change: number },
    storeName: string,
  ): Promise<{ receipt: string }> {
    const lines: string[] = [];
    lines.push("=".repeat(40));
    lines.push(storeName.toUpperCase().padStart(20 + storeName.length / 2));
    lines.push("=".repeat(40));
    lines.push(`Date: ${new Date().toLocaleString("en-IN")}`);
    lines.push("-".repeat(40));

    for (const item of items) {
      lines.push(`${item.title}`);
      lines.push(`  ${item.quantity} x ₹${item.price.toFixed(2)}    ₹${item.total.toFixed(2)}`);
    }

    lines.push("-".repeat(40));
    const total = items.reduce((sum, i) => sum + i.total, 0);
    lines.push(`TOTAL: ₹${total.toFixed(2)}`.padStart(40));
    lines.push(`Payment: ${payment.method}`);
    lines.push(`Paid: ₹${payment.amount.toFixed(2)}`);
    if (payment.change > 0) {
      lines.push(`Change: ₹${payment.change.toFixed(2)}`);
    }
    lines.push("=".repeat(40));
    lines.push("Thank you for shopping!");
    lines.push("=".repeat(40));

    return { receipt: lines.join("\n") };
  }

  async openCashDrawer(): Promise<{ status: string }> {
    // In production: send ESC/POS command to cash drawer
    this.logger.info("Cash drawer open requested");
    return { status: "opened" };
  }
}
