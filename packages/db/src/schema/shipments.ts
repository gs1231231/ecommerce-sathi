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
import { tenantColumns } from "./base";
import { courierEnum, shipmentStatusEnum } from "./enums";
import { orders } from "./orders";
import { tenants } from "./tenants";

export const shipments = pgTable(
  "shipments",
  {
    ...tenantColumns,
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id),
    courier: courierEnum("courier"),
    awbNumber: varchar("awb_number", { length: 100 }),
    trackingUrl: text("tracking_url"),
    status: shipmentStatusEnum("status").notNull().default("pending"),
    labelUrl: text("label_url"),
    weight: decimal("weight", { precision: 10, scale: 2 }),
    dimensions: jsonb("dimensions").$type<{
      length: number;
      width: number;
      height: number;
    }>(),
    shippingRate: decimal("shipping_rate", { precision: 10, scale: 2 }),
    estimatedDelivery: timestamp("estimated_delivery", { withTimezone: true }),
    actualDelivery: timestamp("actual_delivery", { withTimezone: true }),
    ndrCount: integer("ndr_count").notNull().default(0),
    ndrStatus: varchar("ndr_status", { length: 50 }),
    rtoReason: text("rto_reason"),
  },
  (table) => [
    index("shipments_order_id_idx").on(table.orderId),
    index("shipments_tenant_id_idx").on(table.tenantId),
    index("shipments_awb_number_idx").on(table.awbNumber),
  ],
);

export const shipmentsRelations = relations(shipments, ({ one }) => ({
  tenant: one(tenants, {
    fields: [shipments.tenantId],
    references: [tenants.id],
  }),
  order: one(orders, {
    fields: [shipments.orderId],
    references: [orders.id],
  }),
}));
