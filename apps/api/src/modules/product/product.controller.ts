import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { ProductService } from "./product.service";
import { CurrentUser, JwtPayload } from "../../common/decorators/current-user.decorator";
import { CurrentTenant } from "../../common/decorators/current-tenant.decorator";

@ApiTags("Products")
@ApiBearerAuth()
@Controller("products")
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @ApiOperation({ summary: "Create a new product with variants" })
  async create(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: Record<string, unknown>,
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.productService.create(
      tenantId,
      user.userId,
      body as unknown as Parameters<ProductService["create"]>[2],
    );
    return { success: true, data: result };
  }

  @Get()
  @ApiOperation({ summary: "List products with filters and pagination" })
  async findAll(
    @CurrentTenant() tenantId: string,
    @Query() query: Record<string, string>,
  ): Promise<{ success: boolean; data: unknown; meta: unknown }> {
    const result = await this.productService.findAll(tenantId, {
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 20,
      status: query.status as "draft" | "active" | "archived" | undefined,
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder as "asc" | "desc" | undefined,
    });
    return { success: true, data: result.data, meta: result.meta };
  }

  @Get(":id")
  @ApiOperation({ summary: "Get product by ID with variants and images" })
  async findById(
    @CurrentTenant() tenantId: string,
    @Param("id") id: string,
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.productService.findById(tenantId, id);
    return { success: true, data: result };
  }

  @Put(":id")
  @ApiOperation({ summary: "Update a product" })
  async update(
    @CurrentTenant() tenantId: string,
    @Param("id") id: string,
    @Body() body: Record<string, unknown>,
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.productService.update(
      tenantId,
      id,
      body as Parameters<ProductService["update"]>[2],
    );
    return { success: true, data: result };
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Soft delete a product" })
  async remove(
    @CurrentTenant() tenantId: string,
    @Param("id") id: string,
  ): Promise<{ success: boolean; data: { message: string } }> {
    await this.productService.softDelete(tenantId, id);
    return { success: true, data: { message: "Product deleted" } };
  }

  @Post(":id/variants")
  @ApiOperation({ summary: "Add a variant to a product" })
  async addVariant(
    @CurrentTenant() tenantId: string,
    @Param("id") productId: string,
    @Body() body: Record<string, unknown>,
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.productService.addVariant(
      tenantId,
      productId,
      body as Parameters<ProductService["addVariant"]>[2],
    );
    return { success: true, data: result };
  }

  @Put(":id/variants/:vid")
  @ApiOperation({ summary: "Update a product variant" })
  async updateVariant(
    @CurrentTenant() tenantId: string,
    @Param("id") productId: string,
    @Param("vid") variantId: string,
    @Body() body: Record<string, unknown>,
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.productService.updateVariant(
      tenantId,
      productId,
      variantId,
      body as Parameters<ProductService["updateVariant"]>[3],
    );
    return { success: true, data: result };
  }

  @Delete(":id/variants/:vid")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Delete a product variant" })
  async deleteVariant(
    @CurrentTenant() tenantId: string,
    @Param("id") productId: string,
    @Param("vid") variantId: string,
  ): Promise<{ success: boolean; data: { message: string } }> {
    await this.productService.deleteVariant(tenantId, productId, variantId);
    return { success: true, data: { message: "Variant deleted" } };
  }

  @Put("bulk-action")
  @ApiOperation({ summary: "Bulk status change or delete products" })
  async bulkAction(
    @CurrentTenant() tenantId: string,
    @Body() body: { productIds: string[]; action: "activate" | "archive" | "delete" },
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.productService.bulkAction(
      tenantId,
      body.productIds,
      body.action,
    );
    return { success: true, data: result };
  }
}
