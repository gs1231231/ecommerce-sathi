import {
  Controller,
  Get,
  Param,
  Query,
  Header,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { SeoService } from "./seo.service";
import { CurrentTenant } from "../../common/decorators/current-tenant.decorator";
import { Public } from "../../common/decorators/public.decorator";

@ApiTags("SEO")
@Controller("seo")
export class SeoController {
  constructor(private readonly seoService: SeoService) {}

  @Get("sitemap.xml")
  @Public()
  @Header("Content-Type", "application/xml")
  @ApiOperation({ summary: "Get XML sitemap" })
  async getSitemap(
    @CurrentTenant() tenantId: string,
    @Query("domain") domain?: string,
  ): Promise<string> {
    return this.seoService.generateSitemap(
      tenantId,
      domain ?? "localhost",
    );
  }

  @Get("robots.txt")
  @Public()
  @Header("Content-Type", "text/plain")
  @ApiOperation({ summary: "Get robots.txt" })
  getRobotsTxt(
    @Query("domain") domain?: string,
  ): string {
    return this.seoService.generateRobotsTxt(domain ?? "localhost");
  }

  @Get("meta/:pageType")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get meta tags for a page type" })
  async getMetaTags(
    @CurrentTenant() tenantId: string,
    @Param("pageType") pageType: "home" | "product" | "category",
    @Query("slug") slug?: string,
  ): Promise<{ success: boolean; data: unknown }> {
    const metaTags = await this.seoService.getMetaTags(tenantId, pageType, slug);
    return { success: true, data: metaTags };
  }

  @Get("redirects")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get redirect rules" })
  async getRedirects(
    @CurrentTenant() tenantId: string,
  ): Promise<{ success: boolean; data: unknown }> {
    const redirects = await this.seoService.getRedirects(tenantId);
    return { success: true, data: redirects };
  }
}
