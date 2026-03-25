import { Injectable, Inject, HttpStatus } from "@nestjs/common";
import { eq, and, sql } from "drizzle-orm";
import { PinoLogger } from "nestjs-pino";
import * as argon2 from "argon2";
import { users } from "@ecommerce-sathi/db";
import { AppError } from "../../common/exceptions/app-error";
import {
  DATABASE_TOKEN,
  DatabaseInstance,
} from "../database/database.module";

interface ActivityLogEntry {
  id: string;
  action: string;
  userId: string;
  userName: string;
  details: string;
  timestamp: Date;
}

@Injectable()
export class StaffService {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: DatabaseInstance,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext("StaffService");
  }

  async listStaff(tenantId: string): Promise<Record<string, unknown>[]> {
    const result = await this.db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        phone: users.phone,
        role: users.role,
        avatarUrl: users.avatarUrl,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(
        and(
          eq(users.tenantId, tenantId),
          sql`${users.deletedAt} IS NULL`,
        ),
      );

    return result;
  }

  async inviteStaff(
    tenantId: string,
    email: string,
    name: string,
    role: "owner" | "admin" | "staff" | "viewer",
  ): Promise<Record<string, unknown>> {
    // Check if user with this email already exists for the tenant
    const [existing] = await this.db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.tenantId, tenantId),
          eq(users.email, email),
          sql`${users.deletedAt} IS NULL`,
        ),
      )
      .limit(1);

    if (existing) {
      throw new AppError(
        "STAFF_ALREADY_EXISTS",
        "A user with this email already exists for this tenant",
        HttpStatus.CONFLICT,
      );
    }

    if (role === "owner") {
      throw new AppError(
        "INVALID_ROLE",
        "Cannot invite a user with the owner role",
        HttpStatus.BAD_REQUEST,
      );
    }

    const tempPassword = `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const passwordHash = await argon2.hash(tempPassword);

    const [created] = await this.db
      .insert(users)
      .values({
        tenantId,
        email,
        name,
        role,
        passwordHash,
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt,
      });

    this.logger.info(
      { tenantId, email, role },
      "Staff member invited",
    );

    return created as Record<string, unknown>;
  }

  async updateRole(
    tenantId: string,
    userId: string,
    newRole: "owner" | "admin" | "staff" | "viewer",
  ): Promise<Record<string, unknown>> {
    const [user] = await this.db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(
        and(
          eq(users.id, userId),
          eq(users.tenantId, tenantId),
          sql`${users.deletedAt} IS NULL`,
        ),
      )
      .limit(1);

    if (!user) {
      throw new AppError(
        "STAFF_NOT_FOUND",
        "Staff member not found",
        HttpStatus.NOT_FOUND,
      );
    }

    if (user.role === "owner") {
      throw new AppError(
        "CANNOT_CHANGE_OWNER",
        "Cannot change the role of the owner",
        HttpStatus.FORBIDDEN,
      );
    }

    if (newRole === "owner") {
      throw new AppError(
        "INVALID_ROLE",
        "Cannot assign the owner role",
        HttpStatus.BAD_REQUEST,
      );
    }

    const [updated] = await this.db
      .update(users)
      .set({ role: newRole, updatedAt: new Date() })
      .where(
        and(eq(users.id, userId), eq(users.tenantId, tenantId)),
      )
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        updatedAt: users.updatedAt,
      });

    this.logger.info(
      { tenantId, userId, newRole },
      "Staff role updated",
    );

    return updated as Record<string, unknown>;
  }

  async removeStaff(
    tenantId: string,
    userId: string,
  ): Promise<{ removed: boolean }> {
    const [user] = await this.db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(
        and(
          eq(users.id, userId),
          eq(users.tenantId, tenantId),
          sql`${users.deletedAt} IS NULL`,
        ),
      )
      .limit(1);

    if (!user) {
      throw new AppError(
        "STAFF_NOT_FOUND",
        "Staff member not found",
        HttpStatus.NOT_FOUND,
      );
    }

    if (user.role === "owner") {
      throw new AppError(
        "CANNOT_REMOVE_OWNER",
        "Cannot remove the owner of the tenant",
        HttpStatus.FORBIDDEN,
      );
    }

    await this.db
      .update(users)
      .set({ deletedAt: new Date() })
      .where(
        and(eq(users.id, userId), eq(users.tenantId, tenantId)),
      );

    this.logger.info(
      { tenantId, userId },
      "Staff member removed",
    );

    return { removed: true };
  }

  async getActivityLog(
    tenantId: string,
    options: { page?: number; limit?: number },
  ): Promise<{
    data: ActivityLogEntry[];
    meta: { page: number; limit: number; total: number };
  }> {
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;

    // MVP mock data - no DB table yet
    this.logger.info({ tenantId, page, limit }, "Activity log requested");

    const mockEntries: ActivityLogEntry[] = [
      {
        id: "mock-1",
        action: "product.created",
        userId: "system",
        userName: "System",
        details: "Product 'Sample Product' was created",
        timestamp: new Date(),
      },
      {
        id: "mock-2",
        action: "order.updated",
        userId: "system",
        userName: "System",
        details: "Order #1001 status changed to shipped",
        timestamp: new Date(Date.now() - 3600000),
      },
    ];

    return {
      data: mockEntries,
      meta: {
        page,
        limit,
        total: mockEntries.length,
      },
    };
  }
}
