import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { OrderService } from "./order.service";
import { CurrentTenant } from "../../common/decorators/current-tenant.decorator";

@ApiTags("Orders")
@ApiBearerAuth()
@Controller("orders")
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @ApiOperation({ summary: "Create a new order" })
  async create(
    @CurrentTenant() tenantId: string,
    @Body() body: Record<string, unknown>,
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.orderService.create(
      tenantId,
      body as unknown as Parameters<OrderService["create"]>[1],
    );
    return { success: true, data: result };
  }

  @Get()
  @ApiOperation({ summary: "List orders with filters and pagination" })
  async findAll(
    @CurrentTenant() tenantId: string,
    @Query() query: Record<string, string>,
  ): Promise<{ success: boolean; data: unknown; meta: unknown }> {
    const result = await this.orderService.findAll(tenantId, {
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 20,
      status: query.status,
      search: query.search,
      sortOrder: query.sortOrder as "asc" | "desc" | undefined,
    });
    return { success: true, data: result.data, meta: result.meta };
  }

  @Get("stats")
  @ApiOperation({ summary: "Get order statistics" })
  async getStats(
    @CurrentTenant() tenantId: string,
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.orderService.getStats(tenantId);
    return { success: true, data: result };
  }

  @Get(":id")
  @ApiOperation({ summary: "Get order by ID with items" })
  async findById(
    @CurrentTenant() tenantId: string,
    @Param("id") id: string,
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.orderService.findById(tenantId, id);
    return { success: true, data: result };
  }

  @Put(":id/status")
  @ApiOperation({ summary: "Update order status with state machine validation" })
  async updateStatus(
    @CurrentTenant() tenantId: string,
    @Param("id") id: string,
    @Body() body: { status: string; reason?: string },
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.orderService.updateStatus(
      tenantId,
      id,
      body.status,
      body.reason,
    );
    return { success: true, data: result };
  }

  @Post(":id/cancel")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Cancel an order" })
  async cancel(
    @CurrentTenant() tenantId: string,
    @Param("id") id: string,
    @Body() body: { reason?: string },
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.orderService.updateStatus(
      tenantId,
      id,
      "cancelled",
      body.reason,
    );
    return { success: true, data: result };
  }
}
