import { Controller, Get, Post, Body, Param } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { B2bService } from "./b2b.service";
import { CurrentTenant } from "../../common/decorators/current-tenant.decorator";

@ApiTags("B2B Wholesale")
@ApiBearerAuth()
@Controller("b2b")
export class B2bController {
  constructor(private readonly b2bService: B2bService) {}

  @Post("register")
  @ApiOperation({ summary: "Register a wholesale customer" })
  async register(
    @CurrentTenant() tenantId: string,
    @Body() body: {
      companyName: string; gstin: string; contactName: string;
      email: string; phone: string; creditLimit?: number; paymentTermsDays?: number;
    },
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.b2bService.registerWholesaler(tenantId, body);
    return { success: true, data: result };
  }

  @Get("wholesalers")
  @ApiOperation({ summary: "List wholesale customers" })
  async list(@CurrentTenant() tenantId: string): Promise<{ success: boolean; data: unknown }> {
    return { success: true, data: await this.b2bService.listWholesalers(tenantId) };
  }

  @Post("bulk-pricing")
  @ApiOperation({ summary: "Set bulk pricing tiers for a product" })
  async setBulkPricing(
    @CurrentTenant() tenantId: string,
    @Body() body: { productId: string; tiers: Array<{ minQuantity: number; discountPercent: number }> },
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.b2bService.setBulkPricing(tenantId, body.productId, body.tiers);
    return { success: true, data: result };
  }

  @Post("calculate-price")
  @ApiOperation({ summary: "Calculate bulk price for quantity" })
  async calculatePrice(
    @CurrentTenant() tenantId: string,
    @Body() body: { productId: string; unitPrice: number; quantity: number },
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.b2bService.calculateBulkPrice(tenantId, body.productId, body.unitPrice, body.quantity);
    return { success: true, data: result };
  }

  @Get("credit/:customerId")
  @ApiOperation({ summary: "Check credit availability" })
  async checkCredit(
    @CurrentTenant() tenantId: string,
    @Param("customerId") customerId: string,
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.b2bService.checkCreditAvailability(tenantId, customerId, 0);
    return { success: true, data: result };
  }
}
