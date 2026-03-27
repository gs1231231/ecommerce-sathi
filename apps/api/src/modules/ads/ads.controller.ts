import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AdsService } from "./ads.service";
import { CurrentTenant } from "../../common/decorators/current-tenant.decorator";

@ApiTags("Ads")
@ApiBearerAuth()
@Controller("ads")
export class AdsController {
  constructor(private readonly adsService: AdsService) {}

  // --- Account Connection ---

  @Post("accounts/connect")
  @ApiOperation({ summary: "Connect Meta or Google ad account" })
  async connectAccount(
    @CurrentTenant() tenantId: string,
    @Body() body: {
      platform: "meta" | "google";
      accountId: string;
      accountName: string;
      accessToken: string;
      refreshToken?: string;
    },
  ): Promise<{ success: boolean; data: unknown }> {
    const account = await this.adsService.connectAccount(tenantId, body.platform, body);
    return { success: true, data: account };
  }

  @Get("accounts")
  @ApiOperation({ summary: "List connected ad accounts" })
  async getAccounts(
    @CurrentTenant() tenantId: string,
  ): Promise<{ success: boolean; data: unknown }> {
    const accounts = await this.adsService.getConnectedAccounts(tenantId);
    return { success: true, data: accounts };
  }

  @Delete("accounts/:platform")
  @ApiOperation({ summary: "Disconnect an ad account" })
  async disconnectAccount(
    @CurrentTenant() tenantId: string,
    @Param("platform") platform: "meta" | "google",
  ): Promise<{ success: boolean; data: { message: string } }> {
    await this.adsService.disconnectAccount(tenantId, platform);
    return { success: true, data: { message: `${platform} account disconnected` } };
  }

  // --- Campaigns ---

  @Post("campaigns")
  @ApiOperation({ summary: "Create an ad campaign" })
  async createCampaign(
    @CurrentTenant() tenantId: string,
    @Body() body: Parameters<AdsService["createCampaign"]>[1],
  ): Promise<{ success: boolean; data: unknown }> {
    const campaign = await this.adsService.createCampaign(tenantId, body);
    return { success: true, data: campaign };
  }

  @Get("campaigns")
  @ApiOperation({ summary: "List ad campaigns" })
  async listCampaigns(
    @CurrentTenant() tenantId: string,
    @Query("platform") platform?: "meta" | "google",
    @Query("status") status?: string,
  ): Promise<{ success: boolean; data: unknown }> {
    const campaigns = await this.adsService.listCampaigns(tenantId, { platform, status });
    return { success: true, data: campaigns };
  }

  @Get("campaigns/:id")
  @ApiOperation({ summary: "Get campaign details with metrics" })
  async getCampaign(
    @CurrentTenant() tenantId: string,
    @Param("id") id: string,
  ): Promise<{ success: boolean; data: unknown }> {
    const campaign = await this.adsService.getCampaign(tenantId, id);
    return { success: true, data: campaign };
  }

  @Put("campaigns/:id/status")
  @ApiOperation({ summary: "Activate or pause a campaign" })
  async updateStatus(
    @CurrentTenant() tenantId: string,
    @Param("id") id: string,
    @Body() body: { status: "active" | "paused" },
  ): Promise<{ success: boolean; data: unknown }> {
    const campaign = await this.adsService.updateCampaignStatus(tenantId, id, body.status);
    return { success: true, data: campaign };
  }

  @Delete("campaigns/:id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Delete a campaign" })
  async deleteCampaign(
    @CurrentTenant() tenantId: string,
    @Param("id") id: string,
  ): Promise<{ success: boolean; data: { message: string } }> {
    await this.adsService.deleteCampaign(tenantId, id);
    return { success: true, data: { message: "Campaign deleted" } };
  }

  // --- Audiences ---

  @Post("audiences")
  @ApiOperation({ summary: "Create a custom audience" })
  async createAudience(
    @CurrentTenant() tenantId: string,
    @Body() body: {
      platform: "meta" | "google";
      name: string;
      type: "custom" | "lookalike" | "interest" | "retargeting";
      source?: string;
    },
  ): Promise<{ success: boolean; data: unknown }> {
    const audience = await this.adsService.createAudience(tenantId, body);
    return { success: true, data: audience };
  }

  @Get("audiences")
  @ApiOperation({ summary: "List audiences" })
  async listAudiences(
    @CurrentTenant() tenantId: string,
  ): Promise<{ success: boolean; data: unknown }> {
    const audiences = await this.adsService.listAudiences(tenantId);
    return { success: true, data: audiences };
  }

  // --- Catalog & Pixel ---

  @Post("catalog/sync")
  @ApiOperation({ summary: "Sync product catalog to ad platform" })
  async syncCatalog(
    @CurrentTenant() tenantId: string,
    @Body() body: { platform: "meta" | "google" },
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.adsService.syncProductCatalog(tenantId, body.platform);
    return { success: true, data: result };
  }

  @Get("pixel/:platform")
  @ApiOperation({ summary: "Get pixel/tag code for storefront" })
  async getPixel(
    @CurrentTenant() tenantId: string,
    @Param("platform") platform: "meta" | "google",
  ): Promise<{ success: boolean; data: unknown }> {
    const pixel = await this.adsService.getPixelCode(tenantId, platform);
    return { success: true, data: pixel };
  }

  // --- Dashboard ---

  @Get("dashboard")
  @ApiOperation({ summary: "Get ads performance dashboard" })
  async getDashboard(
    @CurrentTenant() tenantId: string,
  ): Promise<{ success: boolean; data: unknown }> {
    const dashboard = await this.adsService.getAdsDashboard(tenantId);
    return { success: true, data: dashboard };
  }
}
