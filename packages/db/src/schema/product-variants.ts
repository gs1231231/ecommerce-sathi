import {
  pgTable,
  uuid,
  varchar,
  text,
  decimal,
  integer,
  boolean,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { tenantColumns } from "./base";
import { weightUnitEnum } from "./enums";
import { tenants } from "./tenants";
import { products } from "./products";

export const productVariants = pgTable(
  "product_variants",
  {
    ...tenantColumns,
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    sku: varchar("sku", { length: 100 }),
    barcode: varchar("barcode", { length: 100 }),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    compareAtPrice: decimal("compare_at_price", { precision: 10, scale: 2 }),
    costPrice: decimal("cost_price", { precision: 10, scale: 2 }),
    currency: varchar("currency", { length: 3 }).notNull().default("INR"),
    weight: decimal("weight", { precision: 10, scale: 2 }),
    weightUnit: weightUnitEnum("weight_unit").default("g"),
    inventoryQuantity: integer("inventory_quantity").notNull().default(0),
    trackInventory: boolean("track_inventory").notNull().default(true),
    allowBackorder: boolean("allow_backorder").notNull().default(false),
    hsnCode: varchar("hsn_code", { length: 8 }),
    gstRate: decimal("gst_rate", { precision: 5, scale: 2 }),
    option1Name: varchar("option1_name", { length: 100 }),
    option1Value: varchar("option1_value", { length: 255 }),
    option2Name: varchar("option2_name", { length: 100 }),
    option2Value: varchar("option2_value", { length: 255 }),
    option3Name: varchar("option3_name", { length: 100 }),
    option3Value: varchar("option3_value", { length: 255 }),
    imageUrl: text("image_url"),
    position: integer("position").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
  },
  (table) => [
    uniqueIndex("variants_tenant_sku_idx").on(table.tenantId, table.sku),
    index("variants_tenant_product_idx").on(table.tenantId, table.productId),
    index("variants_product_id_idx").on(table.productId),
  ],
);

export const productVariantsRelations = relations(
  productVariants,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [productVariants.tenantId],
      references: [tenants.id],
    }),
    product: one(products, {
      fields: [productVariants.productId],
      references: [products.id],
    }),
  }),
);
