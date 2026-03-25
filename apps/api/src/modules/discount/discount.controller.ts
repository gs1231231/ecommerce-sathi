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
import { DiscountService } from "./discount.service";
import { CurrentTenant } from "../../common/decorators/current-tenant.decorator";

@ApiTags("Discounts")
@ApiBearerAuth()
@Controller("discounts")
export class DiscountController {
  constructor(private readonly discountService: DiscountService) {}

  @Post()
  @ApiOperation({ summary: "Create a new discount" })
  async create(
    @CurrentTenant() tenantId: string,
    @Body()
    body: {
      code: string;
      title: string;
      type: "percentage" | "fixed_amount" | "buy_x_get_y" | "free_shipping";
      value: number;
      minOrderAmount?: number;
      maxDiscount?: number;
      usageLimit?: number;
      perCustomerLimit?: number;
      isActive?: boolean;
      startsAt?: string;
      endsAt?: string;
      conditions?: Record<string, unknown>;
    },
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.discountService.create(tenantId, body);
    return { success: true, data: result };
  }

  @Get()
  @ApiOperation({ summary: "List discounts with pagination" })
  async findAll(
    @CurrentTenant() tenantId: string,
    @Query() query: Record<string, string>,
  ): Promise<{ success: boolean; data: unknown; meta: unknown }> {
    const result = await this.discountService.findAll(tenantId, {
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 20,
      isActive: query.isActive !== undefined ? query.isActive === "true" : undefined,
    });
    return { success: true, data: result.data, meta: result.meta };
  }

  @Post("validate")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Validate a discount code at checkout" })
  async validate(
    @CurrentTenant() tenantId: string,
    @Body() body: { code: string; orderAmount: number; customerId: string },
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.discountService.validateDiscount(
      tenantId,
      body.code,
      body.orderAmount,
      body.customerId,
    );
    return { success: true, data: result };
  }

  @Get(":id")
  @ApiOperation({ summary: "Get discount by ID" })
  async findById(
    @CurrentTenant() tenantId: string,
    @Param("id") id: string,
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.discountService.findById(tenantId, id);
    return { success: true, data: result };
  }

  @Put(":id")
  @ApiOperation({ summary: "Update a discount" })
  async update(
    @CurrentTenant() tenantId: string,
    @Param("id") id: string,
    @Body()
    body: {
      title?: string;
      type?: "percentage" | "fixed_amount" | "buy_x_get_y" | "free_shipping";
      value?: number;
      minOrderAmount?: number;
      maxDiscount?: number;
      usageLimit?: number;
      perCustomerLimit?: number;
      isActive?: boolean;
      startsAt?: string;
      endsAt?: string;
      conditions?: Record<string, unknown>;
    },
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.discountService.update(tenantId, id, body);
    return { success: true, data: result };
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Deactivate a discount" })
  async deactivate(
    @CurrentTenant() tenantId: string,
    @Param("id") id: string,
  ): Promise<{ success: boolean; data: { message: string } }> {
    await this.discountService.deactivate(tenantId, id);
    return { success: true, data: { message: "Discount deactivated" } };
  }
}
