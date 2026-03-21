import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { tenantColumns } from "./base.js";
import { productStatusEnum, productTypeEnum } from "./enums.js";
import { tenants } from "./tenants.js";
import { users } from "./users.js";
import { productVariants } from "./product-variants.js";
import { productImages } from "./product-images.js";
import { productCategories } from "./product-categories.js";

export const products = pgTable(
  "products",
  {
    ...tenantColumns,
    title: varchar("title", { length: 500 }).notNull(),
    slug: varchar("slug", { length: 500 }).notNull(),
    description: text("description"),
    descriptionHtml: text("description_html"),
    status: productStatusEnum("status").notNull().default("draft"),
    productType: productTypeEnum("product_type")
      .notNull()
      .default("physical"),
    vendor: varchar("vendor", { length: 255 }),
    tags: text("tags").array(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    seoTitle: varchar("seo_title", { length: 255 }),
    seoDescription: text("seo_description"),
    seoUrlHandle: varchar("seo_url_handle", { length: 500 }),
    createdBy: uuid("created_by"),
  },
  (table) => [
    uniqueIndex("products_tenant_slug_idx").on(table.tenantId, table.slug),
    index("products_tenant_status_idx").on(table.tenantId, table.status),
    index("products_tenant_id_idx").on(table.tenantId),
  ],
);

export const productsRelations = relations(products, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [products.tenantId],
    references: [tenants.id],
  }),
  createdByUser: one(users, {
    fields: [products.createdBy],
    references: [users.id],
  }),
  variants: many(productVariants),
  images: many(productImages),
  productCategories: many(productCategories),
}));
