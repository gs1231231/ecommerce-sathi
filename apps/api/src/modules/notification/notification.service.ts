import { Injectable, Inject, HttpStatus } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import { DATABASE_TOKEN, DatabaseInstance } from "../database/database.module";
import { AppError } from "../../common/exceptions/app-error";

interface SendEmailResult {
  messageId: string;
  status: "sent";
}

interface SendSmsResult {
  messageId: string;
  status: "sent";
}

interface NotificationHistoryItem {
  id: string;
  tenantId: string;
  channel: "email" | "sms" | "whatsapp";
  to: string;
  subject?: string;
  status: "sent" | "delivered" | "failed";
  sentAt: string;
}

interface NotificationHistoryResponse {
  items: NotificationHistoryItem[];
  meta: { page: number; limit: number; total: number };
}

type TemplateName =
  | "order_confirmation"
  | "shipping_update"
  | "password_reset"
  | "welcome"
  | "abandoned_cart";

const VALID_TEMPLATES: TemplateName[] = [
  "order_confirmation",
  "shipping_update",
  "password_reset",
  "welcome",
  "abandoned_cart",
];

@Injectable()
export class NotificationService {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: DatabaseInstance,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext("NotificationService");
  }

  async sendEmail(
    to: string,
    subject: string,
    templateName: TemplateName,
    variables: Record<string, unknown>,
  ): Promise<SendEmailResult> {
    if (!VALID_TEMPLATES.includes(templateName)) {
      throw new AppError(
        "INVALID_TEMPLATE",
        `Template '${templateName}' is not valid. Valid templates: ${VALID_TEMPLATES.join(", ")}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const messageId = `email_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    this.logger.info(
      { to, subject, templateName, variables, messageId },
      "Email sent (mock)",
    );

    return { messageId, status: "sent" };
  }

  async sendSms(phone: string, message: string): Promise<SendSmsResult> {
    if (!phone || !message) {
      throw new AppError(
        "INVALID_SMS_PARAMS",
        "Phone number and message are required",
        HttpStatus.BAD_REQUEST,
      );
    }

    const messageId = `sms_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // In production: integrate with MSG91 API
    this.logger.info({ phone, messageLength: message.length, messageId }, "SMS sent via MSG91 (mock)");

    return { messageId, status: "sent" };
  }

  async sendOrderConfirmationEmail(order: {
    customerEmail: string;
    orderNumber: string;
    grandTotal: string;
    items: Array<{ title: string; quantity: number; price: string }>;
  }): Promise<SendEmailResult> {
    return this.sendEmail(
      order.customerEmail,
      `Order Confirmed - #${order.orderNumber}`,
      "order_confirmation",
      {
        orderNumber: order.orderNumber,
        grandTotal: order.grandTotal,
        items: order.items,
      },
    );
  }

  async sendShippingUpdateEmail(
    order: {
      customerEmail: string;
      orderNumber: string;
    },
    trackingUrl: string,
  ): Promise<SendEmailResult> {
    return this.sendEmail(
      order.customerEmail,
      `Your Order #${order.orderNumber} Has Been Shipped!`,
      "shipping_update",
      {
        orderNumber: order.orderNumber,
        trackingUrl,
      },
    );
  }

  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
    resetUrl: string,
  ): Promise<SendEmailResult> {
    return this.sendEmail(email, "Reset Your Password", "password_reset", {
      resetToken,
      resetUrl,
    });
  }

  async getNotificationHistory(
    tenantId: string,
    params: { page?: number; limit?: number; channel?: "email" | "sms" | "whatsapp" },
  ): Promise<NotificationHistoryResponse> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;

    this.logger.info({ tenantId, page, limit, channel: params.channel }, "Fetching notification history");

    // Mock notification history
    const mockItems: NotificationHistoryItem[] = [
      {
        id: "notif_001",
        tenantId,
        channel: "email",
        to: "customer@example.com",
        subject: "Order Confirmed - #ORD-1001",
        status: "delivered",
        sentAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: "notif_002",
        tenantId,
        channel: "sms",
        to: "+919876543210",
        status: "sent",
        sentAt: new Date(Date.now() - 43200000).toISOString(),
      },
      {
        id: "notif_003",
        tenantId,
        channel: "email",
        to: "user@example.com",
        subject: "Your Order Has Been Shipped!",
        status: "delivered",
        sentAt: new Date(Date.now() - 3600000).toISOString(),
      },
    ];

    const filtered = params.channel
      ? mockItems.filter((item) => item.channel === params.channel)
      : mockItems;

    return {
      items: filtered,
      meta: { page, limit, total: filtered.length },
    };
  }
}
