import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { ShippingService } from "./shipping.service";
import { CurrentTenant } from "../../common/decorators/current-tenant.decorator";
import { Public } from "../../common/decorators/public.decorator";

@ApiTags("Shipping")
@ApiBearerAuth()
@Controller("shipping")
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Get("rates")
  @ApiOperation({ summary: "Get shipping rate comparison" })
  async getRates(
    @Query()
    query: {
      pickupPincode: string;
      deliveryPincode: string;
      weight: string;
      cod?: string;
    },
  ): Promise<{ success: boolean; data: unknown }> {
    const rates = await this.shippingService.getRates({
      pickupPincode: query.pickupPincode,
      deliveryPincode: query.deliveryPincode,
      weight: parseFloat(query.weight),
      cod: query.cod === "true",
    });
    return { success: true, data: rates };
  }

  @Post("create")
  @ApiOperation({ summary: "Create a shipment for an order" })
  async create(
    @CurrentTenant() tenantId: string,
    @Body()
    body: {
      orderId: string;
      courier: string;
      weight?: number;
      dimensions?: { length: number; width: number; height: number };
    },
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.shippingService.createShipment(
      tenantId,
      body.orderId,
      body.courier,
      body.weight,
      body.dimensions,
    );
    return { success: true, data: result };
  }

  @Get(":id/track")
  @ApiOperation({ summary: "Track a shipment" })
  async track(
    @CurrentTenant() tenantId: string,
    @Param("id") id: string,
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.shippingService.trackShipment(tenantId, id);
    return { success: true, data: result };
  }

  @Post("webhook/:courier")
  @Public()
  @ApiOperation({ summary: "Courier webhook for tracking updates" })
  async webhook(
    @Param("courier") _courier: string,
    @Body() _body: Record<string, unknown>,
  ): Promise<{ success: boolean }> {
    // Process courier tracking webhook updates
    return { success: true };
  }
}
