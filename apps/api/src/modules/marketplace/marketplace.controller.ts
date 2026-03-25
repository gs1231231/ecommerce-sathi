import { Controller, Get, Post, Body, Param } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { MarketplaceService } from "./marketplace.service";
import { CurrentTenant } from "../../common/decorators/current-tenant.decorator";
import { Roles } from "../../common/decorators/roles.decorator";

@ApiTags("Marketplace")
@ApiBearerAuth()
@Controller("marketplace")
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Post("vendors")
  @ApiOperation({ summary: "Onboard a new vendor" })
  async onboard(
    @CurrentTenant() tenantId: string,
    @Body() body: { name: string; email: string; phone: string; commissionPercent?: number },
  ): Promise<{ success: boolean; data: unknown }> {
    const vendor = await this.marketplaceService.onboardVendor(tenantId, body);
    return { success: true, data: vendor };
  }

  @Get("vendors")
  @ApiOperation({ summary: "List all vendors" })
  async list(@CurrentTenant() tenantId: string): Promise<{ success: boolean; data: unknown }> {
    const vendors = await this.marketplaceService.listVendors(tenantId);
    return { success: true, data: vendors };
  }

  @Post("vendors/:id/approve")
  @Roles("owner", "admin")
  @ApiOperation({ summary: "Approve a vendor" })
  async approve(
    @CurrentTenant() tenantId: string,
    @Param("id") id: string,
  ): Promise<{ success: boolean; data: unknown }> {
    const vendor = await this.marketplaceService.approveVendor(tenantId, id);
    return { success: true, data: vendor };
  }

  @Get("vendors/:id/payouts")
  @ApiOperation({ summary: "Get vendor payout summary" })
  async payouts(
    @CurrentTenant() tenantId: string,
    @Param("id") id: string,
  ): Promise<{ success: boolean; data: unknown }> {
    const summary = await this.marketplaceService.getPayoutSummary(tenantId, id);
    return { success: true, data: summary };
  }
}
