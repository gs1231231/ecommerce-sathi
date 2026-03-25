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
import { SubscriptionService } from "./subscription.service";
import { CurrentTenant } from "../../common/decorators/current-tenant.decorator";

@ApiTags("Subscriptions")
@ApiBearerAuth()
@Controller("subscriptions")
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post("plans")
  @ApiOperation({ summary: "Create a subscription plan" })
  async createPlan(
    @CurrentTenant() tenantId: string,
    @Body()
    body: {
      name: string;
      price: number;
      interval: "monthly" | "quarterly" | "yearly";
      intervalCount: number;
      features: string[];
    },
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.subscriptionService.createPlan(tenantId, body);
    return { success: true, data: result };
  }

  @Get("plans")
  @ApiOperation({ summary: "List subscription plans" })
  async listPlans(
    @CurrentTenant() tenantId: string,
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.subscriptionService.listPlans(tenantId);
    return { success: true, data: result };
  }

  @Post("subscribe")
  @ApiOperation({ summary: "Subscribe a customer to a plan" })
  async subscribe(
    @CurrentTenant() tenantId: string,
    @Body() body: { customerId: string; planId: string },
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.subscriptionService.subscribe(
      tenantId,
      body.customerId,
      body.planId,
    );
    return { success: true, data: result };
  }

  @Get(":id")
  @ApiOperation({ summary: "Get subscription by ID" })
  async getSubscription(
    @CurrentTenant() tenantId: string,
    @Param("id") id: string,
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.subscriptionService.getSubscription(tenantId, id);
    return { success: true, data: result };
  }

  @Post(":id/cancel")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Cancel a subscription" })
  async cancelSubscription(
    @CurrentTenant() tenantId: string,
    @Param("id") id: string,
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.subscriptionService.cancelSubscription(
      tenantId,
      id,
    );
    return { success: true, data: result };
  }

  @Post("process-renewals")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Trigger renewal processing for a subscription" })
  async processRenewals(
    @Body() body: { subscriptionId: string },
  ): Promise<{ success: boolean; data: unknown }> {
    const result = await this.subscriptionService.processRenewal(
      body.subscriptionId,
    );
    return { success: true, data: result };
  }
}
