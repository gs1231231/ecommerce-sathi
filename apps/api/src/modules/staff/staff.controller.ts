import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { StaffService } from "./staff.service";
import { CurrentTenant } from "../../common/decorators/current-tenant.decorator";
import { Roles } from "../../common/decorators/roles.decorator";

@ApiTags("Staff")
@ApiBearerAuth()
@Controller("staff")
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get()
  @ApiOperation({ summary: "List all staff members" })
  async listStaff(
    @CurrentTenant() tenantId: string,
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.staffService.listStaff(tenantId);
    return { success: true, data: result };
  }

  @Post("invite")
  @ApiOperation({ summary: "Invite a new staff member" })
  async inviteStaff(
    @CurrentTenant() tenantId: string,
    @Body() body: { email: string; name: string; role: "owner" | "admin" | "staff" | "viewer" },
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.staffService.inviteStaff(
      tenantId,
      body.email,
      body.name,
      body.role,
    );
    return { success: true, data: result };
  }

  @Put(":id/role")
  @Roles("owner")
  @ApiOperation({ summary: "Update staff member role (owner only)" })
  async updateRole(
    @CurrentTenant() tenantId: string,
    @Param("id") id: string,
    @Body() body: { role: "owner" | "admin" | "staff" | "viewer" },
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.staffService.updateRole(tenantId, id, body.role);
    return { success: true, data: result };
  }

  @Delete(":id")
  @Roles("owner")
  @ApiOperation({ summary: "Remove a staff member (owner only)" })
  async removeStaff(
    @CurrentTenant() tenantId: string,
    @Param("id") id: string,
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.staffService.removeStaff(tenantId, id);
    return { success: true, data: result };
  }

  @Get("activity")
  @ApiOperation({ summary: "Get activity log" })
  async getActivityLog(
    @CurrentTenant() tenantId: string,
    @Query() query: Record<string, string>,
  ): Promise<{ success: boolean; data: unknown; meta: unknown }> {
    const result = await this.staffService.getActivityLog(tenantId, {
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 20,
    });
    return { success: true, data: result.data, meta: result.meta };
  }
}
