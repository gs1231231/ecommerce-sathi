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
import { DigitalProductService } from "./digital-product.service";
import { CurrentTenant } from "../../common/decorators/current-tenant.decorator";
import { Public } from "../../common/decorators/public.decorator";

@ApiTags("Digital Products")
@ApiBearerAuth()
@Controller("digital-products")
export class DigitalProductController {
  constructor(
    private readonly digitalProductService: DigitalProductService,
  ) {}

  @Post("assets")
  @ApiOperation({ summary: "Create a digital asset for a product" })
  async createAsset(
    @CurrentTenant() tenantId: string,
    @Body()
    body: {
      productId: string;
      fileName: string;
      fileSize: number;
      fileType: string;
      downloadLimit: number;
      expiryDays: number;
    },
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.digitalProductService.createDigitalAsset(
      tenantId,
      body.productId,
      {
        fileName: body.fileName,
        fileSize: body.fileSize,
        fileType: body.fileType,
        downloadLimit: body.downloadLimit,
        expiryDays: body.expiryDays,
      },
    );
    return { success: true, data: result };
  }

  @Post("download-link")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Generate a download link for a digital asset" })
  async generateDownloadLink(
    @CurrentTenant() tenantId: string,
    @Body() body: { orderId: string; assetId: string },
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.digitalProductService.generateDownloadLink(
      tenantId,
      body.orderId,
      body.assetId,
    );
    return { success: true, data: result };
  }

  @Get("download/:token")
  @Public()
  @ApiOperation({ summary: "Download a digital product file" })
  async download(
    @Param("token") token: string,
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.digitalProductService.validateDownload(token);

    if (!result.valid) {
      return {
        success: false,
        data: { message: result.reason },
      };
    }

    // MVP: Return asset info. In production, would stream the actual file.
    return {
      success: true,
      data: {
        message: "Download validated",
        asset: result.asset,
        licenseKey: this.digitalProductService.generateLicenseKey(),
      },
    };
  }

  @Get("assets/:id/history")
  @ApiOperation({ summary: "Get download history for a digital asset" })
  async getHistory(
    @CurrentTenant() tenantId: string,
    @Param("id") id: string,
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.digitalProductService.getDownloadHistory(
      tenantId,
      id,
    );
    return { success: true, data: result };
  }
}
