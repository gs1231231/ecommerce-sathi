import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import { products } from "./products";
import { productVariants } from "./product-variants";
import { tenants } from "./tenants";

export const productImages = pgTable(
  "product_images",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    tenantId: uuid("tenant_id").notNull(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id").references(() => productVariants.id),
    url: text("url").notNull(),
    altText: varchar("alt_text", { length: 500 }),
    position: integer("position").notNull().default(0),
    width: integer("width"),
    height: integer("height"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("product_images_tenant_product_idx").on(
      table.tenantId,
      table.productId,
    ),
  ],
);

export const productImagesRelations = relations(productImages, ({ one }) => ({
  tenant: one(tenants, {
    fields: [productImages.tenantId],
    references: [tenants.id],
  }),
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [productImages.variantId],
    references: [productVariants.id],
  }),
}));
