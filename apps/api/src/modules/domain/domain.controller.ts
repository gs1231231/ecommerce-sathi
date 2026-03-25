import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { DomainService } from "./domain.service";
import { CurrentTenant } from "../../common/decorators/current-tenant.decorator";

@ApiTags("Domains")
@ApiBearerAuth()
@Controller("domains")
export class DomainController {
  constructor(private readonly domainService: DomainService) {}

  @Get()
  @ApiOperation({ summary: "Get current domain configuration" })
  async getDomainConfig(
    @CurrentTenant() tenantId: string,
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.domainService.getDomainConfig(tenantId);
    return { success: true, data: result };
  }

  @Post("check")
  @ApiOperation({ summary: "Check if a custom domain is available" })
  async checkAvailability(
    @Body() body: { domain: string },
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.domainService.checkDomainAvailability(body.domain);
    return { success: true, data: result };
  }

  @Post("set")
  @ApiOperation({ summary: "Set a custom domain for the tenant" })
  async setCustomDomain(
    @CurrentTenant() tenantId: string,
    @Body() body: { domain: string },
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.domainService.setCustomDomain(tenantId, body.domain);
    return { success: true, data: result };
  }

  @Post("verify")
  @ApiOperation({ summary: "Verify DNS configuration for custom domain" })
  async verifyDomain(
    @CurrentTenant() tenantId: string,
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.domainService.verifyDomain(tenantId);
    return { success: true, data: result };
  }

  @Delete()
  @ApiOperation({ summary: "Remove custom domain" })
  async removeDomain(
    @CurrentTenant() tenantId: string,
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.domainService.removeDomain(tenantId);
    return { success: true, data: result };
  }
}
