import { Injectable, HttpStatus } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import { AppError } from "../../common/exceptions/app-error";

interface Vendor {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone: string;
  commissionPercent: number;
  status: "pending" | "approved" | "suspended";
  totalSales: number;
  totalCommission: number;
  bankDetails: { accountNumber: string; ifsc: string; accountName: string } | null;
  createdAt: Date;
}

// In-memory store for MVP
const vendors: Vendor[] = [];

@Injectable()
export class MarketplaceService {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext("MarketplaceService");
  }

  async onboardVendor(
    tenantId: string,
    input: { name: string; email: string; phone: string; commissionPercent?: number },
  ): Promise<Vendor> {
    const vendor: Vendor = {
      id: `vendor_${Date.now()}`,
      tenantId,
      name: input.name,
      email: input.email,
      phone: input.phone,
      commissionPercent: input.commissionPercent ?? 10,
      status: "pending",
      totalSales: 0,
      totalCommission: 0,
      bankDetails: null,
      createdAt: new Date(),
    };
    vendors.push(vendor);
    return vendor;
  }

  async listVendors(tenantId: string): Promise<Vendor[]> {
    return vendors.filter((v) => v.tenantId === tenantId);
  }

  async approveVendor(tenantId: string, vendorId: string): Promise<Vendor> {
    const vendor = vendors.find((v) => v.id === vendorId && v.tenantId === tenantId);
    if (!vendor) throw new AppError("VENDOR_NOT_FOUND", "Vendor not found", HttpStatus.NOT_FOUND);
    vendor.status = "approved";
    return vendor;
  }

  async calculateCommission(
    orderAmount: number,
    vendorId: string,
  ): Promise<{ vendorAmount: number; platformCommission: number; commissionRate: number }> {
    const vendor = vendors.find((v) => v.id === vendorId);
    const rate = vendor?.commissionPercent ?? 10;
    const commission = (orderAmount * rate) / 100;
    return {
      vendorAmount: orderAmount - commission,
      platformCommission: commission,
      commissionRate: rate,
    };
  }

  async getPayoutSummary(tenantId: string, vendorId: string): Promise<Record<string, unknown>> {
    const vendor = vendors.find((v) => v.id === vendorId && v.tenantId === tenantId);
    if (!vendor) throw new AppError("VENDOR_NOT_FOUND", "Vendor not found", HttpStatus.NOT_FOUND);
    return {
      vendor: { id: vendor.id, name: vendor.name },
      totalSales: vendor.totalSales,
      totalCommission: vendor.totalCommission,
      pendingPayout: vendor.totalSales - vendor.totalCommission,
      lastPayoutDate: null,
    };
  }
}
