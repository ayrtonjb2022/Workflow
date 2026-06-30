# Tasks: Core Auth Infrastructure

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1200–1600 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR #1: Prisma + deps + seed → PR #2: auth + magic-link modules → PR #3: users/roles modules + routes + guard + wiring |
| Delivery strategy | auto-forecast |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Prisma schema + dependencies + seed | PR #1 | Foundation: schema changes, install deps, migrate, seed script |
| 2 | Auth + magic-link modules | PR #2 | Core auth: auth service/repo, magic-link service/repo, error classes, cookie config, tenant rewrite |
| 3 | Users + roles + guard + wiring | PR #3 | Users/roles modules + routes + auth guard plugin + app.ts registration + verification |

## Phase 1: Foundation (Prisma + deps + seed)

- [x] 1.1 Modify `prisma/schema.prisma` — add `RefreshToken`, `UserRole`, `RolePermission` models; modify User (remove `role` string, add M2M relations), Role (remove `permissions` string, add `isSystem` + M2M relations), Permission (add `resource` + `action` fields)
- [x] 1.2 Install npm deps in `apps/api/package.json` — `jsonwebtoken`, `bcrypt`, `@fastify/cookie` + `@types/jsonwebtoken`, `@types/bcrypt`
- [x] 1.3 Run `prisma migrate dev --name add-core-auth` + `prisma generate`
- [x] 1.4 Add `AuthError` (401) and `ForbiddenError` (403) classes to `apps/api/src/lib/errors.ts`

## Phase 2: Core Auth Modules

- [x] 2.1 Create `apps/api/src/lib/cookie.ts` — cookie config helper (signed, httpOnly, secure, sameSite, maxAge; dev vs prod via NODE_ENV)
- [x] 2.2 Rewrite `apps/api/src/lib/tenant.ts` — extract `tenantId` and `userId` from decrypted JWT cookie instead of `x-tenant-id` header
- [x] 2.3 Create `apps/api/src/modules/auth/auth.repository.ts` — `findByEmail()`, `findById()`, `saveRefreshToken()`, `findRefreshToken()`, `revokeRefreshToken()`, `revokeUserRefreshTokens()`, `createUser()`, `createTenant()`, `createUserWithAdminRole()`
- [x] 2.4 Create `apps/api/src/modules/auth/auth.service.ts` — `register()` (hash pw, create user+tenant+refresh token), `login()` (verify pw, return tokens), `refresh()` (rotate), `logout()` (revoke)
- [x] 2.5 Create `apps/api/src/modules/magic-link/magic-link.repository.ts` — `saveToken()`, `findToken()`, `revokeToken()`
- [x] 2.6 Create `apps/api/src/modules/magic-link/magic-link.service.ts` — `requestMagicLink()` (generate token, log to console), `verifyMagicLink()` (validate token, issue JWT)

## Phase 3: Users, Roles, Routes & Guard

- [x] 3.1 Create `apps/api/src/modules/users/users.repository.ts` — `findMany(tenantId)`, `findById(tenantId, id)`, `create()`, `update()`, `deactivate()`
- [x] 3.2 Create `apps/api/src/modules/users/users.service.ts` — tenant-scoped CRUD delegating to repository
- [x] 3.3 Create `apps/api/src/modules/roles/roles.repository.ts` — `findMany(tenantId)`, `findById(tenantId, id)`, `create()`, `update()`, `delete()`, `assignPermission()`, `revokePermission()`, `assignUserRole()`
- [x] 3.4 Create `apps/api/src/modules/roles/roles.service.ts` — role CRUD + permission assignment delegation
- [x] 3.5 Create `apps/api/src/routes/auth.ts` — POST `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/refresh`, `/auth/magic-link` (request + verify)
- [x] 3.6 Create `apps/api/src/routes/users.ts` — GET/POST `/users`, GET/PUT/DELETE `/users/:id`
- [x] 3.7 Create `apps/api/src/routes/roles.ts` — GET/POST `/roles`, GET/PUT/DELETE `/roles/:id`, POST/DELETE `/roles/:id/permissions`, POST/DELETE `/roles/:id/users`
- [x] 3.8 Create `apps/api/src/plugins/auth-guard.ts` — Fastify plugin adding `authGuard` preHandler that checks `request.user.roles[].permissions` against `config.requiredPermission`; returns 403 if missing
- [x] 3.9 Modify `apps/api/src/app.ts` — register cookie plugin, auth guard plugin, all new routes (auth, users, roles) under `/api` prefix
- [x] 3.10 Run `pnpm typecheck` + `pnpm lint` — both must pass

## Phase 4: Seed & Verification

- [x] 4.1 Create `prisma/seed.ts` — insert all v1 permissions (resources × CRUD actions) + `admin` role (all permissions) + `user` role (read permissions)
- [x] 4.2 Add `"db:seed": "prisma db seed"` to root `package.json` scripts and configure `"prisma": { "seed": "tsx prisma/seed.ts" }`
- [x] 4.3 Run `tsc --noEmit` (typecheck) — all packages pass
- [ ] 4.4 Integration test via Fastify inject: register → login → access protected route → refresh → logout → verify tokens revoked
