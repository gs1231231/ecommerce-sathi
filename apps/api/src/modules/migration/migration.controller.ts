import { Controller, Get, Post, Body, Param } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { MigrationService } from "./migration.service";
import { CurrentTenant } from "../../common/decorators/current-tenant.decorator";
import { CurrentUser, JwtPayload } from "../../common/decorators/current-user.decorator";

@ApiTags("Migration")
@ApiBearerAuth()
@Controller("migration")
export class MigrationController {
  constructor(private readonly migrationService: MigrationService) {}

  @Post("import/:platform")
  @ApiOperation({ summary: "Import products from external platform CSV" })
  async importProducts(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: JwtPayload,
    @Param("platform") platform: string,
    @Body() body: { csvContent: string },
  ): Promise<{ success: boolean; data: unknown }> {
    let result: unknown;

    if (platform === "shopify") {
      result = await this.migrationService.importFromShopify(
        tenantId,
        user.userId,
        body.csvContent,
      );
    } else if (platform === "woocommerce") {
      result = await this.migrationService.importFromWooCommerce(
        tenantId,
        user.userId,
        body.csvContent,
      );
    } else {
      return {
        success: false,
        data: {
          error: `Unsupported platform: ${platform}. Supported: shopify, woocommerce`,
        },
      };
    }

    return { success: true, data: result };
  }

  @Get("template/:platform")
  @ApiOperation({ summary: "Get CSV import template for a platform" })
  async getTemplate(
    @Param("platform") platform: string,
  ): Promise<{ success: boolean; data: { template: string } }> {
    const template = this.migrationService.getImportTemplate(platform);
    return { success: true, data: { template } };
  }

  @Post("validate/:platform")
  @ApiOperation({ summary: "Validate CSV content against platform format" })
  async validateImport(
    @Param("platform") platform: string,
    @Body() body: { csvContent: string },
  ): Promise<{ success: boolean; data: unknown }> {
    const result = this.migrationService.validateImport(
      platform,
      body.csvContent,
    );
    return { success: true, data: result };
  }
}
