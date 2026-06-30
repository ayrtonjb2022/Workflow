# Tasks: Scaffold ERP Monorepo

## Review Workload Forecast

Estimated lines: 1500–2500 | 400-line budget risk: High | Chained PRs: Yes | Strategy: auto-forecast → feature-branch-chain

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

Suggested units: tracker branch `feat/scaffold-erp`. PR 1 (root config + packages) → PR 2 (Prisma schema) → PR 3 (API scaffold) → PR 4 (web scaffold) → PR 5 (docker+env) → PR 6 (verification). Each child PR targets the previous PR's branch. Only the tracker merges to main.

## Phase 1: Root Config

- [x] 1.1 Create `package.json` — scripts, engines, devDeps
- [x] 1.2 Create `pnpm-workspace.yaml` — `apps/*` + `packages/*`
- [x] 1.3 Create `turbo.json` — build, dev, lint, typecheck, db:* pipeline
- [x] 1.4 Create `tsconfig.base.json` — strict, ESNext, composite
- [x] 1.5 Create `eslint.config.mjs` (flat config) + `.prettierrc`
- [x] 1.6 Create `.gitignore`

## Phase 2: Shared Packages

- [x] 2.1 Create `packages/shared/` — barrel types
- [x] 2.2 Create `packages/auth/` — stub
- [x] 2.3 Create `packages/events/` — `DomainEvent` + `EventBus` (EventEmitter)
- [x] 2.4 Create `packages/ui/` — stub

## Phase 3: Database Schema

- [x] 3.1 Create `prisma/schema.prisma` — all v1 entities + enums + indexes + PG 16 datasource
- [x] 3.2 Add `tenantId` + compound `(tenant_id, id)` index to every business table
- [x] 3.3 Run `prisma migrate dev --name init` (migration SQL generated via `migrate diff --from-empty`; requires Docker + PG 16 to apply)

## Phase 4: API Scaffold

- [x] 4.1 Create `apps/api/package.json` + `tsconfig.json`
- [x] 4.2 Create `apps/api/.env.example` (already existed)
- [x] 4.3 Create `src/lib/prisma.ts` — singleton + `tenantScoped()` wrapper
- [x] 4.4 Create `src/lib/tenant.ts` — context extractor + guard
- [x] 4.5 Create `src/lib/errors.ts` — AppError, TenantError
- [x] 4.6 Create `src/app.ts` — Fastify factory with TypeBox
- [x] 4.7 Create `src/index.ts` — entry + graceful shutdown
- [x] 4.8 Create `src/routes/health.ts` — GET /health
- [x] 4.9 Create `src/modules/health/` — service + repository
- [x] 4.10 Add `no-restricted-imports` eslint rule for `@prisma/client` (already existed — scoped properly)

## Phase 5: Web Scaffold

- [x] 5.1 Create `apps/web/package.json` + `tsconfig.json`
- [x] 5.2 Create `index.html`, `vite.config.ts` (React + Tailwind + /api proxy), `.env.example`
- [x] 5.3 Create `src/main.tsx` + `src/styles.css`
- [x] 5.4 Create `src/App.tsx` — Router 7 with lazy routes
- [x] 5.5 Create `src/layouts/RootLayout.tsx`
- [x] 5.6 Create `src/pages/Welcome.tsx`
- [x] 5.7 Create `src/pages/NotFound.tsx`

## Phase 6: Docker + Env

- [x] 6.1 Create `docker-compose.yml` — PG 16 + api service with health checks
- [x] 6.2 Create root `.env.example`

## Phase 7: Verification

- [x] 7.1 `pnpm install` — zero errors
- [x] 7.2 `pnpm typecheck` — all workspaces pass
- [x] 7.3 `pnpm lint` — zero errors
- [x] 7.4 Start API → `GET /health` returns 200 — ✅ verified
- [x] 7.5 Start web → welcome page renders — ✅ verified
