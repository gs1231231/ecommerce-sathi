import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  Query,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { CustomerService } from "./customer.service";
import { CurrentTenant } from "../../common/decorators/current-tenant.decorator";

@ApiTags("Customers")
@ApiBearerAuth()
@Controller("customers")
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get("segments")
  @ApiOperation({ summary: "Get customer segments with counts" })
  async getSegments(
    @CurrentTenant() tenantId: string,
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.customerService.getSegments(tenantId);
    return { success: true, data: result };
  }

  @Get()
  @ApiOperation({ summary: "List customers with pagination and search" })
  async findAll(
    @CurrentTenant() tenantId: string,
    @Query() query: Record<string, string>,
  ): Promise<{ success: boolean; data: unknown; meta: unknown }> {
    const result = await this.customerService.findAll(tenantId, {
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 20,
      search: query.search,
      tags: query.tags ? query.tags.split(",") : undefined,
    });
    return { success: true, data: result.data, meta: result.meta };
  }

  @Get(":id")
  @ApiOperation({ summary: "Get customer by ID with order history summary" })
  async findById(
    @CurrentTenant() tenantId: string,
    @Param("id") id: string,
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.customerService.findById(tenantId, id);
    return { success: true, data: result };
  }

  @Put(":id")
  @ApiOperation({ summary: "Update customer tags, notes, or marketing preferences" })
  async update(
    @CurrentTenant() tenantId: string,
    @Param("id") id: string,
    @Body() body: { tags?: string[]; notes?: string; acceptsMarketing?: boolean },
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.customerService.update(tenantId, id, body);
    return { success: true, data: result };
  }
}
