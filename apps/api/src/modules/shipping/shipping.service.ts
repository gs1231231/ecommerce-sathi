import { Injectable, Inject, HttpStatus } from "@nestjs/common";
import { eq, and } from "drizzle-orm";
import { PinoLogger } from "nestjs-pino";
import { shipments, orders } from "@ecommerce-sathi/db";
import { AppError } from "../../common/exceptions/app-error";
import { DATABASE_TOKEN, DatabaseInstance } from "../database/database.module";

interface ShippingRate {
  courier: string;
  serviceType: string;
  rate: number;
  estimatedDays: number;
  codAvailable: boolean;
  codCharge: number;
}

interface CourierProvider {
  checkServiceability(pickupPincode: string, deliveryPincode: string): Promise<boolean>;
  getRates(params: {
    pickupPincode: string;
    deliveryPincode: string;
    weight: number;
    cod: boolean;
  }): Promise<ShippingRate[]>;
  createShipment(request: Record<string, unknown>): Promise<{ awbNumber: string; trackingUrl: string }>;
  trackShipment(awb: string): Promise<{ status: string; location: string; timestamp: Date }>;
}

// Mock Delhivery Provider (structured for real API integration)
class DelhiveryProvider implements CourierProvider {
  async checkServiceability(pickupPincode: string, deliveryPincode: string): Promise<boolean> {
    // In production: call Delhivery API /c/api/pin-codes/json/
    return pickupPincode.length === 6 && deliveryPincode.length === 6;
  }

  async getRates(params: { pickupPincode: string; deliveryPincode: string; weight: number; cod: boolean }): Promise<ShippingRate[]> {
    const baseRate = params.weight <= 500 ? 60 : Math.ceil(params.weight / 500) * 30 + 30;
    return [
      {
        courier: "delhivery",
        serviceType: "surface",
        rate: baseRate,
        estimatedDays: 5,
        codAvailable: true,
        codCharge: params.cod ? 25 : 0,
      },
      {
        courier: "delhivery",
        serviceType: "express",
        rate: baseRate * 1.5,
        estimatedDays: 3,
        codAvailable: true,
        codCharge: params.cod ? 25 : 0,
      },
    ];
  }

  async createShipment(_request: Record<string, unknown>): Promise<{ awbNumber: string; trackingUrl: string }> {
    const awb = `DL${Date.now()}`;
    return {
      awbNumber: awb,
      trackingUrl: `https://www.delhivery.com/track/package/${awb}`,
    };
  }

  async trackShipment(awb: string): Promise<{ status: string; location: string; timestamp: Date }> {
    return { status: "in_transit", location: "Delhi Hub", timestamp: new Date() };
  }
}

// Mock Shiprocket Provider
class ShiprocketProvider implements CourierProvider {
  async checkServiceability(pickupPincode: string, deliveryPincode: string): Promise<boolean> {
    return pickupPincode.length === 6 && deliveryPincode.length === 6;
  }

  async getRates(params: { pickupPincode: string; deliveryPincode: string; weight: number; cod: boolean }): Promise<ShippingRate[]> {
    const baseRate = params.weight <= 500 ? 50 : Math.ceil(params.weight / 500) * 25 + 25;
    return [{
      courier: "shiprocket",
      serviceType: "standard",
      rate: baseRate,
      estimatedDays: 4,
      codAvailable: true,
      codCharge: params.cod ? 30 : 0,
    }];
  }

  async createShipment(_request: Record<string, unknown>): Promise<{ awbNumber: string; trackingUrl: string }> {
    const awb = `SR${Date.now()}`;
    return { awbNumber: awb, trackingUrl: `https://shiprocket.co/tracking/${awb}` };
  }

  async trackShipment(awb: string): Promise<{ status: string; location: string; timestamp: Date }> {
    return { status: "in_transit", location: "Mumbai Hub", timestamp: new Date() };
  }
}

@Injectable()
export class ShippingService {
  private readonly providers: Map<string, CourierProvider>;

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: DatabaseInstance,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext("ShippingService");
    this.providers = new Map([
      ["delhivery", new DelhiveryProvider()],
      ["shiprocket", new ShiprocketProvider()],
    ]);
  }

  async getRates(params: {
    pickupPincode: string;
    deliveryPincode: string;
    weight: number;
    cod: boolean;
  }): Promise<ShippingRate[]> {
    const allRates: ShippingRate[] = [];

    for (const [, provider] of this.providers) {
      const serviceable = await provider.checkServiceability(
        params.pickupPincode,
        params.deliveryPincode,
      );
      if (serviceable) {
        const rates = await provider.getRates(params);
        allRates.push(...rates);
      }
    }

    return allRates.sort((a, b) => a.rate - b.rate);
  }

  async createShipment(
    tenantId: string,
    orderId: string,
    courier: string,
    weight?: number,
    dimensions?: { length: number; width: number; height: number },
  ): Promise<Record<string, unknown>> {
    const [order] = await this.db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.tenantId, tenantId)))
      .limit(1);

    if (!order) {
      throw new AppError("ORDER_NOT_FOUND", "Order not found", HttpStatus.NOT_FOUND);
    }

    const provider = this.providers.get(courier);
    if (!provider) {
      throw new AppError("COURIER_NOT_SUPPORTED", `Courier '${courier}' not supported`, HttpStatus.BAD_REQUEST);
    }

    const result = await provider.createShipment({
      orderId: order.id,
      orderNumber: order.orderNumber,
      shippingAddress: order.shippingAddress,
      weight,
      dimensions,
      isCod: order.isCod,
      codAmount: order.isCod ? order.grandTotal : "0",
    });

    const [shipment] = await this.db
      .insert(shipments)
      .values({
        tenantId,
        orderId,
        courier: courier as typeof shipments.courier.enumValues[number],
        awbNumber: result.awbNumber,
        trackingUrl: result.trackingUrl,
        status: "pickup_scheduled",
        weight: weight ? String(weight) : undefined,
        dimensions,
      })
      .returning();

    // Update order fulfillment status
    await this.db
      .update(orders)
      .set({ fulfillmentStatus: "fulfilled", status: "shipped", updatedAt: new Date() })
      .where(eq(orders.id, orderId));

    this.logger.info({ tenantId, orderId, awb: result.awbNumber }, "Shipment created");

    return shipment ?? {};
  }

  async trackShipment(
    tenantId: string,
    shipmentId: string,
  ): Promise<Record<string, unknown>> {
    const [shipment] = await this.db
      .select()
      .from(shipments)
      .where(and(eq(shipments.id, shipmentId), eq(shipments.tenantId, tenantId)))
      .limit(1);

    if (!shipment) {
      throw new AppError("SHIPMENT_NOT_FOUND", "Shipment not found", HttpStatus.NOT_FOUND);
    }

    if (!shipment.awbNumber || !shipment.courier) {
      return { ...shipment, tracking: null };
    }

    const provider = this.providers.get(shipment.courier);
    if (!provider) {
      return { ...shipment, tracking: null };
    }

    const tracking = await provider.trackShipment(shipment.awbNumber);
    return { ...shipment, tracking };
  }
}
