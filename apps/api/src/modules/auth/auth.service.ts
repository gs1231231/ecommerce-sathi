import { Injectable, Inject, HttpStatus } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { eq, and } from "drizzle-orm";
import { createHash } from "crypto";
import { PinoLogger } from "nestjs-pino";
import { tenants, users, sessions } from "@ecommerce-sathi/db";
import { AppError } from "../../common/exceptions/app-error";
import {
  DATABASE_TOKEN,
  DatabaseInstance,
} from "../database/database.module";

interface JwtPayload {
  userId: string;
  tenantId: string;
  role: string;
  email: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface AuthResult {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
  tokens: TokenPair;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: DatabaseInstance,
    private readonly jwtService: JwtService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext("AuthService");
  }

  async register(input: {
    name: string;
    email: string;
    password: string;
    phone: string;
    storeName: string;
    storeSlug: string;
  }): Promise<AuthResult> {
    // Check slug uniqueness
    const existingTenant = await this.db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, input.storeSlug))
      .limit(1);

    if (existingTenant.length > 0) {
      throw new AppError(
        "SLUG_ALREADY_EXISTS",
        `Store slug '${input.storeSlug}' is already taken`,
        HttpStatus.CONFLICT,
      );
    }

    const passwordHash = await argon2.hash(input.password);

    // Create tenant + user in transaction
    const result = await this.db.transaction(async (tx: DatabaseInstance) => {
      const [tenant] = await tx
        .insert(tenants)
        .values({
          name: input.storeName,
          slug: input.storeSlug,
          plan: "starter",
          status: "active",
        })
        .returning();

      if (!tenant) {
        throw new AppError(
          "TENANT_CREATE_FAILED",
          "Failed to create store",
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const [user] = await tx
        .insert(users)
        .values({
          tenantId: tenant.id,
          email: input.email,
          passwordHash,
          name: input.name,
          phone: input.phone,
          role: "owner",
          authProvider: "email",
        })
        .returning();

      if (!user) {
        throw new AppError(
          "USER_CREATE_FAILED",
          "Failed to create user",
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // Set owner on tenant
      await tx
        .update(tenants)
        .set({ ownerId: user.id })
        .where(eq(tenants.id, tenant.id));

      return { tenant, user };
    });

    const tokens = await this.generateTokens(
      {
        userId: result.user.id,
        tenantId: result.tenant.id,
        role: result.user.role,
        email: result.user.email,
      },
      result.user.id,
      result.tenant.id,
    );

    this.logger.info(
      { tenantId: result.tenant.id, userId: result.user.id },
      "New tenant registered",
    );

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
      },
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        slug: result.tenant.slug,
      },
      tokens,
    };
  }

  async login(input: {
    email: string;
    password: string;
    tenantSlug: string;
  }): Promise<AuthResult> {
    const [tenant] = await this.db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, input.tenantSlug))
      .limit(1);

    if (!tenant) {
      throw new AppError(
        "TENANT_NOT_FOUND",
        "Store not found",
        HttpStatus.NOT_FOUND,
      );
    }

    if (tenant.status !== "active") {
      throw new AppError(
        "TENANT_INACTIVE",
        "This store is currently inactive",
        HttpStatus.FORBIDDEN,
      );
    }

    const [user] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.tenantId, tenant.id), eq(users.email, input.email)))
      .limit(1);

    if (!user || !user.passwordHash) {
      throw new AppError(
        "INVALID_CREDENTIALS",
        "Invalid email or password",
        HttpStatus.UNAUTHORIZED,
      );
    }

    const passwordValid = await argon2.verify(user.passwordHash, input.password);
    if (!passwordValid) {
      throw new AppError(
        "INVALID_CREDENTIALS",
        "Invalid email or password",
        HttpStatus.UNAUTHORIZED,
      );
    }

    await this.db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    const tokens = await this.generateTokens(
      {
        userId: user.id,
        tenantId: tenant.id,
        role: user.role,
        email: user.email,
      },
      user.id,
      tenant.id,
    );

    this.logger.info({ tenantId: tenant.id, userId: user.id }, "User logged in");

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      },
      tokens,
    };
  }

  async refreshToken(refreshToken: string): Promise<TokenPair> {
    const tokenHash = this.hashToken(refreshToken);

    const [session] = await this.db
      .select()
      .from(sessions)
      .where(eq(sessions.tokenHash, tokenHash))
      .limit(1);

    if (!session || session.expiresAt < new Date()) {
      throw new AppError(
        "INVALID_REFRESH_TOKEN",
        "Invalid or expired refresh token",
        HttpStatus.UNAUTHORIZED,
      );
    }

    await this.db.delete(sessions).where(eq(sessions.id, session.id));

    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    if (!user) {
      throw new AppError(
        "USER_NOT_FOUND",
        "User not found",
        HttpStatus.NOT_FOUND,
      );
    }

    return this.generateTokens(
      {
        userId: user.id,
        tenantId: session.tenantId,
        role: user.role,
        email: user.email,
      },
      user.id,
      session.tenantId,
    );
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    await this.db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
  }

  private async generateTokens(
    payload: JwtPayload,
    userId: string,
    tenantId: string,
  ): Promise<TokenPair> {
    const accessExpiry = 900; // 15 minutes in seconds
    const refreshExpiry = 604800; // 7 days in seconds

    const accessToken = await this.jwtService.signAsync(
      { ...payload } as Record<string, unknown>,
      {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: accessExpiry,
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      { userId, tenantId, type: "refresh" } as Record<string, unknown>,
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: refreshExpiry,
      },
    );

    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.db.insert(sessions).values({
      userId,
      tenantId,
      tokenHash,
      expiresAt,
    });

    return { accessToken, refreshToken };
  }

  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }
}
