import { Controller, Get, Put, Param, Body } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { TenantService } from "./tenant.service";
import { CurrentTenant } from "../../common/decorators/current-tenant.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { Public } from "../../common/decorators/public.decorator";

@ApiTags("Tenants")
@Controller("tenants")
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get("current")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current tenant details" })
  async getCurrent(
    @CurrentTenant() tenantId: string,
  ): Promise<{ success: boolean; data: unknown }> {
    const tenant = await this.tenantService.findById(tenantId);
    return { success: true, data: tenant };
  }

  @Get("by-slug/:slug")
  @Public()
  @ApiOperation({ summary: "Get tenant by slug (public)" })
  async getBySlug(
    @Param("slug") slug: string,
  ): Promise<{ success: boolean; data: unknown }> {
    const tenant = await this.tenantService.findBySlug(slug);
    return { success: true, data: tenant };
  }

  @Get("by-domain/:domain")
  @Public()
  @ApiOperation({ summary: "Get tenant by domain (public)" })
  async getByDomain(
    @Param("domain") domain: string,
  ): Promise<{ success: boolean; data: unknown }> {
    const tenant = await this.tenantService.findByDomain(domain);
    return { success: true, data: tenant };
  }

  @Put("current")
  @ApiBearerAuth()
  @Roles("owner", "admin")
  @ApiOperation({ summary: "Update current tenant settings" })
  async update(
    @CurrentTenant() tenantId: string,
    @Body()
    body: {
      name?: string;
      logoUrl?: string;
      settings?: Record<string, unknown>;
      customDomain?: string;
    },
  ): Promise<{ success: boolean; data: unknown }> {
    const tenant = await this.tenantService.update(tenantId, body);
    return { success: true, data: tenant };
  }
}
