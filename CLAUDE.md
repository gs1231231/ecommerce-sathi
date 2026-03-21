# eCommerce Sathi - Project Intelligence

## Project Overview
eCommerce Sathi is an AI-first, India-native e-commerce platform builder.
Merchants create online stores via AI prompts or drag-and-drop, with built-in
payments (UPI/COD/cards), GST compliance, logistics, and WhatsApp commerce.

## Tech Stack (STRICT - do not deviate)
- Monorepo: Turborepo with pnpm workspaces
- Backend: NestJS 11 (TypeScript strict mode) on Node 22 LTS
- Frontend: Next.js 15 (App Router) + React 19 + Tailwind 4
- Database: PostgreSQL 16 with Drizzle ORM (NOT Prisma, NOT TypeORM)
- Cache: Redis (ioredis) for sessions, caching, rate limiting
- Queue: BullMQ on Redis for async jobs (NOT Kafka for MVP)
- AI: Anthropic Claude API via @anthropic-ai/sdk
- Auth: Better-Auth with JWT (15min access + 7day refresh)
- Validation: Zod everywhere (API input, env vars, config)
- API Style: REST with OpenAPI 3.1 auto-generation via @nestjs/swagger
- Testing: Vitest (unit) + Playwright (E2E) + Supertest (API)
- Editor: GrapesJS for drag-and-drop storefront editing

## Monorepo Structure
ecommerce-sathi/
  apps/
    api/              # NestJS backend (main API server)
    web/              # Next.js merchant dashboard + storefront
    mobile/           # React Native app (Phase 2)
  packages/
    db/               # Drizzle schema, migrations, seed
    shared/           # Shared types, utils, constants, Zod schemas
    ui/               # Shared React component library
    config/           # Shared ESLint, Tailwind, TypeScript configs

## Code Conventions (ENFORCE STRICTLY)
- File naming: kebab-case for files, PascalCase for components/classes
- Every function has explicit return types (no implicit any)
- Every API endpoint has Zod input validation + Swagger decorators
- Every DB query uses Drizzle query builder (NO raw SQL except migrations)
- Error handling: Custom AppError class with error codes, never throw strings
- Logging: Pino logger with structured JSON, correlation IDs on every request
- Tenant isolation: tenant_id on EVERY table, injected via middleware
- Environment: Zod-validated env config, never use process.env directly
- Imports: Use workspace aliases (@ecommerce-sathi/db, @ecommerce-sathi/shared)

## Multi-Tenancy Pattern
Every request goes through TenantMiddleware that:
1. Extracts tenant from JWT claims OR subdomain OR custom domain
2. Sets tenant context on AsyncLocalStorage
3. All DB queries auto-filter by tenant_id via Drizzle middleware
4. Tenant config (plan limits, features) cached in Redis (5min TTL)

## API Response Format (ALL endpoints)
{
  "success": true/false,
  "data": { ... },
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Human readable message",
    "details": { ... }
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150
  }
}

## Database Conventions
- Table names: snake_case, plural (products, order_items)
- Primary keys: UUID v7 (time-sortable) named "id"
- Every table has: id, tenant_id, created_at, updated_at
- Soft delete via deleted_at (nullable timestamp)
- JSONB for flexible fields (product metadata, settings)
- Indexes: composite on (tenant_id, <query_field>) for all lookup patterns

## Git Conventions
- Commits: conventional commits (feat:, fix:, chore:, refactor:)
- Branches: feature/<module>-<description>, fix/<issue>
- PRs: require passing CI + at least schema description

## What NOT to do
- Never use `any` for TypeScript types
- Never use Prisma or TypeORM (we use Drizzle)
- Never use Express directly (we use NestJS)
- Never hardcode secrets (use Vault/env)
- Never write SQL strings (use Drizzle query builder)
- Never skip input validation on any endpoint
- Never create a table without tenant_id
- Never use callback patterns (async/await only)
