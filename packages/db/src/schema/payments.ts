import {
  pgTable,
  uuid,
  varchar,
  decimal,
  text,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { tenantColumns } from "./base";
import { paymentGatewayEnum, paymentMethodEnum, paymentStatusEnum } from "./enums";
import { orders } from "./orders";
import { tenants } from "./tenants";

export const payments = pgTable(
  "payments",
  {
    ...tenantColumns,
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id),
    gateway: paymentGatewayEnum("gateway").notNull(),
    method: paymentMethodEnum("method"),
    status: paymentStatusEnum("status").notNull().default("pending"),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("INR"),
    gatewayPaymentId: varchar("gateway_payment_id", { length: 255 }),
    gatewayOrderId: varchar("gateway_order_id", { length: 255 }),
    gatewaySignature: varchar("gateway_signature", { length: 512 }),
    refundId: varchar("refund_id", { length: 255 }),
    refundAmount: decimal("refund_amount", { precision: 12, scale: 2 }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    errorMessage: text("error_message"),
  },
  (table) => [
    index("payments_order_id_idx").on(table.orderId),
    index("payments_tenant_id_idx").on(table.tenantId),
    index("payments_gateway_payment_id_idx").on(table.gatewayPaymentId),
  ],
);

export const paymentsRelations = relations(payments, ({ one }) => ({
  tenant: one(tenants, {
    fields: [payments.tenantId],
    references: [tenants.id],
  }),
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
}));
