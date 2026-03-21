import {
  pgTable,
  uuid,
  varchar,
  text,
  decimal,
  integer,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import { orders } from "./orders.js";
import { products } from "./products.js";
import { productVariants } from "./product-variants.js";
import { tenants } from "./tenants.js";

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    tenantId: uuid("tenant_id").notNull(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id),
    productId: uuid("product_id").references(() => products.id),
    variantId: uuid("variant_id").references(() => productVariants.id),
    title: varchar("title", { length: 500 }).notNull(),
    variantTitle: varchar("variant_title", { length: 255 }),
    sku: varchar("sku", { length: 100 }),
    quantity: integer("quantity").notNull(),
    unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
    discountAmount: decimal("discount_amount", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    taxRate: decimal("tax_rate", { precision: 5, scale: 2 })
      .notNull()
      .default("0"),
    taxAmount: decimal("tax_amount", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    total: decimal("total", { precision: 12, scale: 2 }).notNull(),
    hsnCode: varchar("hsn_code", { length: 8 }),
    properties: jsonb("properties").$type<Record<string, unknown>>(),
    fulfillmentStatus: varchar("fulfillment_status", { length: 50 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("order_items_order_id_idx").on(table.orderId),
    index("order_items_tenant_id_idx").on(table.tenantId),
  ],
);

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  tenant: one(tenants, {
    fields: [orderItems.tenantId],
    references: [tenants.id],
  }),
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [orderItems.variantId],
    references: [productVariants.id],
  }),
}));
