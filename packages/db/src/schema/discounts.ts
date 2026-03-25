import { pgTable, uuid, varchar, text, decimal, integer, boolean, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { pgEnum } from "drizzle-orm/pg-core";
import { tenantColumns } from "./base.js";

export const discountTypeEnum = pgEnum("discount_type", ["percentage", "fixed_amount", "buy_x_get_y", "free_shipping"]);

export const discounts = pgTable("discounts", {
  ...tenantColumns,
  code: varchar("code", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  type: discountTypeEnum("type").notNull(),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  minOrderAmount: decimal("min_order_amount", { precision: 10, scale: 2 }),
  maxDiscount: decimal("max_discount", { precision: 10, scale: 2 }),
  usageLimit: integer("usage_limit"),
  usageCount: integer("usage_count").notNull().default(0),
  perCustomerLimit: integer("per_customer_limit").default(1),
  isActive: boolean("is_active").notNull().default(true),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  conditions: jsonb("conditions").$type<Record<string, unknown>>(),
}, (table) => [
  index("discounts_tenant_code_idx").on(table.tenantId, table.code),
  index("discounts_tenant_active_idx").on(table.tenantId, table.isActive),
]);
