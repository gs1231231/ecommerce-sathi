import { Injectable, HttpStatus } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import { AppError } from "../../common/exceptions/app-error";

interface BulkPriceTier {
  minQuantity: number;
  discountPercent: number;
}

interface WholesaleCustomer {
  id: string;
  tenantId: string;
  companyName: string;
  gstin: string;
  contactName: string;
  email: string;
  phone: string;
  creditLimit: number;
  creditUsed: number;
  paymentTermsDays: number;
  status: "pending" | "approved" | "suspended";
  moq: number;
}

const wholesaleCustomers: WholesaleCustomer[] = [];
const bulkPricingRules: Map<string, BulkPriceTier[]> = new Map();

@Injectable()
export class B2bService {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext("B2bService");
  }

  async registerWholesaler(
    tenantId: string,
    input: {
      companyName: string;
      gstin: string;
      contactName: string;
      email: string;
      phone: string;
      creditLimit?: number;
      paymentTermsDays?: number;
    },
  ): Promise<WholesaleCustomer> {
    if (!/^\d{2}[A-Z]{5}\d{4}[A-Z]\d[Z][A-Z\d]$/.test(input.gstin)) {
      throw new AppError("INVALID_GSTIN", "Invalid GSTIN format", HttpStatus.BAD_REQUEST);
    }

    const customer: WholesaleCustomer = {
      id: `b2b_${Date.now()}`,
      tenantId,
      companyName: input.companyName,
      gstin: input.gstin,
      contactName: input.contactName,
      email: input.email,
      phone: input.phone,
      creditLimit: input.creditLimit ?? 100000,
      creditUsed: 0,
      paymentTermsDays: input.paymentTermsDays ?? 30,
      status: "pending",
      moq: 10,
    };
    wholesaleCustomers.push(customer);
    return customer;
  }

  async listWholesalers(tenantId: string): Promise<WholesaleCustomer[]> {
    return wholesaleCustomers.filter((c) => c.tenantId === tenantId);
  }

  async setBulkPricing(
    tenantId: string,
    productId: string,
    tiers: BulkPriceTier[],
  ): Promise<{ productId: string; tiers: BulkPriceTier[] }> {
    const key = `${tenantId}:${productId}`;
    bulkPricingRules.set(key, tiers.sort((a, b) => a.minQuantity - b.minQuantity));
    return { productId, tiers };
  }

  async calculateBulkPrice(
    tenantId: string,
    productId: string,
    unitPrice: number,
    quantity: number,
  ): Promise<{ unitPrice: number; bulkPrice: number; discount: number; tier: string }> {
    const key = `${tenantId}:${productId}`;
    const tiers = bulkPricingRules.get(key) ?? [
      { minQuantity: 10, discountPercent: 5 },
      { minQuantity: 50, discountPercent: 10 },
      { minQuantity: 100, discountPercent: 15 },
    ];

    let applicableTier = { minQuantity: 0, discountPercent: 0 };
    for (const tier of tiers) {
      if (quantity >= tier.minQuantity) applicableTier = tier;
    }

    const discount = (unitPrice * applicableTier.discountPercent) / 100;
    return {
      unitPrice,
      bulkPrice: unitPrice - discount,
      discount: applicableTier.discountPercent,
      tier: `${applicableTier.minQuantity}+ units`,
    };
  }

  async checkCreditAvailability(
    tenantId: string,
    customerId: string,
    amount: number,
  ): Promise<{ available: boolean; limit: number; used: number; remaining: number }> {
    const customer = wholesaleCustomers.find(
      (c) => c.id === customerId && c.tenantId === tenantId,
    );
    if (!customer) throw new AppError("CUSTOMER_NOT_FOUND", "Wholesale customer not found", HttpStatus.NOT_FOUND);

    const remaining = customer.creditLimit - customer.creditUsed;
    return {
      available: remaining >= amount,
      limit: customer.creditLimit,
      used: customer.creditUsed,
      remaining,
    };
  }
}
