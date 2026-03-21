import { pgEnum } from "drizzle-orm/pg-core";

// Tenant enums
export const tenantPlanEnum = pgEnum("tenant_plan", [
  "starter",
  "growth",
  "pro",
  "enterprise",
]);

export const tenantStatusEnum = pgEnum("tenant_status", [
  "active",
  "suspended",
  "cancelled",
]);

// User enums
export const userRoleEnum = pgEnum("user_role", [
  "owner",
  "admin",
  "staff",
  "viewer",
]);

export const authProviderEnum = pgEnum("auth_provider", [
  "email",
  "google",
  "phone",
]);

// Product enums
export const productStatusEnum = pgEnum("product_status", [
  "draft",
  "active",
  "archived",
]);

export const productTypeEnum = pgEnum("product_type", [
  "physical",
  "digital",
  "service",
  "subscription",
]);

export const weightUnitEnum = pgEnum("weight_unit", ["g", "kg"]);

// Order enums
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "authorized",
  "captured",
  "partially_refunded",
  "refunded",
  "failed",
]);

export const fulfillmentStatusEnum = pgEnum("fulfillment_status", [
  "unfulfilled",
  "partially_fulfilled",
  "fulfilled",
]);

export const orderSourceEnum = pgEnum("order_source", [
  "web",
  "whatsapp",
  "pos",
  "api",
  "import",
]);

// Payment enums
export const paymentGatewayEnum = pgEnum("payment_gateway", [
  "razorpay",
  "payu",
  "cashfree",
  "phonepe",
  "stripe",
  "cod",
  "manual",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "upi",
  "card",
  "netbanking",
  "wallet",
  "bnpl",
  "emi",
  "cod",
]);

// Shipping enums
export const courierEnum = pgEnum("courier", [
  "delhivery",
  "bluedart",
  "dtdc",
  "ecom_express",
  "shiprocket",
  "dunzo",
  "porter",
  "india_post",
  "fedex",
  "dhl",
  "custom",
]);

export const shipmentStatusEnum = pgEnum("shipment_status", [
  "pending",
  "pickup_scheduled",
  "picked_up",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "rto_initiated",
  "rto_delivered",
  "lost",
]);
