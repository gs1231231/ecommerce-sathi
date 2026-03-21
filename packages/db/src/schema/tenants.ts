import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { baseColumns } from "./base.js";
import { tenantPlanEnum, tenantStatusEnum } from "./enums.js";
import { users } from "./users.js";

export const tenants = pgTable(
  "tenants",
  {
    ...baseColumns,
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull(),
    domain: varchar("domain", { length: 255 }),
    customDomain: varchar("custom_domain", { length: 255 }),
    logoUrl: text("logo_url"),
    plan: tenantPlanEnum("plan").notNull().default("starter"),
    planExpiresAt: timestamp("plan_expires_at", { withTimezone: true }),
    status: tenantStatusEnum("status").notNull().default("active"),
    settings: jsonb("settings").$type<{
      currency: string;
      timezone: string;
      locale: string;
      gstNumber?: string;
      merchantState?: string;
    }>().default({
      currency: "INR",
      timezone: "Asia/Kolkata",
      locale: "en-IN",
    }),
    ownerId: uuid("owner_id"),
  },
  (table) => [
    uniqueIndex("tenants_slug_idx").on(table.slug),
    uniqueIndex("tenants_domain_idx").on(table.domain),
    uniqueIndex("tenants_custom_domain_idx").on(table.customDomain),
    index("tenants_owner_id_idx").on(table.ownerId),
  ],
);

export const tenantsRelations = relations(tenants, ({ many, one }) => ({
  users: many(users),
  owner: one(users, {
    fields: [tenants.ownerId],
    references: [users.id],
    relationName: "tenantOwner",
  }),
}));
