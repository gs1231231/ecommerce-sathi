import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { tenantColumns } from "./base";
import { tenants } from "./tenants";
import { productCategories } from "./product-categories";

export const categories = pgTable(
  "categories",
  {
    ...tenantColumns,
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    description: text("description"),
    parentId: uuid("parent_id"),
    position: integer("position").notNull().default(0),
    imageUrl: text("image_url"),
    seoTitle: varchar("seo_title", { length: 255 }),
    seoDescription: text("seo_description"),
    isActive: boolean("is_active").notNull().default(true),
  },
  (table) => [
    uniqueIndex("categories_tenant_slug_idx").on(table.tenantId, table.slug),
    index("categories_tenant_parent_idx").on(table.tenantId, table.parentId),
  ],
);

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [categories.tenantId],
    references: [tenants.id],
  }),
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "categoryParent",
  }),
  children: many(categories, { relationName: "categoryParent" }),
  productCategories: many(productCategories),
}));
