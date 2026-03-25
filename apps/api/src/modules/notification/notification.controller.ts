import {
  Controller,
  Get,
  Post,
  Body,
  Query,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { NotificationService } from "./notification.service";
import { CurrentTenant } from "../../common/decorators/current-tenant.decorator";

@ApiTags("Notifications")
@ApiBearerAuth()
@Controller("notifications")
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post("send")
  @ApiOperation({ summary: "Send a notification (email, sms, or whatsapp)" })
  async send(
    @CurrentTenant() tenantId: string,
    @Body()
    body: {
      channel: "email" | "sms" | "whatsapp";
      to: string;
      subject?: string;
      templateName?: string;
      variables?: Record<string, unknown>;
      message?: string;
    },
  ): Promise<{ success: boolean; data: unknown }> {
    if (body.channel === "email") {
      if (!body.subject || !body.templateName) {
        return {
          success: false,
          data: { error: "subject and templateName are required for email channel" },
        };
      }
      const result = await this.notificationService.sendEmail(
        body.to,
        body.subject,
        body.templateName as Parameters<NotificationService["sendEmail"]>[2],
        body.variables ?? {},
      );
      return { success: true, data: result };
    }

    if (body.channel === "sms") {
      if (!body.message) {
        return {
          success: false,
          data: { error: "message is required for sms channel" },
        };
      }
      const result = await this.notificationService.sendSms(body.to, body.message);
      return { success: true, data: result };
    }

    if (body.channel === "whatsapp") {
      // WhatsApp channel - mock implementation
      const result = await this.notificationService.sendSms(body.to, body.message ?? "");
      return { success: true, data: { ...result, channel: "whatsapp" } };
    }

    return {
      success: false,
      data: { error: "Invalid channel. Use email, sms, or whatsapp" },
    };
  }

  @Get()
  @ApiOperation({ summary: "Get notification history" })
  async getHistory(
    @CurrentTenant() tenantId: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("channel") channel?: "email" | "sms" | "whatsapp",
  ): Promise<{ success: boolean; data: unknown; meta: unknown }> {
    const result = await this.notificationService.getNotificationHistory(
      tenantId,
      {
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
        channel,
      },
    );
    return { success: true, data: result.items, meta: result.meta };
  }
}
