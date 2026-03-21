import { z } from "zod";

export const productVariantInputSchema = z.object({
  title: z.string().min(1).max(255),
  sku: z.string().max(100).optional(),
  barcode: z.string().max(100).optional(),
  price: z.coerce.number().positive(),
  compareAtPrice: z.coerce.number().positive().optional(),
  costPrice: z.coerce.number().positive().optional(),
  currency: z.string().length(3).default("INR"),
  weight: z.coerce.number().positive().optional(),
  weightUnit: z.enum(["g", "kg"]).default("g"),
  inventoryQuantity: z.coerce.number().int().min(0).default(0),
  trackInventory: z.boolean().default(true),
  allowBackorder: z.boolean().default(false),
  hsnCode: z
    .string()
    .regex(/^\d{4,8}$/, "HSN code must be 4-8 digits")
    .optional(),
  gstRate: z.coerce.number().min(0).max(28).optional(),
  option1Name: z.string().max(100).optional(),
  option1Value: z.string().max(255).optional(),
  option2Name: z.string().max(100).optional(),
  option2Value: z.string().max(255).optional(),
  option3Name: z.string().max(100).optional(),
  option3Value: z.string().max(255).optional(),
  imageUrl: z.string().url().optional(),
  isActive: z.boolean().default(true),
});

export const createProductInputSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  descriptionHtml: z.string().optional(),
  status: z.enum(["draft", "active", "archived"]).default("draft"),
  productType: z
    .enum(["physical", "digital", "service", "subscription"])
    .default("physical"),
  vendor: z.string().max(255).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
  seoTitle: z.string().max(255).optional(),
  seoDescription: z.string().optional(),
  categoryIds: z.array(z.string().uuid()).optional(),
  variants: z.array(productVariantInputSchema).min(1),
});

export const updateProductInputSchema = createProductInputSchema.partial();

export const productFilterQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["draft", "active", "archived"]).optional(),
  categoryId: z.string().uuid().optional(),
  priceMin: z.coerce.number().positive().optional(),
  priceMax: z.coerce.number().positive().optional(),
  inStock: z.coerce.boolean().optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().optional(),
  sortBy: z
    .enum(["created_at", "title", "price", "inventory"])
    .default("created_at"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateProductInput = z.infer<typeof createProductInputSchema>;
export type UpdateProductInput = z.infer<typeof updateProductInputSchema>;
export type ProductVariantInput = z.infer<typeof productVariantInputSchema>;
export type ProductFilterQuery = z.infer<typeof productFilterQuerySchema>;
