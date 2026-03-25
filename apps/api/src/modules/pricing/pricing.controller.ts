import { Controller, Get, Post, Body, Param } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { PricingService } from "./pricing.service";
import { CurrentTenant } from "../../common/decorators/current-tenant.decorator";

@ApiTags("Pricing")
@ApiBearerAuth()
@Controller("pricing")
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Post("calculate")
  @ApiOperation({ summary: "Calculate dynamic price for a product" })
  async calculatePrice(
    @CurrentTenant() tenantId: string,
    @Body()
    body: {
      productId: string;
      quantity?: number;
      customerId?: string;
      time?: string;
    },
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.pricingService.calculateDynamicPrice(
      tenantId,
      body.productId,
      {
        quantity: body.quantity,
        customerId: body.customerId,
        time: body.time,
      },
    );
    return { success: true, data: result };
  }

  @Get("history/:productId")
  @ApiOperation({ summary: "Get price history for a product" })
  async getPriceHistory(
    @CurrentTenant() tenantId: string,
    @Param("productId") productId: string,
  ): Promise<{ success: boolean; data: unknown }> {
    const history = await this.pricingService.getPriceHistory(
      tenantId,
      productId,
    );
    return { success: true, data: history };
  }

  @Post("rules")
  @ApiOperation({ summary: "Create a pricing rule" })
  async createRule(
    @CurrentTenant() tenantId: string,
    @Body()
    body: {
      productId?: string;
      categoryId?: string;
      ruleType: string;
      value: number;
      conditions?: Record<string, unknown>;
    },
  ): Promise<{ success: boolean; data: unknown }> {
    const rule = this.pricingService.setRule(tenantId, body);
    return { success: true, data: rule };
  }

  @Get("rules")
  @ApiOperation({ summary: "List all pricing rules" })
  async listRules(
    @CurrentTenant() tenantId: string,
  ): Promise<{ success: boolean; data: unknown }> {
    const rules = this.pricingService.listRules(tenantId);
    return { success: true, data: rules };
  }
}
