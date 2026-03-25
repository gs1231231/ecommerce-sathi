import {
  pgTable,
  uuid,
  varchar,
  text,
  decimal,
  boolean,
  jsonb,
  integer,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { tenantColumns } from "./base";
import {
  orderStatusEnum,
  paymentStatusEnum,
  fulfillmentStatusEnum,
  orderSourceEnum,
} from "./enums";
import { tenants } from "./tenants";
import { customers } from "./customers";
import { orderItems } from "./order-items";
import { payments } from "./payments";
import { shipments } from "./shipments";

export const orders = pgTable(
  "orders",
  {
    ...tenantColumns,
    orderNumber: integer("order_number").notNull(),
    customerId: uuid("customer_id").references(() => customers.id),
    status: orderStatusEnum("status").notNull().default("pending"),
    paymentStatus: paymentStatusEnum("payment_status")
      .notNull()
      .default("pending"),
    fulfillmentStatus: fulfillmentStatusEnum("fulfillment_status")
      .notNull()
      .default("unfulfilled"),
    currency: varchar("currency", { length: 3 }).notNull().default("INR"),
    subtotal: decimal("subtotal", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    discountTotal: decimal("discount_total", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    taxTotal: decimal("tax_total", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    shippingTotal: decimal("shipping_total", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    grandTotal: decimal("grand_total", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    shippingAddress: jsonb("shipping_address").$type<{
      name: string;
      phone: string;
      line1: string;
      line2?: string;
      city: string;
      state: string;
      pincode: string;
      country: string;
    }>(),
    billingAddress: jsonb("billing_address").$type<{
      name: string;
      phone: string;
      line1: string;
      line2?: string;
      city: string;
      state: string;
      pincode: string;
      country: string;
    }>(),
    notes: text("notes"),
    cancelReason: text("cancel_reason"),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    source: orderSourceEnum("source").notNull().default("web"),
    paymentMethod: varchar("payment_method", { length: 50 }),
    isCod: boolean("is_cod").notNull().default(false),
    codVerified: boolean("cod_verified").notNull().default(false),
    codVerificationOtp: varchar("cod_verification_otp", { length: 10 }),
  },
  (table) => [
    uniqueIndex("orders_tenant_number_idx").on(
      table.tenantId,
      table.orderNumber,
    ),
    index("orders_tenant_status_idx").on(table.tenantId, table.status),
    index("orders_tenant_customer_idx").on(table.tenantId, table.customerId),
    index("orders_tenant_id_idx").on(table.tenantId),
    index("orders_created_at_idx").on(table.createdAt),
  ],
);

export const ordersRelations = relations(orders, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [orders.tenantId],
    references: [tenants.id],
  }),
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  items: many(orderItems),
  payments: many(payments),
  shipments: many(shipments),
}));
