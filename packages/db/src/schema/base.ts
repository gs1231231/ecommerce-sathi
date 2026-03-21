import { uuid, timestamp } from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";

/**
 * Base columns shared by every table:
 * id (UUID v7), created_at, updated_at, deleted_at (soft delete)
 */
export const baseColumns = {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
};

/**
 * Tenant-scoped base columns (adds tenant_id)
 */
export const tenantColumns = {
  ...baseColumns,
  tenantId: uuid("tenant_id").notNull(),
};
