import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { I18nService } from "./i18n.service";
import { CurrentTenant } from "../../common/decorators/current-tenant.decorator";
import { Public } from "../../common/decorators/public.decorator";

@ApiTags("I18n")
@ApiBearerAuth()
@Controller("i18n")
export class I18nController {
  constructor(private readonly i18nService: I18nService) {}

  @Get("locales")
  @Public()
  @ApiOperation({ summary: "Get supported locales" })
  getLocales(): { success: boolean; data: unknown } {
    const result = this.i18nService.getSupportedLocales();
    return { success: true, data: result };
  }

  @Post("translate")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Translate text to target locale" })
  async translate(
    @Body() body: { text: string; targetLocale: string },
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.i18nService.translateText(
      body.text,
      body.targetLocale,
    );
    return { success: true, data: result };
  }

  @Post("translate-product")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Translate product to target locale" })
  async translateProduct(
    @CurrentTenant() tenantId: string,
    @Body() body: { productId: string; targetLocale: string },
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.i18nService.translateProduct(
      tenantId,
      body.productId,
      body.targetLocale,
    );
    return { success: true, data: result };
  }

  @Get("translations/:locale")
  @Public()
  @ApiOperation({ summary: "Get UI translations for a locale" })
  getTranslations(
    @CurrentTenant() tenantId: string,
    @Param("locale") locale: string,
  ): { success: boolean; data: unknown } {
    const result = this.i18nService.getTranslations(tenantId, locale);
    return { success: true, data: result };
  }
}
