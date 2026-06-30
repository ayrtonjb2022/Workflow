# Design: Core Auth Infrastructure

## Technical Approach

Extend the existing scaffold — no refactoring. The 4-layer pattern (routes → services → repositories → DB) and User/Role/Permission models already exist. This change: (1) upgrades Prisma User/Role/Permission models to proper M2M relations, (2) rewrites `lib/tenant.ts` from header extraction to JWT cookie extraction, (3) adds four modules (auth, magic-link, users, roles) following the existing `health` module singleton pattern, (4) adds a Fastify permission guard plugin, and (5) creates a seed script.

## Architecture Decisions

### JWT Token Strategy
| Option | Tradeoff |
|--------|----------|
| DB-stored refresh tokens with rotation | DB lookup per refresh; enables reuse detection (spec requirement) |
| Stateless refresh tokens | No DB call, but no rotation or revocation |
| **Decision**: DB-stored with rotation — reuse detection is non-negotiable per user-auth spec |

### Password Hashing
| Option | Tradeoff |
|--------|----------|
| **bcrypt cost 12** | ~250ms/hash, GPU-resistant, no native compilation |
| argon2 | Stronger but needs native bindings |
| **Decision**: bcrypt cost 12 — maturity and zero native deps win for v1 |

### Permission Evaluation
| Option | Tradeoff |
|--------|----------|
| **DB query per request** | Correct by default, simple |
| In-memory cache with TTL | Faster but stale until expiry |
| **Decision**: DB query — cache later if profiling shows a bottleneck |

### Guard Hook
| Option | Tradeoff |
|--------|----------|
| **Route-level `preHandler`** | Declarative, matches Fastify patterns, runs after auth middleware |
| Global `onRequest` | Centralized but needs route metadata parsing |
| **Decision**: Route-level `preHandler` reading `config.requiredPermission` |

## Data Flow

```
Client → Fastify → onRequest (parse cookie, decrypt JWT) → preHandler (check permissions) → route → service → repository → Prisma
                        │                                          │
                   attach request.userId                     query user→roles→permissions
                   attach request.tenantId                   compare vs config.requiredPermission
```

## Prisma Schema Changes

**New models**: `RefreshToken` (id, token, userId FK, tenantId, expiresAt, revokedAt?, createdAt), `UserRole` (userId FK, roleId FK), `RolePermission` (roleId FK, permissionId FK).

**Model changes**:
- `User`: remove `role` string, add `UserRole[]` relation, add `RefreshToken[]` relation. Keep existing `active`, `passwordHash`.
- `Role`: remove `permissions` string, add `isSystem Boolean @default(false)`, add `RolePermission[]` + `UserRole[]` relations.
- `Permission`: add `resource String` and `action String` columns; keep `name` as `resource:action` unique identifier.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modify | Refactor User/Role/Permission relations, add RefreshToken |
| `prisma/seed.ts` | Create | Default roles + all v1 permissions |
| `apps/api/package.json` | Modify | Add jsonwebtoken, bcrypt, @fastify/cookie |
| `apps/api/src/lib/tenant.ts` | Rewrite | Extract tenantId from JWT cookie |
| `apps/api/src/lib/errors.ts` | Modify | Add AuthError (401), ForbiddenError (403) |
| `apps/api/src/lib/cookie.ts` | Create | Cookie config (dev vs prod) |
| `apps/api/src/plugins/auth-guard.ts` | Create | Permission guard Fastify plugin |
| `apps/api/src/routes/auth.ts` | Create | /auth/register, login, logout, refresh, magic-link |
| `apps/api/src/routes/users.ts` | Create | CRUD /users |
| `apps/api/src/routes/roles.ts` | Create | CRUD /roles |
| `apps/api/src/modules/auth/auth.service.ts` | Create | Login, register, refresh, logout |
| `apps/api/src/modules/auth/auth.repository.ts` | Create | User lookup, refresh token CRUD |
| `apps/api/src/modules/magic-link/magic-link.service.ts` | Create | Generate + verify magic link |
| `apps/api/src/modules/magic-link/magic-link.repository.ts` | Create | Magic link token CRUD |
| `apps/api/src/modules/users/users.service.ts` | Create | Tenant-scoped user CRUD |
| `apps/api/src/modules/users/users.repository.ts` | Create | Tenant-scoped Prisma queries |
| `apps/api/src/modules/roles/roles.service.ts` | Create | Role CRUD, permission assign/revoke |
| `apps/api/src/modules/roles/roles.repository.ts` | Create | Role + permission queries |
| `apps/api/src/app.ts` | Modify | Register auth guard plugin + all new routes |

## Interfaces / Contracts

Modules follow the existing `health` singleton pattern:

```ts
// apps/api/src/modules/auth/auth.service.ts
export const authService = {
  register(dto: RegisterDto): Promise<AuthResult>,
  login(email: string, password: string): Promise<AuthResult>,
  logout(refreshToken: string): Promise<void>,
  refresh(refreshToken: string): Promise<AuthResult>,
}
```

Auth guard applied per route via route config:

```ts
app.get('/users', {
  config: { requiredPermission: 'users:read' },
  preHandler: [app.authGuard],
  schema: { ... },
}, handler)
```

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | Magic link token generation & expiry | Call service, assert token format, DB insertion |
| Unit | Auth guard preHandler | Mock request with roles, assert next() vs throw |
| Integration | Full cookie cycle | Fastify inject(): register → login → access protected → refresh → logout |
| Integration | Permission gating | Inject with/without cookie, assert 200 vs 401 vs 403 |

## Migration / Rollout

Existing DB has `User.role` (string) and `Role.permissions` (string). Migration: (1) create UserRole, RolePermission, RefreshToken tables, (2) migrate existing role assignments, (3) drop `User.role` and `Role.permissions` columns. For a fresh DB (current state), no data migration — just the schema migration.

## Seed Plan

`prisma/seed.ts` seeds: permissions for all v1 resources (users, roles, permissions, customers, products, invoices, quotes, orders, cash, reports, settings) × actions (create, read, update, delete) + default roles `admin` (all permissions) and `user` (read permissions).
