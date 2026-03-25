import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { GstService } from "./gst.service";
import { CurrentTenant } from "../../common/decorators/current-tenant.decorator";

interface SuggestHsnBody {
  title: string;
  description: string;
  category?: string;
}

interface CalculateGstBody {
  items: Array<{
    amount: number;
    gstRate: number;
    hsnCode?: string;
    quantity: number;
  }>;
  shippingState: string;
  merchantState: string;
}

@ApiTags("GST")
@Controller("gst")
export class GstController {
  constructor(private readonly gstService: GstService) {}

  @Post("suggest-hsn")
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Suggest HSN codes for a product" })
  suggestHsn(
    @Body() body: SuggestHsnBody,
  ): { success: boolean; data: unknown } {
    const suggestions = this.gstService.suggestHsnCode(
      body.title,
      body.description,
      body.category,
    );
    return { success: true, data: { suggestions } };
  }

  @Post("calculate")
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Calculate GST breakdown for items" })
  calculate(
    @Body() body: CalculateGstBody,
  ): { success: boolean; data: unknown } {
    const result = this.gstService.calculateGst(
      body.items,
      body.shippingState,
      body.merchantState,
    );
    return { success: true, data: result };
  }

  @Get("export/gstr1")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Export GSTR-1 summary for a given month and year" })
  @ApiQuery({ name: "month", type: Number, example: 3 })
  @ApiQuery({ name: "year", type: Number, example: 2026 })
  async exportGstr1(
    @CurrentTenant() tenantId: string,
    @Query("month") month: string,
    @Query("year") year: string,
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.gstService.getGstr1Summary(
      tenantId,
      parseInt(month, 10),
      parseInt(year, 10),
    );
    return { success: true, data: result };
  }
}
