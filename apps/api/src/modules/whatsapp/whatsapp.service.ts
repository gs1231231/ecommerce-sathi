import { Injectable, Inject, HttpStatus } from "@nestjs/common";
import { eq, and } from "drizzle-orm";
import { createHmac } from "crypto";
import { PinoLogger } from "nestjs-pino";
import { AppError } from "../../common/exceptions/app-error";
import { DATABASE_TOKEN, DatabaseInstance } from "../database/database.module";

type TemplateName =
  | "order_confirmation"
  | "shipping_update"
  | "delivery_update"
  | "cod_verification"
  | "abandoned_cart";

interface TemplateParams {
  [key: string]: string;
}

interface SendTemplateResult {
  messageId: string;
  status: "sent" | "queued";
  template: TemplateName;
  phone: string;
}

interface OrderInfo {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  currency: string;
  items: Array<{ name: string; quantity: number }>;
}

interface IncomingMessageResult {
  intent: "product_search" | "order_status" | "help";
  reply: string;
  data?: Record<string, unknown>;
}

@Injectable()
export class WhatsAppService {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: DatabaseInstance,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext("WhatsAppService");
  }

  async sendTemplate(
    tenantId: string,
    phone: string,
    templateName: TemplateName,
    params: TemplateParams,
  ): Promise<SendTemplateResult> {
    // Validate phone format (Indian mobile with country code)
    const cleanPhone = phone.replace(/[+\s-]/g, "");
    const phoneRegex = /^(91)?[6-9]\d{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      throw new AppError(
        "INVALID_PHONE",
        "Invalid Indian mobile number for WhatsApp",
        HttpStatus.BAD_REQUEST,
      );
    }

    const validTemplates: TemplateName[] = [
      "order_confirmation",
      "shipping_update",
      "delivery_update",
      "cod_verification",
      "abandoned_cart",
    ];

    if (!validTemplates.includes(templateName)) {
      throw new AppError(
        "INVALID_TEMPLATE",
        `Template "${templateName}" is not a valid WhatsApp template`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Mock WhatsApp Cloud API call
    // In production: POST https://graph.facebook.com/v18.0/{phone_number_id}/messages
    const messageId = `wamid.${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    this.logger.info(
      {
        tenantId,
        phone: cleanPhone,
        templateName,
        messageId,
        params,
      },
      "WhatsApp template message sent (mock)",
    );

    return {
      messageId,
      status: "sent",
      template: templateName,
      phone: cleanPhone,
    };
  }

  async sendOrderConfirmation(
    tenantId: string,
    order: OrderInfo,
  ): Promise<SendTemplateResult> {
    const itemsSummary = order.items
      .map((item) => `${item.name} x${item.quantity}`)
      .join(", ");

    return this.sendTemplate(tenantId, order.customerPhone, "order_confirmation", {
      customer_name: order.customerName,
      order_number: order.orderNumber,
      total_amount: `${order.currency} ${order.totalAmount.toFixed(2)}`,
      items_summary: itemsSummary,
    });
  }

  async sendShippingUpdate(
    tenantId: string,
    order: OrderInfo,
    awbNumber: string,
    trackingUrl: string,
  ): Promise<SendTemplateResult> {
    return this.sendTemplate(tenantId, order.customerPhone, "shipping_update", {
      customer_name: order.customerName,
      order_number: order.orderNumber,
      awb_number: awbNumber,
      tracking_url: trackingUrl,
    });
  }

  handleIncomingMessage(
    tenantId: string,
    from: string,
    messageBody: string,
  ): IncomingMessageResult {
    const normalizedBody = messageBody.trim().toLowerCase();

    // Intent: Product search - "show me [product]"
    const showMeMatch = normalizedBody.match(/^show\s+me\s+(.+)$/);
    if (showMeMatch) {
      const searchQuery = showMeMatch[1].trim();
      this.logger.info(
        { tenantId, from, searchQuery },
        "WhatsApp product search intent detected",
      );
      return {
        intent: "product_search",
        reply: `Searching for "${searchQuery}"... Here are the results we found for you. Reply with a product number to add it to your cart.`,
        data: { searchQuery },
      };
    }

    // Intent: Order status - "order status [number]"
    const orderStatusMatch = normalizedBody.match(
      /^order\s+status\s+(.+)$/,
    );
    if (orderStatusMatch) {
      const orderNumber = orderStatusMatch[1].trim().toUpperCase();
      this.logger.info(
        { tenantId, from, orderNumber },
        "WhatsApp order status intent detected",
      );
      return {
        intent: "order_status",
        reply: `Looking up order ${orderNumber}... We'll share your order details shortly.`,
        data: { orderNumber },
      };
    }

    // Default: Help text
    this.logger.info(
      { tenantId, from, messageBody },
      "WhatsApp message did not match any intent, returning help",
    );
    return {
      intent: "help",
      reply: [
        "Welcome! Here's what I can help you with:",
        "",
        '- Type "show me <product>" to search products',
        '- Type "order status <order number>" to track your order',
        "",
        "How can I help you today?",
      ].join("\n"),
    };
  }

  verifyWebhookSignature(
    signature: string,
    payload: string,
    secret: string,
  ): boolean {
    // HMAC SHA256 verification for WhatsApp webhook payloads
    const expectedSignature = createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    const prefixedExpected = `sha256=${expectedSignature}`;

    const isValid = signature === prefixedExpected;

    this.logger.info(
      { isValid, signatureProvided: !!signature },
      "WhatsApp webhook signature verification",
    );

    return isValid;
  }
}
