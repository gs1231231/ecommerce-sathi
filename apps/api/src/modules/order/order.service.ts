import { Injectable, Inject, HttpStatus } from "@nestjs/common";
import { eq, and, sql, desc, asc } from "drizzle-orm";
import { PinoLogger } from "nestjs-pino";
import {
  orders,
  orderItems,
  customers,
  productVariants,
} from "@ecommerce-sathi/db";
import { AppError } from "../../common/exceptions/app-error";
import {
  DATABASE_TOKEN,
  DatabaseInstance,
} from "../database/database.module";

// Valid state transitions
const ORDER_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "rto_initiated"],
  delivered: [],
  cancelled: [],
  returned: [],
};

interface CreateOrderInput {
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  items: Array<{
    productId: string;
    variantId: string;
    quantity: number;
  }>;
  shippingAddress: {
    name: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    country?: string;
  };
  billingAddress?: {
    name: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    country?: string;
  };
  isCod?: boolean;
  notes?: string;
  source?: "web" | "whatsapp" | "pos" | "api" | "import";
}

@Injectable()
export class OrderService {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: DatabaseInstance,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext("OrderService");
  }

  async create(
    tenantId: string,
    input: CreateOrderInput,
  ): Promise<Record<string, unknown>> {
    return this.db.transaction(async (tx: DatabaseInstance) => {
      // 1. Resolve or create customer
      let customerId = input.customerId;
      if (!customerId && input.customerEmail) {
        const [existingCustomer] = await tx
          .select({ id: customers.id })
          .from(customers)
          .where(
            and(
              eq(customers.tenantId, tenantId),
              eq(customers.email, input.customerEmail),
            ),
          )
          .limit(1);

        if (existingCustomer) {
          customerId = existingCustomer.id;
        } else {
          const [newCustomer] = await tx
            .insert(customers)
            .values({
              tenantId,
              name: input.customerName ?? "Guest",
              email: input.customerEmail,
              phone: input.customerPhone,
            })
            .returning();
          customerId = newCustomer?.id;
        }
      }

      // 2. Validate and fetch variant prices
      let subtotal = 0;
      let taxTotal = 0;
      const itemsData: Array<{
        productId: string;
        variantId: string;
        title: string;
        variantTitle: string;
        sku: string | null;
        quantity: number;
        unitPrice: string;
        taxRate: string;
        taxAmount: string;
        total: string;
        hsnCode: string | null;
      }> = [];

      for (const item of input.items) {
        const [variant] = await tx
          .select()
          .from(productVariants)
          .where(
            and(
              eq(productVariants.id, item.variantId),
              eq(productVariants.tenantId, tenantId),
            ),
          )
          .limit(1);

        if (!variant) {
          throw new AppError(
            "VARIANT_NOT_FOUND",
            `Variant ${item.variantId} not found`,
            HttpStatus.BAD_REQUEST,
          );
        }

        if (variant.trackInventory && variant.inventoryQuantity < item.quantity) {
          throw new AppError(
            "INSUFFICIENT_INVENTORY",
            `Insufficient stock for ${variant.title}`,
            HttpStatus.BAD_REQUEST,
          );
        }

        const price = parseFloat(variant.price);
        const gstRate = variant.gstRate ? parseFloat(variant.gstRate) : 0;
        const itemSubtotal = price * item.quantity;
        const itemTax = (itemSubtotal * gstRate) / 100;
        const itemTotal = itemSubtotal + itemTax;

        subtotal += itemSubtotal;
        taxTotal += itemTax;

        itemsData.push({
          productId: item.productId,
          variantId: item.variantId,
          title: variant.title,
          variantTitle: variant.title,
          sku: variant.sku,
          quantity: item.quantity,
          unitPrice: String(price),
          taxRate: String(gstRate),
          taxAmount: String(itemTax.toFixed(2)),
          total: String(itemTotal.toFixed(2)),
          hsnCode: variant.hsnCode,
        });

        // Decrement inventory
        if (variant.trackInventory) {
          await tx
            .update(productVariants)
            .set({
              inventoryQuantity: variant.inventoryQuantity - item.quantity,
            })
            .where(eq(productVariants.id, item.variantId));
        }
      }

      const grandTotal = subtotal + taxTotal;

      // 3. Generate order number (per-tenant sequential)
      const [maxOrder] = await tx
        .select({ maxNum: sql<number>`COALESCE(MAX(${orders.orderNumber}), 1000)` })
        .from(orders)
        .where(eq(orders.tenantId, tenantId));

      const orderNumber = (maxOrder?.maxNum ?? 1000) + 1;

      // 4. Create order
      const orderValues = {
        tenantId,
        orderNumber,
        customerId: customerId ?? null,
        status: "pending" as const,
        paymentStatus: "pending" as const,
        fulfillmentStatus: "unfulfilled" as const,
        subtotal: String(subtotal.toFixed(2)),
        taxTotal: String(taxTotal.toFixed(2)),
        grandTotal: String(grandTotal.toFixed(2)),
        shippingAddress: input.shippingAddress,
        billingAddress: input.billingAddress ?? input.shippingAddress,
        isCod: input.isCod ?? false,
        source: (input.source ?? "web") as "web" | "whatsapp" | "pos" | "api" | "import",
        notes: input.notes,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const [order] = await tx
        .insert(orders)
        .values(orderValues as any)
        .returning();

      if (!order) {
        throw new AppError(
          "ORDER_CREATE_FAILED",
          "Failed to create order",
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // 5. Create order items
      const orderItemValues = itemsData.map((item) => ({
        tenantId,
        orderId: order.id,
        productId: item.productId,
        variantId: item.variantId,
        title: item.title,
        variantTitle: item.variantTitle,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        taxAmount: item.taxAmount,
        total: item.total,
        hsnCode: item.hsnCode,
      }));

      const insertedItems = await tx
        .insert(orderItems)
        .values(orderItemValues)
        .returning();

      // 6. Update customer stats
      if (customerId) {
        await tx
          .update(customers)
          .set({
            totalOrders: sql`${customers.totalOrders} + 1`,
            totalSpent: sql`${customers.totalSpent} + ${grandTotal}`,
          })
          .where(eq(customers.id, customerId));
      }

      this.logger.info(
        { tenantId, orderId: order.id, orderNumber },
        "Order created",
      );

      return { ...order, items: insertedItems };
    });
  }

  async findAll(
    tenantId: string,
    options: {
      page?: number;
      limit?: number;
      status?: string;
      search?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    },
  ): Promise<{ data: unknown[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;
    const offset = (page - 1) * limit;

    const conditions = [eq(orders.tenantId, tenantId)];

    if (options.status) {
      conditions.push(eq(orders.status, options.status as typeof orders.status.enumValues[number]));
    }

    const where = and(...conditions);

    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(where);

    const total = countResult?.count ?? 0;

    const sortFn = options.sortOrder === "asc" ? asc : desc;
    const sortColumn = orders.createdAt;

    const data = await this.db
      .select()
      .from(orders)
      .where(where)
      .orderBy(sortFn(sortColumn))
      .limit(limit)
      .offset(offset);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(
    tenantId: string,
    orderId: string,
  ): Promise<Record<string, unknown>> {
    const [order] = await this.db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.tenantId, tenantId)))
      .limit(1);

    if (!order) {
      throw new AppError("ORDER_NOT_FOUND", "Order not found", HttpStatus.NOT_FOUND);
    }

    const items = await this.db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    return { ...order, items };
  }

  async updateStatus(
    tenantId: string,
    orderId: string,
    newStatus: string,
    reason?: string,
  ): Promise<Record<string, unknown>> {
    const [order] = await this.db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.tenantId, tenantId)))
      .limit(1);

    if (!order) {
      throw new AppError("ORDER_NOT_FOUND", "Order not found", HttpStatus.NOT_FOUND);
    }

    const allowedTransitions = ORDER_TRANSITIONS[order.status];
    if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
      throw new AppError(
        "INVALID_STATUS_TRANSITION",
        `Cannot transition from '${order.status}' to '${newStatus}'`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const updateData: Record<string, unknown> = {
      status: newStatus,
      updatedAt: new Date(),
    };

    if (newStatus === "cancelled") {
      updateData.cancelReason = reason;
      updateData.cancelledAt = new Date();

      // Restore inventory
      const items = await this.db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));

      for (const item of items) {
        if (item.variantId) {
          await this.db
            .update(productVariants)
            .set({
              inventoryQuantity: sql`${productVariants.inventoryQuantity} + ${item.quantity}`,
            })
            .where(eq(productVariants.id, item.variantId));
        }
      }
    }

    await this.db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, orderId));

    return this.findById(tenantId, orderId);
  }

  async getStats(
    tenantId: string,
  ): Promise<Record<string, unknown>> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayStats] = await this.db
      .select({
        count: sql<number>`count(*)::int`,
        revenue: sql<string>`COALESCE(SUM(${orders.grandTotal}::numeric), 0)::text`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.tenantId, tenantId),
          sql`${orders.createdAt} >= ${today}`,
        ),
      );

    const [totalStats] = await this.db
      .select({
        count: sql<number>`count(*)::int`,
        revenue: sql<string>`COALESCE(SUM(${orders.grandTotal}::numeric), 0)::text`,
      })
      .from(orders)
      .where(eq(orders.tenantId, tenantId));

    return {
      today: {
        orders: todayStats?.count ?? 0,
        revenue: todayStats?.revenue ?? "0",
      },
      total: {
        orders: totalStats?.count ?? 0,
        revenue: totalStats?.revenue ?? "0",
      },
    };
  }
}
