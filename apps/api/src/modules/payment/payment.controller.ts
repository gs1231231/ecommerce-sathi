import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { PaymentService } from "./payment.service";
import { CurrentTenant } from "../../common/decorators/current-tenant.decorator";
import { Public } from "../../common/decorators/public.decorator";

@ApiTags("Payments")
@Controller("payments")
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post("create-order")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a payment order for checkout" })
  async createOrder(
    @CurrentTenant() tenantId: string,
    @Body() body: { orderId: string; gateway: string; method?: string },
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.paymentService.createPaymentOrder(
      tenantId,
      body.orderId,
      body.gateway,
      body.method,
    );
    return { success: true, data: result };
  }

  @Post("verify")
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Verify payment after completion" })
  async verify(
    @CurrentTenant() tenantId: string,
    @Body()
    body: {
      gatewayOrderId: string;
      paymentId: string;
      signature: string;
      gateway: string;
    },
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.paymentService.verifyPayment(
      tenantId,
      body.gatewayOrderId,
      body.paymentId,
      body.signature,
      body.gateway,
    );
    return { success: true, data: result };
  }

  @Post("webhook/:gateway")
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Gateway webhook handler" })
  async webhook(
    @Param("gateway") _gateway: string,
    @Body() _body: Record<string, unknown>,
  ): Promise<{ success: boolean }> {
    // Webhook processing will verify signatures and update payment status
    // Implementation depends on specific gateway
    return { success: true };
  }

  @Post(":id/refund")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Initiate a refund" })
  async refund(
    @CurrentTenant() tenantId: string,
    @Param("id") id: string,
    @Body() body: { amount: number; reason: string },
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.paymentService.refund(
      tenantId,
      id,
      body.amount,
      body.reason,
    );
    return { success: true, data: result };
  }
}
