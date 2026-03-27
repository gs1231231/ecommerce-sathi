import { Injectable, Inject, HttpStatus } from "@nestjs/common";
import { eq, and, sql, desc } from "drizzle-orm";
import { PinoLogger } from "nestjs-pino";
import { products } from "@ecommerce-sathi/db";
import { AppError } from "../../common/exceptions/app-error";
import { DATABASE_TOKEN, DatabaseInstance } from "../database/database.module";

// ============================================
// Ad Campaign Types
// ============================================

interface AdAccount {
  id: string;
  tenantId: string;
  platform: "meta" | "google";
  accountId: string;
  accountName: string;
  accessToken: string;
  refreshToken?: string;
  status: "connected" | "disconnected" | "expired";
  connectedAt: Date;
}

interface AdCampaign {
  id: string;
  tenantId: string;
  platform: "meta" | "google";
  platformCampaignId?: string;
  name: string;
  objective: "traffic" | "conversions" | "catalog_sales" | "brand_awareness" | "reach" | "engagement";
  status: "draft" | "active" | "paused" | "completed" | "error";
  budget: number;
  budgetType: "daily" | "lifetime";
  startDate: string;
  endDate?: string;
  targeting: {
    ageMin?: number;
    ageMax?: number;
    gender?: "all" | "male" | "female";
    locations?: string[];
    interests?: string[];
    languages?: string[];
    customAudiences?: string[];
  };
  creativeConfig: {
    headline: string;
    description: string;
    ctaButton: string;
    imageUrl?: string;
    landingUrl: string;
    productIds?: string[];
  };
  metrics: {
    impressions: number;
    clicks: number;
    ctr: number;
    spend: number;
    conversions: number;
    costPerConversion: number;
    roas: number;
    reach: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface AdAudience {
  id: string;
  tenantId: string;
  platform: "meta" | "google";
  name: string;
  type: "custom" | "lookalike" | "interest" | "retargeting";
  size: number;
  source?: string;
  status: "ready" | "processing" | "error";
}

// In-memory stores for MVP
const adAccounts: AdAccount[] = [];
const campaigns: AdCampaign[] = [];
const audiences: AdAudience[] = [];

@Injectable()
export class AdsService {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: DatabaseInstance,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext("AdsService");
  }

  // ============================================
  // Account Connection
  // ============================================

  async connectAccount(
    tenantId: string,
    platform: "meta" | "google",
    credentials: { accountId: string; accountName: string; accessToken: string; refreshToken?: string },
  ): Promise<AdAccount> {
    // Check if already connected
    const existing = adAccounts.find(
      (a) => a.tenantId === tenantId && a.platform === platform,
    );
    if (existing) {
      existing.accessToken = credentials.accessToken;
      existing.refreshToken = credentials.refreshToken;
      existing.status = "connected";
      return existing;
    }

    const account: AdAccount = {
      id: `ad_acc_${Date.now()}`,
      tenantId,
      platform,
      accountId: credentials.accountId,
      accountName: credentials.accountName,
      accessToken: credentials.accessToken,
      refreshToken: credentials.refreshToken,
      status: "connected",
      connectedAt: new Date(),
    };
    adAccounts.push(account);

    this.logger.info({ tenantId, platform }, "Ad account connected");
    return account;
  }

  async getConnectedAccounts(tenantId: string): Promise<AdAccount[]> {
    return adAccounts
      .filter((a) => a.tenantId === tenantId)
      .map((a) => ({ ...a, accessToken: "***hidden***" }));
  }

  async disconnectAccount(tenantId: string, platform: "meta" | "google"): Promise<void> {
    const index = adAccounts.findIndex(
      (a) => a.tenantId === tenantId && a.platform === platform,
    );
    if (index !== -1) {
      adAccounts[index]!.status = "disconnected";
    }
  }

  // ============================================
  // Campaign Management
  // ============================================

  async createCampaign(
    tenantId: string,
    input: {
      platform: "meta" | "google";
      name: string;
      objective: AdCampaign["objective"];
      budget: number;
      budgetType: "daily" | "lifetime";
      startDate: string;
      endDate?: string;
      targeting: AdCampaign["targeting"];
      creativeConfig: AdCampaign["creativeConfig"];
    },
  ): Promise<AdCampaign> {
    const account = adAccounts.find(
      (a) => a.tenantId === tenantId && a.platform === input.platform && a.status === "connected",
    );
    if (!account) {
      throw new AppError(
        "AD_ACCOUNT_NOT_CONNECTED",
        `${input.platform} ad account is not connected`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const campaign: AdCampaign = {
      id: `camp_${Date.now()}`,
      tenantId,
      platform: input.platform,
      name: input.name,
      objective: input.objective,
      status: "draft",
      budget: input.budget,
      budgetType: input.budgetType,
      startDate: input.startDate,
      endDate: input.endDate,
      targeting: input.targeting,
      creativeConfig: input.creativeConfig,
      metrics: {
        impressions: 0,
        clicks: 0,
        ctr: 0,
        spend: 0,
        conversions: 0,
        costPerConversion: 0,
        roas: 0,
        reach: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // In production: call Meta Marketing API or Google Ads API to create campaign
    if (input.platform === "meta") {
      campaign.platformCampaignId = `meta_${Date.now()}`;
      this.logger.info({ campaignId: campaign.id }, "Meta campaign created (mock)");
    } else {
      campaign.platformCampaignId = `google_${Date.now()}`;
      this.logger.info({ campaignId: campaign.id }, "Google Ads campaign created (mock)");
    }

    campaigns.push(campaign);
    return campaign;
  }

  async listCampaigns(
    tenantId: string,
    filters?: { platform?: "meta" | "google"; status?: string },
  ): Promise<AdCampaign[]> {
    let result = campaigns.filter((c) => c.tenantId === tenantId);
    if (filters?.platform) {
      result = result.filter((c) => c.platform === filters.platform);
    }
    if (filters?.status) {
      result = result.filter((c) => c.status === filters.status);
    }
    return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getCampaign(tenantId: string, campaignId: string): Promise<AdCampaign> {
    const campaign = campaigns.find(
      (c) => c.id === campaignId && c.tenantId === tenantId,
    );
    if (!campaign) {
      throw new AppError("CAMPAIGN_NOT_FOUND", "Campaign not found", HttpStatus.NOT_FOUND);
    }

    // In production: sync metrics from platform API
    // Mock: generate random metrics for active campaigns
    if (campaign.status === "active") {
      const days = Math.max(1, Math.floor((Date.now() - campaign.createdAt.getTime()) / 86400000));
      campaign.metrics = {
        impressions: Math.floor(Math.random() * 10000 * days),
        clicks: Math.floor(Math.random() * 500 * days),
        ctr: parseFloat((Math.random() * 5 + 0.5).toFixed(2)),
        spend: parseFloat((Math.random() * campaign.budget * 0.8).toFixed(2)),
        conversions: Math.floor(Math.random() * 50 * days),
        costPerConversion: parseFloat((Math.random() * 200 + 20).toFixed(2)),
        roas: parseFloat((Math.random() * 5 + 1).toFixed(2)),
        reach: Math.floor(Math.random() * 8000 * days),
      };
    }

    return campaign;
  }

  async updateCampaignStatus(
    tenantId: string,
    campaignId: string,
    status: "active" | "paused",
  ): Promise<AdCampaign> {
    const campaign = await this.getCampaign(tenantId, campaignId);

    // In production: call platform API to update status
    campaign.status = status;
    campaign.updatedAt = new Date();

    this.logger.info(
      { campaignId, status, platform: campaign.platform },
      "Campaign status updated",
    );

    return campaign;
  }

  async deleteCampaign(tenantId: string, campaignId: string): Promise<void> {
    const index = campaigns.findIndex(
      (c) => c.id === campaignId && c.tenantId === tenantId,
    );
    if (index === -1) {
      throw new AppError("CAMPAIGN_NOT_FOUND", "Campaign not found", HttpStatus.NOT_FOUND);
    }
    campaigns.splice(index, 1);
  }

  // ============================================
  // Audiences
  // ============================================

  async createAudience(
    tenantId: string,
    input: {
      platform: "meta" | "google";
      name: string;
      type: AdAudience["type"];
      source?: string;
    },
  ): Promise<AdAudience> {
    const audience: AdAudience = {
      id: `aud_${Date.now()}`,
      tenantId,
      platform: input.platform,
      name: input.name,
      type: input.type,
      size: 0,
      source: input.source,
      status: "processing",
    };

    // In production: create custom audience via platform API
    // For retargeting: use pixel/tag data
    // For lookalike: based on existing customer list

    if (input.type === "retargeting") {
      audience.size = Math.floor(Math.random() * 5000 + 500);
      audience.status = "ready";
    } else if (input.type === "lookalike") {
      audience.size = Math.floor(Math.random() * 50000 + 10000);
      audience.status = "ready";
    } else if (input.type === "custom") {
      audience.size = Math.floor(Math.random() * 2000 + 100);
      audience.status = "ready";
    }

    audiences.push(audience);
    return audience;
  }

  async listAudiences(tenantId: string): Promise<AdAudience[]> {
    return audiences.filter((a) => a.tenantId === tenantId);
  }

  // ============================================
  // Product Catalog Sync (for Dynamic Ads)
  // ============================================

  async syncProductCatalog(
    tenantId: string,
    platform: "meta" | "google",
  ): Promise<{ synced: number; errors: number }> {
    const allProducts = await this.db
      .select()
      .from(products)
      .where(
        and(
          eq(products.tenantId, tenantId),
          eq(products.status, "active"),
          sql`${products.deletedAt} IS NULL`,
        ),
      );

    // In production: push products to Meta Product Catalog or Google Merchant Center
    this.logger.info(
      { tenantId, platform, productCount: allProducts.length },
      "Product catalog synced (mock)",
    );

    return { synced: allProducts.length, errors: 0 };
  }

  // ============================================
  // Pixel / Tag Management
  // ============================================

  async getPixelCode(
    tenantId: string,
    platform: "meta" | "google",
  ): Promise<{ pixelId: string; code: string }> {
    const account = adAccounts.find(
      (a) => a.tenantId === tenantId && a.platform === platform,
    );

    if (platform === "meta") {
      const pixelId = account?.accountId ?? "XXXXXXXXXX";
      return {
        pixelId,
        code: `<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId}');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1"/></noscript>
<!-- End Meta Pixel Code -->`,
      };
    } else {
      const tagId = account?.accountId ?? "G-XXXXXXXXXX";
      return {
        pixelId: tagId,
        code: `<!-- Google Tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${tagId}"></script>
<script>
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${tagId}');
</script>
<!-- End Google Tag -->`,
      };
    }
  }

  // ============================================
  // Performance Dashboard
  // ============================================

  async getAdsDashboard(
    tenantId: string,
  ): Promise<Record<string, unknown>> {
    const allCampaigns = campaigns.filter((c) => c.tenantId === tenantId);
    const activeCampaigns = allCampaigns.filter((c) => c.status === "active");

    const totalSpend = allCampaigns.reduce((sum, c) => sum + c.metrics.spend, 0);
    const totalConversions = allCampaigns.reduce((sum, c) => sum + c.metrics.conversions, 0);
    const totalClicks = allCampaigns.reduce((sum, c) => sum + c.metrics.clicks, 0);
    const totalImpressions = allCampaigns.reduce((sum, c) => sum + c.metrics.impressions, 0);

    return {
      summary: {
        totalCampaigns: allCampaigns.length,
        activeCampaigns: activeCampaigns.length,
        totalSpend: parseFloat(totalSpend.toFixed(2)),
        totalConversions,
        totalClicks,
        totalImpressions,
        avgCtr: totalImpressions > 0 ? parseFloat(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0,
        avgRoas: allCampaigns.length > 0
          ? parseFloat((allCampaigns.reduce((sum, c) => sum + c.metrics.roas, 0) / allCampaigns.length).toFixed(2))
          : 0,
      },
      byPlatform: {
        meta: {
          campaigns: allCampaigns.filter((c) => c.platform === "meta").length,
          spend: parseFloat(allCampaigns.filter((c) => c.platform === "meta").reduce((s, c) => s + c.metrics.spend, 0).toFixed(2)),
        },
        google: {
          campaigns: allCampaigns.filter((c) => c.platform === "google").length,
          spend: parseFloat(allCampaigns.filter((c) => c.platform === "google").reduce((s, c) => s + c.metrics.spend, 0).toFixed(2)),
        },
      },
      connectedAccounts: adAccounts.filter((a) => a.tenantId === tenantId && a.status === "connected").length,
    };
  }
}
