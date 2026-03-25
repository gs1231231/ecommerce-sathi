import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { StorefrontService } from "./storefront.service";
import { Public } from "../../common/decorators/public.decorator";

@ApiTags("Storefront")
@Controller("storefront")
export class StorefrontController {
  constructor(private readonly storefrontService: StorefrontService) {}

  @Get(":slug")
  @Public()
  @ApiOperation({ summary: "Get store config by slug (public)" })
  async getStore(
    @Param("slug") slug: string,
  ): Promise<{ success: boolean; data: unknown }> {
    const store = await this.storefrontService.getStoreBySlug(slug);
    return { success: true, data: store };
  }

  @Get(":slug/products")
  @Public()
  @ApiOperation({ summary: "Get active products for storefront (public)" })
  async getProducts(
    @Param("slug") slug: string,
    @Query() query: { page?: string; limit?: string; category?: string; search?: string },
  ): Promise<{ success: boolean; data: unknown; meta: unknown }> {
    const store = await this.storefrontService.getStoreBySlug(slug);
    const storeId = (store as { id: string }).id;
    const result = await this.storefrontService.getActiveProducts(storeId, {
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 20,
      categorySlug: query.category,
      search: query.search,
    });
    return { success: true, data: result.data, meta: result.meta };
  }

  @Get(":slug/products/:productSlug")
  @Public()
  @ApiOperation({ summary: "Get product detail by slug (public)" })
  async getProduct(
    @Param("slug") storeSlug: string,
    @Param("productSlug") productSlug: string,
  ): Promise<{ success: boolean; data: unknown }> {
    const store = await this.storefrontService.getStoreBySlug(storeSlug);
    const storeId = (store as { id: string }).id;
    const product = await this.storefrontService.getProductBySlug(storeId, productSlug);
    return { success: true, data: product };
  }

  @Get(":slug/categories")
  @Public()
  @ApiOperation({ summary: "Get categories for storefront (public)" })
  async getCategories(
    @Param("slug") slug: string,
  ): Promise<{ success: boolean; data: unknown }> {
    const store = await this.storefrontService.getStoreBySlug(slug);
    const storeId = (store as { id: string }).id;
    const cats = await this.storefrontService.getCategories(storeId);
    return { success: true, data: cats };
  }
}
