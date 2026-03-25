import { Injectable, Inject, HttpStatus } from "@nestjs/common";
import { eq, and, sql } from "drizzle-orm";
import { PinoLogger } from "nestjs-pino";
import {
  DATABASE_TOKEN,
  DatabaseInstance,
} from "../database/database.module";
import { AppError } from "../../common/exceptions/app-error";

interface CreatePlanInput {
  name: string;
  price: number;
  interval: "monthly" | "quarterly" | "yearly";
  intervalCount: number;
  features: string[];
}

interface SubscriptionPlan {
  id: string;
  tenantId: string;
  name: string;
  price: number;
  interval: string;
  intervalCount: number;
  features: string[];
  createdAt: Date;
}

interface Subscription {
  id: string;
  tenantId: string;
  customerId: string;
  planId: string;
  status: "active" | "cancelled" | "expired" | "past_due";
  nextBillingDate: Date;
  plan: SubscriptionPlan;
  createdAt: Date;
  cancelledAt?: Date;
}

// MVP: In-memory storage
const plans: SubscriptionPlan[] = [];
const subscriptions: Subscription[] = [];

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
}

@Injectable()
export class SubscriptionService {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: DatabaseInstance,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext("SubscriptionService");
  }

  async createPlan(
    tenantId: string,
    input: CreatePlanInput,
  ): Promise<SubscriptionPlan> {
    const plan: SubscriptionPlan = {
      id: generateId(),
      tenantId,
      name: input.name,
      price: input.price,
      interval: input.interval,
      intervalCount: input.intervalCount,
      features: input.features,
      createdAt: new Date(),
    };

    plans.push(plan);

    this.logger.info(
      { tenantId, planId: plan.id },
      "Subscription plan created",
    );

    return plan;
  }

  async listPlans(tenantId: string): Promise<SubscriptionPlan[]> {
    return plans.filter((p) => p.tenantId === tenantId);
  }

  async subscribe(
    tenantId: string,
    customerId: string,
    planId: string,
  ): Promise<{ subscriptionId: string; status: string; nextBillingDate: Date; plan: SubscriptionPlan }> {
    const plan = plans.find((p) => p.id === planId && p.tenantId === tenantId);
    if (!plan) {
      throw new AppError(
        "PLAN_NOT_FOUND",
        "Subscription plan not found",
        HttpStatus.NOT_FOUND,
      );
    }

    const nextBillingDate = new Date();
    if (plan.interval === "monthly") {
      nextBillingDate.setMonth(nextBillingDate.getMonth() + plan.intervalCount);
    } else if (plan.interval === "quarterly") {
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 3 * plan.intervalCount);
    } else if (plan.interval === "yearly") {
      nextBillingDate.setFullYear(nextBillingDate.getFullYear() + plan.intervalCount);
    }

    const subscription: Subscription = {
      id: generateId(),
      tenantId,
      customerId,
      planId,
      status: "active",
      nextBillingDate,
      plan,
      createdAt: new Date(),
    };

    subscriptions.push(subscription);

    this.logger.info(
      { tenantId, subscriptionId: subscription.id, customerId, planId },
      "Customer subscribed",
    );

    return {
      subscriptionId: subscription.id,
      status: subscription.status,
      nextBillingDate: subscription.nextBillingDate,
      plan,
    };
  }

  async cancelSubscription(
    tenantId: string,
    subscriptionId: string,
  ): Promise<Subscription> {
    const subscription = subscriptions.find(
      (s) => s.id === subscriptionId && s.tenantId === tenantId,
    );

    if (!subscription) {
      throw new AppError(
        "SUBSCRIPTION_NOT_FOUND",
        "Subscription not found",
        HttpStatus.NOT_FOUND,
      );
    }

    if (subscription.status === "cancelled") {
      throw new AppError(
        "SUBSCRIPTION_ALREADY_CANCELLED",
        "Subscription is already cancelled",
        HttpStatus.CONFLICT,
      );
    }

    subscription.status = "cancelled";
    subscription.cancelledAt = new Date();

    this.logger.info(
      { tenantId, subscriptionId },
      "Subscription cancelled",
    );

    return subscription;
  }

  async getSubscription(
    tenantId: string,
    subscriptionId: string,
  ): Promise<Subscription> {
    const subscription = subscriptions.find(
      (s) => s.id === subscriptionId && s.tenantId === tenantId,
    );

    if (!subscription) {
      throw new AppError(
        "SUBSCRIPTION_NOT_FOUND",
        "Subscription not found",
        HttpStatus.NOT_FOUND,
      );
    }

    return subscription;
  }

  async processRenewal(subscriptionId: string): Promise<{ renewed: boolean; subscriptionId: string; nextBillingDate?: Date }> {
    const subscription = subscriptions.find((s) => s.id === subscriptionId);

    if (!subscription) {
      throw new AppError(
        "SUBSCRIPTION_NOT_FOUND",
        "Subscription not found",
        HttpStatus.NOT_FOUND,
      );
    }

    if (subscription.status !== "active") {
      return { renewed: false, subscriptionId };
    }

    // Mock renewal: extend billing date
    const plan = subscription.plan;
    const nextBillingDate = new Date(subscription.nextBillingDate);
    if (plan.interval === "monthly") {
      nextBillingDate.setMonth(nextBillingDate.getMonth() + plan.intervalCount);
    } else if (plan.interval === "quarterly") {
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 3 * plan.intervalCount);
    } else if (plan.interval === "yearly") {
      nextBillingDate.setFullYear(nextBillingDate.getFullYear() + plan.intervalCount);
    }

    subscription.nextBillingDate = nextBillingDate;

    this.logger.info(
      { subscriptionId, nextBillingDate },
      "Subscription renewed (mock)",
    );

    return { renewed: true, subscriptionId, nextBillingDate };
  }
}
