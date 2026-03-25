import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { WebhookService } from "./webhook.service";
import { CurrentTenant } from "../../common/decorators/current-tenant.decorator";
import { Roles } from "../../common/decorators/roles.decorator";

@ApiTags("Webhooks")
@ApiBearerAuth()
@Controller("webhooks")
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post()
  @Roles("owner", "admin")
  @ApiOperation({ summary: "Register a webhook endpoint" })
  async register(
    @CurrentTenant() tenantId: string,
    @Body() body: { url: string; events: string[] },
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.webhookService.register(tenantId, body.url, body.events);
    return { success: true, data: result };
  }

  @Get()
  @ApiOperation({ summary: "List registered webhooks" })
  async list(
    @CurrentTenant() tenantId: string,
  ): Promise<{ success: boolean; data: unknown }> {
    const webhooks = await this.webhookService.listWebhooks(tenantId);
    return { success: true, data: webhooks };
  }

  @Delete(":id")
  @Roles("owner", "admin")
  @ApiOperation({ summary: "Delete a webhook" })
  async remove(
    @CurrentTenant() tenantId: string,
    @Param("id") id: string,
  ): Promise<{ success: boolean; data: { message: string } }> {
    await this.webhookService.deleteWebhook(tenantId, id);
    return { success: true, data: { message: "Webhook deleted" } };
  }

  @Get(":id/deliveries")
  @ApiOperation({ summary: "Get webhook delivery log" })
  async deliveries(
    @CurrentTenant() tenantId: string,
    @Param("id") id: string,
  ): Promise<{ success: boolean; data: unknown }> {
    const log = await this.webhookService.getDeliveryLog(tenantId, id);
    return { success: true, data: log };
  }
}
