import { Injectable, Inject, HttpStatus } from "@nestjs/common";
import { eq, and, sql } from "drizzle-orm";
import { PinoLogger } from "nestjs-pino";
import {
  DATABASE_TOKEN,
  DatabaseInstance,
} from "../database/database.module";
import { AppError } from "../../common/exceptions/app-error";

interface CreateDigitalAssetInput {
  fileName: string;
  fileSize: number;
  fileType: string;
  downloadLimit: number;
  expiryDays: number;
}

interface DigitalAsset {
  id: string;
  tenantId: string;
  productId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  downloadLimit: number;
  expiryDays: number;
  createdAt: Date;
}

interface DownloadLink {
  token: string;
  url: string;
  expiresAt: Date;
  assetId: string;
  orderId: string;
}

interface DownloadRecord {
  id: string;
  assetId: string;
  token: string;
  downloadedAt: Date;
  ipAddress: string;
}

// MVP: In-memory storage
const digitalAssets: DigitalAsset[] = [];
const downloadLinks: DownloadLink[] = [];
const downloadHistory: DownloadRecord[] = [];

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
}

function generateToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

@Injectable()
export class DigitalProductService {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: DatabaseInstance,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext("DigitalProductService");
  }

  async createDigitalAsset(
    tenantId: string,
    productId: string,
    input: CreateDigitalAssetInput,
  ): Promise<DigitalAsset> {
    const asset: DigitalAsset = {
      id: generateId(),
      tenantId,
      productId,
      fileName: input.fileName,
      fileSize: input.fileSize,
      fileType: input.fileType,
      downloadLimit: input.downloadLimit,
      expiryDays: input.expiryDays,
      createdAt: new Date(),
    };

    digitalAssets.push(asset);

    this.logger.info(
      { tenantId, assetId: asset.id, productId },
      "Digital asset created",
    );

    return asset;
  }

  async generateDownloadLink(
    tenantId: string,
    orderId: string,
    assetId: string,
  ): Promise<{ url: string; token: string; expiresAt: Date }> {
    const asset = digitalAssets.find(
      (a) => a.id === assetId && a.tenantId === tenantId,
    );

    if (!asset) {
      throw new AppError(
        "DIGITAL_ASSET_NOT_FOUND",
        "Digital asset not found",
        HttpStatus.NOT_FOUND,
      );
    }

    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + asset.expiryDays);

    const link: DownloadLink = {
      token,
      url: `/api/digital-products/download/${token}`,
      expiresAt,
      assetId,
      orderId,
    };

    downloadLinks.push(link);

    this.logger.info(
      { tenantId, assetId, orderId, token },
      "Download link generated",
    );

    return { url: link.url, token, expiresAt };
  }

  async validateDownload(token: string): Promise<{
    valid: boolean;
    asset?: DigitalAsset;
    reason?: string;
  }> {
    const link = downloadLinks.find((l) => l.token === token);

    if (!link) {
      return { valid: false, reason: "Invalid download token" };
    }

    // Check expiry
    if (new Date() > link.expiresAt) {
      return { valid: false, reason: "Download link has expired" };
    }

    const asset = digitalAssets.find((a) => a.id === link.assetId);
    if (!asset) {
      return { valid: false, reason: "Digital asset not found" };
    }

    // Check download count
    const downloadCount = downloadHistory.filter(
      (d) => d.token === token,
    ).length;

    if (downloadCount >= asset.downloadLimit) {
      return { valid: false, reason: "Download limit exceeded" };
    }

    // Record download
    const record: DownloadRecord = {
      id: generateId(),
      assetId: asset.id,
      token,
      downloadedAt: new Date(),
      ipAddress: "0.0.0.0",
    };

    downloadHistory.push(record);

    this.logger.info(
      { assetId: asset.id, token, downloadCount: downloadCount + 1 },
      "Download validated",
    );

    return { valid: true, asset };
  }

  async getDownloadHistory(
    tenantId: string,
    assetId: string,
  ): Promise<DownloadRecord[]> {
    const asset = digitalAssets.find(
      (a) => a.id === assetId && a.tenantId === tenantId,
    );

    if (!asset) {
      throw new AppError(
        "DIGITAL_ASSET_NOT_FOUND",
        "Digital asset not found",
        HttpStatus.NOT_FOUND,
      );
    }

    return downloadHistory.filter((d) => d.assetId === assetId);
  }

  generateLicenseKey(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const segments: string[] = [];

    for (let s = 0; s < 4; s++) {
      let segment = "";
      for (let i = 0; i < 4; i++) {
        segment += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      segments.push(segment);
    }

    return segments.join("-");
  }
}
