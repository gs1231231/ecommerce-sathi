// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: PaginationMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ============================================
// Tenant Types
// ============================================

export type TenantPlan = "starter" | "growth" | "pro" | "enterprise";
export type TenantStatus = "active" | "suspended" | "cancelled";

export interface TenantSettings {
  currency: string;
  timezone: string;
  locale: string;
  gstNumber?: string;
  merchantState?: string;
}

// ============================================
// User Types
// ============================================

export type UserRole = "owner" | "admin" | "staff" | "viewer";
export type AuthProvider = "email" | "google" | "phone";

// ============================================
// Product Types
// ============================================

export type ProductStatus = "draft" | "active" | "archived";
export type ProductType = "physical" | "digital" | "service" | "subscription";
export type WeightUnit = "g" | "kg";

// ============================================
// Order Types
// ============================================

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned";

export type PaymentStatus =
  | "pending"
  | "authorized"
  | "captured"
  | "partially_refunded"
  | "refunded"
  | "failed";

export type FulfillmentStatus =
  | "unfulfilled"
  | "partially_fulfilled"
  | "fulfilled";

export type OrderSource = "web" | "whatsapp" | "pos" | "api" | "import";

// ============================================
// Payment Types
// ============================================

export type PaymentGateway =
  | "razorpay"
  | "payu"
  | "cashfree"
  | "phonepe"
  | "stripe"
  | "cod"
  | "manual";

export type PaymentMethod =
  | "upi"
  | "card"
  | "netbanking"
  | "wallet"
  | "bnpl"
  | "emi"
  | "cod";

// ============================================
// Shipping Types
// ============================================

export type CourierProvider =
  | "delhivery"
  | "bluedart"
  | "dtdc"
  | "ecom_express"
  | "shiprocket"
  | "dunzo"
  | "porter"
  | "india_post"
  | "fedex"
  | "dhl"
  | "custom";

export type ShipmentStatus =
  | "pending"
  | "pickup_scheduled"
  | "picked_up"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "rto_initiated"
  | "rto_delivered"
  | "lost";
