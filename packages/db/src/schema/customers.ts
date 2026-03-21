import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  decimal,
  integer,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { tenantColumns } from "./base.js";
import { tenants } from "./tenants.js";
import { orders } from "./orders.js";

export const customers = pgTable(
  "customers",
  {
    ...tenantColumns,
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 20 }),
    acceptsMarketing: boolean("accepts_marketing").notNull().default(false),
    tags: text("tags").array(),
    totalOrders: integer("total_orders").notNull().default(0),
    totalSpent: decimal("total_spent", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    addresses: jsonb("addresses").$type<
      Array<{
        id: string;
        name: string;
        phone: string;
        line1: string;
        line2?: string;
        city: string;
        state: string;
        pincode: string;
        country: string;
        isDefault: boolean;
      }>
    >(),
    notes: text("notes"),
  },
  (table) => [
    uniqueIndex("customers_tenant_email_idx").on(table.tenantId, table.email),
    index("customers_tenant_id_idx").on(table.tenantId),
    index("customers_tenant_phone_idx").on(table.tenantId, table.phone),
  ],
);

export const customersRelations = relations(customers, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [customers.tenantId],
    references: [tenants.id],
  }),
  orders: many(orders),
}));
