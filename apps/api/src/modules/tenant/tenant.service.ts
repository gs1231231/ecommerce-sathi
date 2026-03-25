import { Injectable, Inject, HttpStatus } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { PinoLogger } from "nestjs-pino";
import { tenants } from "@ecommerce-sathi/db";
import { AppError } from "../../common/exceptions/app-error";
import { DATABASE_TOKEN, DatabaseInstance } from "../database/database.module";

@Injectable()
export class TenantService {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: DatabaseInstance,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext("TenantService");
  }

  async findBySlug(slug: string): Promise<Record<string, unknown>> {
    const [tenant] = await this.db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, slug))
      .limit(1);

    if (!tenant) {
      throw new AppError("TENANT_NOT_FOUND", "Store not found", HttpStatus.NOT_FOUND);
    }

    return tenant;
  }

  async findByDomain(domain: string): Promise<Record<string, unknown>> {
    const [tenant] = await this.db
      .select()
      .from(tenants)
      .where(eq(tenants.domain, domain))
      .limit(1);

    if (!tenant) {
      // Try custom domain
      const [tenantByCustomDomain] = await this.db
        .select()
        .from(tenants)
        .where(eq(tenants.customDomain, domain))
        .limit(1);

      if (!tenantByCustomDomain) {
        throw new AppError("TENANT_NOT_FOUND", "Store not found", HttpStatus.NOT_FOUND);
      }
      return tenantByCustomDomain;
    }

    return tenant;
  }

  async findById(id: string): Promise<Record<string, unknown>> {
    const [tenant] = await this.db
      .select()
      .from(tenants)
      .where(eq(tenants.id, id))
      .limit(1);

    if (!tenant) {
      throw new AppError("TENANT_NOT_FOUND", "Store not found", HttpStatus.NOT_FOUND);
    }

    return tenant;
  }

  async update(
    tenantId: string,
    data: {
      name?: string;
      logoUrl?: string;
      settings?: Record<string, unknown>;
      customDomain?: string;
    },
  ): Promise<Record<string, unknown>> {
    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl;
    if (data.settings !== undefined) updateData.settings = data.settings;
    if (data.customDomain !== undefined) updateData.customDomain = data.customDomain;

    const [updated] = await this.db
      .update(tenants)
      .set(updateData)
      .where(eq(tenants.id, tenantId))
      .returning();

    if (!updated) {
      throw new AppError("TENANT_NOT_FOUND", "Store not found", HttpStatus.NOT_FOUND);
    }

    return updated;
  }
}
