import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { tenantColumns } from "./base";
import { userRoleEnum, authProviderEnum } from "./enums";
import { tenants } from "./tenants";
import { sessions } from "./sessions";

export const users = pgTable(
  "users",
  {
    ...tenantColumns,
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: text("password_hash"),
    name: varchar("name", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    role: userRoleEnum("role").notNull().default("staff"),
    avatarUrl: text("avatar_url"),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    authProvider: authProviderEnum("auth_provider").notNull().default("email"),
  },
  (table) => [
    uniqueIndex("users_tenant_email_idx").on(table.tenantId, table.email),
    uniqueIndex("users_tenant_phone_idx").on(table.tenantId, table.phone),
    index("users_tenant_id_idx").on(table.tenantId),
  ],
);

export const usersRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
  sessions: many(sessions),
}));
