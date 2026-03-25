import { Injectable, Inject, HttpStatus } from "@nestjs/common";
import { createHmac } from "crypto";
import { PinoLogger } from "nestjs-pino";
import { AppError } from "../../common/exceptions/app-error";
import { DATABASE_TOKEN, DatabaseInstance } from "../database/database.module";

interface WebhookConfig {
  id: string;
  tenantId: string;
  url: string;
  events: string[];
  secret: string;
  isActive: boolean;
}

interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: string;
  payload: Record<string, unknown>;
  statusCode: number | null;
  response: string | null;
  attempts: number;
  deliveredAt: Date | null;
}

// In-memory store for MVP (move to DB table later)
const webhookConfigs: WebhookConfig[] = [];
const deliveryLog: WebhookDelivery[] = [];

@Injectable()
export class WebhookService {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: DatabaseInstance,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext("WebhookService");
  }

  async register(
    tenantId: string,
    url: string,
    events: string[],
  ): Promise<WebhookConfig> {
    const validEvents = [
      "order.created",
      "order.updated",
      "order.cancelled",
      "product.created",
      "product.updated",
      "product.deleted",
      "payment.captured",
      "payment.refunded",
      "shipment.created",
      "shipment.delivered",
      "customer.created",
    ];

    const invalidEvents = events.filter((e) => !validEvents.includes(e));
    if (invalidEvents.length > 0) {
      throw new AppError(
        "INVALID_WEBHOOK_EVENTS",
        `Invalid events: ${invalidEvents.join(", ")}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const secret = createHmac("sha256", Date.now().toString())
      .update(tenantId)
      .digest("hex")
      .substring(0, 32);

    const config: WebhookConfig = {
      id: `wh_${Date.now()}`,
      tenantId,
      url,
      events,
      secret,
      isActive: true,
    };

    webhookConfigs.push(config);
    this.logger.info({ tenantId, url, events }, "Webhook registered");

    return config;
  }

  async listWebhooks(tenantId: string): Promise<WebhookConfig[]> {
    return webhookConfigs.filter((w) => w.tenantId === tenantId);
  }

  async deleteWebhook(tenantId: string, webhookId: string): Promise<void> {
    const index = webhookConfigs.findIndex(
      (w) => w.id === webhookId && w.tenantId === tenantId,
    );
    if (index === -1) {
      throw new AppError("WEBHOOK_NOT_FOUND", "Webhook not found", HttpStatus.NOT_FOUND);
    }
    webhookConfigs.splice(index, 1);
  }

  async dispatch(
    tenantId: string,
    event: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const matchingWebhooks = webhookConfigs.filter(
      (w) => w.tenantId === tenantId && w.isActive && w.events.includes(event),
    );

    for (const webhook of matchingWebhooks) {
      const signature = this.generateSignature(
        JSON.stringify(payload),
        webhook.secret,
      );

      const delivery: WebhookDelivery = {
        id: `del_${Date.now()}`,
        webhookId: webhook.id,
        event,
        payload,
        statusCode: null,
        response: null,
        attempts: 1,
        deliveredAt: null,
      };

      try {
        // In production: use fetch() with retry logic via BullMQ
        this.logger.info(
          {
            webhookId: webhook.id,
            url: webhook.url,
            event,
            signature,
          },
          "Webhook dispatched (mock)",
        );

        delivery.statusCode = 200;
        delivery.deliveredAt = new Date();
      } catch (error) {
        delivery.statusCode = 500;
        delivery.response = String(error);
        this.logger.error({ webhookId: webhook.id, error }, "Webhook delivery failed");
      }

      deliveryLog.push(delivery);
    }
  }

  async getDeliveryLog(
    tenantId: string,
    webhookId: string,
  ): Promise<WebhookDelivery[]> {
    const webhook = webhookConfigs.find(
      (w) => w.id === webhookId && w.tenantId === tenantId,
    );
    if (!webhook) {
      throw new AppError("WEBHOOK_NOT_FOUND", "Webhook not found", HttpStatus.NOT_FOUND);
    }
    return deliveryLog.filter((d) => d.webhookId === webhookId);
  }

  private generateSignature(payload: string, secret: string): string {
    return createHmac("sha256", secret).update(payload).digest("hex");
  }
}
