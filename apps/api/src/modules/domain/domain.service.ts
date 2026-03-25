import { Injectable, Inject, HttpStatus } from "@nestjs/common";
import { eq, and, sql } from "drizzle-orm";
import { PinoLogger } from "nestjs-pino";
import { tenants } from "@ecommerce-sathi/db";
import { AppError } from "../../common/exceptions/app-error";
import {
  DATABASE_TOKEN,
  DatabaseInstance,
} from "../database/database.module";

interface DomainConfig {
  slug: string;
  domain: string | null;
  customDomain: string | null;
}

interface DnsVerificationResult {
  verified: boolean;
  cname: string;
}

interface DnsInstruction {
  type: string;
  host: string;
  value: string;
  ttl: number;
  description: string;
}

@Injectable()
export class DomainService {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: DatabaseInstance,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext("DomainService");
  }

  async getDomainConfig(tenantId: string): Promise<DomainConfig> {
    const [tenant] = await this.db
      .select({
        slug: tenants.slug,
        domain: tenants.domain,
        customDomain: tenants.customDomain,
      })
      .from(tenants)
      .where(
        and(
          eq(tenants.id, tenantId),
          sql`${tenants.deletedAt} IS NULL`,
        ),
      )
      .limit(1);

    if (!tenant) {
      throw new AppError(
        "TENANT_NOT_FOUND",
        "Tenant not found",
        HttpStatus.NOT_FOUND,
      );
    }

    return tenant;
  }

  async checkDomainAvailability(
    domain: string,
  ): Promise<{ available: boolean; domain: string }> {
    const normalized = domain.toLowerCase().trim();

    const [existing] = await this.db
      .select({ id: tenants.id })
      .from(tenants)
      .where(
        and(
          eq(tenants.customDomain, normalized),
          sql`${tenants.deletedAt} IS NULL`,
        ),
      )
      .limit(1);

    return {
      available: !existing,
      domain: normalized,
    };
  }

  async setCustomDomain(
    tenantId: string,
    domain: string,
  ): Promise<DomainConfig> {
    const normalized = domain.toLowerCase().trim();

    // Validate domain format
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;
    if (!domainRegex.test(normalized)) {
      throw new AppError(
        "INVALID_DOMAIN_FORMAT",
        "Invalid domain format. Please provide a valid domain name (e.g., shop.example.com)",
        HttpStatus.BAD_REQUEST,
      );
    }

    // Check availability
    const { available } = await this.checkDomainAvailability(normalized);
    if (!available) {
      throw new AppError(
        "DOMAIN_ALREADY_TAKEN",
        "This domain is already in use by another tenant",
        HttpStatus.CONFLICT,
      );
    }

    // Verify tenant exists
    const [tenant] = await this.db
      .select({ id: tenants.id })
      .from(tenants)
      .where(
        and(
          eq(tenants.id, tenantId),
          sql`${tenants.deletedAt} IS NULL`,
        ),
      )
      .limit(1);

    if (!tenant) {
      throw new AppError(
        "TENANT_NOT_FOUND",
        "Tenant not found",
        HttpStatus.NOT_FOUND,
      );
    }

    await this.db
      .update(tenants)
      .set({ customDomain: normalized, updatedAt: new Date() })
      .where(eq(tenants.id, tenantId));

    this.logger.info(
      { tenantId, domain: normalized },
      "Custom domain set",
    );

    return this.getDomainConfig(tenantId);
  }

  async verifyDomain(
    tenantId: string,
  ): Promise<DnsVerificationResult> {
    // Verify tenant exists and has a custom domain
    const config = await this.getDomainConfig(tenantId);

    if (!config.customDomain) {
      throw new AppError(
        "NO_CUSTOM_DOMAIN",
        "No custom domain configured for this tenant",
        HttpStatus.BAD_REQUEST,
      );
    }

    // Mock DNS verification for MVP
    this.logger.info(
      { tenantId, domain: config.customDomain },
      "Domain verification requested",
    );

    return {
      verified: true,
      cname: "cname.ecommercesathi.com",
    };
  }

  async removeDomain(
    tenantId: string,
  ): Promise<{ removed: boolean }> {
    const [tenant] = await this.db
      .select({ id: tenants.id })
      .from(tenants)
      .where(
        and(
          eq(tenants.id, tenantId),
          sql`${tenants.deletedAt} IS NULL`,
        ),
      )
      .limit(1);

    if (!tenant) {
      throw new AppError(
        "TENANT_NOT_FOUND",
        "Tenant not found",
        HttpStatus.NOT_FOUND,
      );
    }

    await this.db
      .update(tenants)
      .set({ customDomain: null, updatedAt: new Date() })
      .where(eq(tenants.id, tenantId));

    this.logger.info(
      { tenantId },
      "Custom domain removed",
    );

    return { removed: true };
  }

  getDnsInstructions(domain: string): { domain: string; instructions: DnsInstruction[] } {
    return {
      domain,
      instructions: [
        {
          type: "CNAME",
          host: domain,
          value: "cname.ecommercesathi.com",
          ttl: 3600,
          description:
            "Add a CNAME record pointing your domain to cname.ecommercesathi.com",
        },
        {
          type: "TXT",
          host: `_verify.${domain}`,
          value: `ecommerce-sathi-verify=${domain}`,
          ttl: 3600,
          description:
            "Add a TXT record for domain ownership verification",
        },
      ],
    };
  }
}
