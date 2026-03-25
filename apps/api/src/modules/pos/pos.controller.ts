import { Controller, Get, Post, Body, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { PosService } from "./pos.service";
import { CurrentTenant } from "../../common/decorators/current-tenant.decorator";

@ApiTags("POS")
@ApiBearerAuth()
@Controller("pos")
export class PosController {
  constructor(private readonly posService: PosService) {}

  @Get("barcode")
  @ApiOperation({ summary: "Search product by barcode" })
  async searchBarcode(
    @CurrentTenant() tenantId: string,
    @Query("code") code: string,
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.posService.searchByBarcode(tenantId, code);
    return { success: true, data: result };
  }

  @Get("search")
  @ApiOperation({ summary: "Quick product search for POS" })
  async quickSearch(
    @CurrentTenant() tenantId: string,
    @Query("q") query: string,
  ): Promise<{ success: boolean; data: unknown }> {
    const results = await this.posService.quickSearch(tenantId, query);
    return { success: true, data: results };
  }

  @Post("receipt")
  @ApiOperation({ summary: "Generate receipt text" })
  async generateReceipt(
    @Body() body: {
      items: Array<{ title: string; quantity: number; price: number; total: number }>;
      payment: { method: string; amount: number; change: number };
      storeName: string;
    },
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.posService.generateReceipt(body.items, body.payment, body.storeName);
    return { success: true, data: result };
  }

  @Post("cash-drawer")
  @ApiOperation({ summary: "Open cash drawer" })
  async openDrawer(): Promise<{ success: boolean; data: unknown }> {
    const result = await this.posService.openCashDrawer();
    return { success: true, data: result };
  }
}
