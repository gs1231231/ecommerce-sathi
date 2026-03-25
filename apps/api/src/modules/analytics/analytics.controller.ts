import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AnalyticsService } from "./analytics.service";
import { CurrentTenant } from "../../common/decorators/current-tenant.decorator";

@ApiTags("Analytics")
@ApiBearerAuth()
@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get("dashboard")
  @ApiOperation({ summary: "Get dashboard analytics" })
  async getDashboard(
    @CurrentTenant() tenantId: string,
    @Query("period") period: string = "30d",
  ): Promise<{ success: boolean; data: unknown }> {
    const validPeriods = ["today", "7d", "30d", "90d"] as const;
    const p = validPeriods.includes(period as typeof validPeriods[number])
      ? (period as typeof validPeriods[number])
      : "30d";
    const stats = await this.analyticsService.getDashboardStats(tenantId, p);
    return { success: true, data: stats };
  }

  @Get("top-products")
  @ApiOperation({ summary: "Get top selling products" })
  async getTopProducts(
    @CurrentTenant() tenantId: string,
    @Query("limit") limit: string = "10",
  ): Promise<{ success: boolean; data: unknown }> {
    const products = await this.analyticsService.getTopProducts(
      tenantId,
      parseInt(limit) || 10,
    );
    return { success: true, data: products };
  }

  @Get("revenue")
  @ApiOperation({ summary: "Get daily revenue trend" })
  async getRevenue(
    @CurrentTenant() tenantId: string,
    @Query("days") days: string = "30",
  ): Promise<{ success: boolean; data: unknown }> {
    const revenue = await this.analyticsService.getRevenueByDay(
      tenantId,
      parseInt(days) || 30,
    );
    return { success: true, data: revenue };
  }

  @Get("orders-by-status")
  @ApiOperation({ summary: "Get orders breakdown by status" })
  async getOrdersByStatus(
    @CurrentTenant() tenantId: string,
  ): Promise<{ success: boolean; data: unknown }> {
    const breakdown = await this.analyticsService.getOrdersByStatus(tenantId);
    return { success: true, data: breakdown };
  }
}
