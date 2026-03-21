import { z } from "zod";

const addressSchema = z.object({
  name: z.string().min(1),
  phone: z.string().regex(/^[6-9]\d{9}$/),
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().regex(/^[1-9]\d{5}$/, "Invalid pincode"),
  country: z.string().default("IN"),
});

const orderItemInputSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

export const createOrderInputSchema = z.object({
  customerId: z.string().uuid().optional(),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().optional(),
  customerName: z.string().optional(),
  items: z.array(orderItemInputSchema).min(1),
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  paymentMethod: z.string().optional(),
  isCod: z.boolean().default(false),
  notes: z.string().optional(),
  source: z
    .enum(["web", "whatsapp", "pos", "api", "import"])
    .default("web"),
});

export const updateOrderStatusInputSchema = z.object({
  status: z.enum([
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "returned",
  ]),
  reason: z.string().optional(),
});

export const createPaymentInputSchema = z.object({
  orderId: z.string().uuid(),
  gateway: z.enum([
    "razorpay",
    "payu",
    "cashfree",
    "phonepe",
    "stripe",
    "cod",
    "manual",
  ]),
  method: z
    .enum(["upi", "card", "netbanking", "wallet", "bnpl", "emi", "cod"])
    .optional(),
  amount: z.coerce.number().positive(),
  currency: z.string().length(3).default("INR"),
});

export const createShipmentInputSchema = z.object({
  orderId: z.string().uuid(),
  courier: z.enum([
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
  ]),
  weight: z.coerce.number().positive().optional(),
  dimensions: z
    .object({
      length: z.number().positive(),
      width: z.number().positive(),
      height: z.number().positive(),
    })
    .optional(),
});

export const orderFilterQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z
    .enum([
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "returned",
    ])
    .optional(),
  paymentStatus: z
    .enum([
      "pending",
      "authorized",
      "captured",
      "partially_refunded",
      "refunded",
      "failed",
    ])
    .optional(),
  fulfillmentStatus: z
    .enum(["unfulfilled", "partially_fulfilled", "fulfilled"])
    .optional(),
  source: z.enum(["web", "whatsapp", "pos", "api", "import"]).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  search: z.string().optional(),
  sortBy: z.enum(["created_at", "order_number", "grand_total"]).default("created_at"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const shipmentTrackingUpdateSchema = z.object({
  awbNumber: z.string(),
  status: z.enum([
    "pending",
    "pickup_scheduled",
    "picked_up",
    "in_transit",
    "out_for_delivery",
    "delivered",
    "rto_initiated",
    "rto_delivered",
    "lost",
  ]),
  location: z.string().optional(),
  remarks: z.string().optional(),
  timestamp: z.coerce.date().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderInputSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusInputSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentInputSchema>;
export type CreateShipmentInput = z.infer<typeof createShipmentInputSchema>;
export type OrderFilterQuery = z.infer<typeof orderFilterQuerySchema>;
export type ShipmentTrackingUpdate = z.infer<typeof shipmentTrackingUpdateSchema>;
