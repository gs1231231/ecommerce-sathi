import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { RecommendationService } from "./recommendation.service";
import { CurrentTenant } from "../../common/decorators/current-tenant.decorator";
import { Public } from "../../common/decorators/public.decorator";

@ApiTags("Recommendations")
@ApiBearerAuth()
@Controller("recommendations")
export class RecommendationController {
  constructor(
    private readonly recommendationService: RecommendationService,
  ) {}

  @Get("product/:productId")
  @Public()
  @ApiOperation({ summary: "Get content-based product recommendations" })
  async getRecommendations(
    @CurrentTenant() tenantId: string,
    @Param("productId") productId: string,
    @Query("limit") limit: string = "10",
  ): Promise<{ success: boolean; data: unknown }> {
    const recommendations = await this.recommendationService.getRecommendations(
      tenantId,
      productId,
      parseInt(limit) || 10,
    );
    return { success: true, data: recommendations };
  }

  @Get("personalized/:customerId")
  @ApiOperation({ summary: "Get personalized recommendations for a customer" })
  async getPersonalized(
    @CurrentTenant() tenantId: string,
    @Param("customerId") customerId: string,
    @Query("limit") limit: string = "10",
  ): Promise<{ success: boolean; data: unknown }> {
    const recommendations = await this.recommendationService.getPersonalized(
      tenantId,
      customerId,
      parseInt(limit) || 10,
    );
    return { success: true, data: recommendations };
  }

  @Get("trending")
  @Public()
  @ApiOperation({ summary: "Get trending products" })
  async getTrending(
    @CurrentTenant() tenantId: string,
    @Query("limit") limit: string = "10",
  ): Promise<{ success: boolean; data: unknown }> {
    const trending = await this.recommendationService.getTrending(
      tenantId,
      parseInt(limit) || 10,
    );
    return { success: true, data: trending };
  }

  @Get("frequently-bought/:productId")
  @Public()
  @ApiOperation({ summary: "Get frequently bought together products" })
  async getFrequentlyBoughtTogether(
    @CurrentTenant() tenantId: string,
    @Param("productId") productId: string,
  ): Promise<{ success: boolean; data: unknown }> {
    const products =
      await this.recommendationService.getFrequentlyBoughtTogether(
        tenantId,
        productId,
      );
    return { success: true, data: products };
  }
}
