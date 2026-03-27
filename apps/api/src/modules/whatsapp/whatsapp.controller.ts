import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Res,
} from "@nestjs/common";
import { Response } from "express";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { WhatsAppService } from "./whatsapp.service";
import { Public } from "../../common/decorators/public.decorator";
import { CurrentTenant } from "../../common/decorators/current-tenant.decorator";

interface WebhookQueryParams {
  "hub.mode"?: string;
  "hub.challenge"?: string;
  "hub.verify_token"?: string;
}

interface IncomingWebhookBody {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: { phone_number_id: string };
        messages?: Array<{
          from: string;
          type: string;
          text?: { body: string };
        }>;
      };
      field: string;
    }>;
  }>;
}

interface SendTemplateBody {
  phone: string;
  templateName:
    | "order_confirmation"
    | "shipping_update"
    | "delivery_update"
    | "cod_verification"
    | "abandoned_cart";
  params: Record<string, string>;
}

@ApiTags("WhatsApp")
@Controller("whatsapp")
export class WhatsAppController {
  constructor(private readonly whatsAppService: WhatsAppService) {}

  @Get("webhook")
  @Public()
  @ApiOperation({ summary: "WhatsApp webhook challenge verification" })
  verifyWebhook(
    @Query() query: WebhookQueryParams,
    @Res() res: Response,
  ): void {
    const mode = query["hub.mode"];
    const challenge = query["hub.challenge"];
    const verifyToken = query["hub.verify_token"];

    // In production, verify against stored token from env config
    const expectedToken = "ecommerce_sathi_whatsapp_verify";

    if (mode === "subscribe" && verifyToken === expectedToken) {
      res.set("Content-Type", "text/plain").status(200).send(challenge ?? "");
      return;
    }

    res.set("Content-Type", "text/plain").status(403).send("");
  }

  @Post("webhook")
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Receive incoming WhatsApp messages" })
  async handleWebhook(
    @Body() body: IncomingWebhookBody,
  ): Promise<{ success: boolean; data: { processed: boolean } }> {
    if (body.object !== "whatsapp_business_account") {
      return { success: true, data: { processed: false } };
    }

    for (const entry of body.entry) {
      for (const change of entry.changes) {
        const messages = change.value.messages;
        if (!messages) {
          continue;
        }

        for (const message of messages) {
          if (message.type === "text" && message.text?.body) {
            // Use entry ID as tenant identifier for webhook context
            const tenantId = entry.id;
            this.whatsAppService.handleIncomingMessage(
              tenantId,
              message.from,
              message.text.body,
            );
          }
        }
      }
    }

    return { success: true, data: { processed: true } };
  }

  @Post("send")
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Send a WhatsApp template message" })
  async sendTemplate(
    @CurrentTenant() tenantId: string,
    @Body() body: SendTemplateBody,
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.whatsAppService.sendTemplate(
      tenantId,
      body.phone,
      body.templateName,
      body.params,
    );
    return { success: true, data: result };
  }
}
