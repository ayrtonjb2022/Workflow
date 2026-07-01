# Design: Scaffold ERP Monorepo

## Technical Approach

Build bottom-up: root config → shared packages → database schema → API server → web app → Docker environment. Each layer depends on the previous, matching Turborepo's `^build` dependency chain. Packages can be scaffolded in parallel (they have no inter-dependency).

The order ensures that at every step the workspace graph resolves: root config enables pnpm install, then packages get their tsconfig from the root, then apps reference packages and the Prisma client.

**Architecture contract embedded**: the API scaffold includes a 4-layer backend (routes → services → repositories → DB) with mandatory tenant scoping and event bus wiring, even though business logic starts in a later change. This prevents the scaffold from being "empty folders" — it enforces the architectural boundaries from commit one.

## Architecture Decisions

### Decision: TypeBox over Zod for API validation

| Option | Key tradeoff |
|--------|-------------|
| Zod | Widespread, great DX, but requires `zod-to-json-schema` adapter for OpenAPI |
| **TypeBox** (chosen) | Native JSON Schema output; Fastify provides `@fastify/type-provider-typebox` out of the box |
| **Rationale**: TypeBox eliminates an adapter layer when we add Swagger/OpenAPI — the schemas ARE JSON Schema. Fastify 5 + TypeBox 0.34 is the documented path. |

### Decision: Turborepo pipeline

| Task | Depends on | Output | Persistent |
|------|-----------|--------|------------|
| `build` | `^build` | `dist/` | No |
| `dev` | — | — | Yes |
| `lint` | — | — | No |
| `typecheck` | — | — | No |
| `db:generate` | — | `node_modules/.prisma` | No |
| `db:migrate` | `db:generate` | `prisma/migrations/` | No |
| `db:seed` | `db:generate` | — | No |

`dev` runs all apps in parallel. `db:*` tasks are root-only and excluded from workspace caching.

### Decision: ESLint flat config at root

**Choice**: Single `eslint.config.mjs` with typescript-eslint v8 + @eslint/js v9
**Alternative**: Per-workspace configs
**Rationale**: All TypeScript follows the same rules. Workspace-level overrides via `ignores[]`. A single config reduces duplication and onboarding friction — standard for Turborepo starters.

### Decision: Prisma client at root, consumed by API

**Choice**: Schema at `prisma/schema.prisma`, `@prisma/client` as a dependency of `@crm/api`
**Alternative**: Dedicated `packages/db` workspace
**Rationale**: One shared datasource, fewer workspace hops. `prisma generate` outputs to `node_modules/.prisma/client` which `@prisma/client` re-exports. The API imports `@prisma/client` directly. Easy to extract to `packages/db` later if multi-datasource needs arise.

### Decision: Workspace naming — `@crm/*`

All workspaces use `@crm/api`, `@crm/web`, `@crm/shared`, `@crm/auth`, `@crm/events`, `@crm/ui`. Short, scoped, avoids npm publishing (private workspace). The `@crmerp/*` alternative was rejected because pnpm has shorter name limits for internal linking.

### Decision: Tenant enforcement layer (CRITICAL)

**Choice**: Mandatory middleware + scoped Prisma helper — every business query MUST pass through tenant filtering.

**Components**:
1. **Fastify hook** — extracts `tenantId` from JWT (or request context for now), attaches to `request.tenantId`
2. **Prisma middleware** — wraps every `findMany`, `findFirst`, `create`, `update`, `delete` with `where: { tenantId: requestTenant }`
3. **`db.tenantScoped()`** — explicit helper that returns a pre-filtered Prisma client. Used in repositories.
4. **Blocking guard** — any query without tenant context throws at runtime

**Rationale**: Multi-tenant data leaks are a business-killing bug. A field isn't enforcement — middleware + helper + block is. Extracting to `packages/db` later is a mechanical move because all tenant logic is already centralized in the helper.

**Tradeoff**: Adds indirection to every query. Worth it for safety — the alternative is auditing every raw Prisma call for missing `tenantId`.

### Decision: Data access layer — routes → services → repositories

**Choice**: 3-layer backend inside each module.

```
apps/api/src/
├── routes/          ← HTTP handlers, validation, serialization (thin)
├── modules/
│   ├── sales/
│   │   ├── sales.service.ts        ← Business logic, orchestrates repos + events
│   │   └── sales.repository.ts     ← Prisma queries (ONLY file that imports db)
│   └── inventory/
│       ├── inventory.service.ts
│       └── inventory.repository.ts
└── lib/
    ├── prisma.ts                   ← PrismaClient singleton + tenant wrapper
    └── tenant.ts                   ← Tenant context extractor + guard
```

| Layer | Responsibility | Imports from |
|-------|---------------|-------------|
| `routes/` | Parse request, validate, call service, return response | services, nothing else |
| `service` | Business logic, compose repo calls, emit events | repositories, events |
| `repository` | DB queries with tenant scoping | `lib/prisma.ts` (only layer that touches Prisma) |

**Rationale**: This is the boundary that prevents spaghetti. Routes don't know about Prisma. Services don't know about HTTP. Repositories don't know about business rules. Changing the ORM means touching one folder. This scaffold creates the folder structure and one example module skeleton — no business logic yet.

### Decision: Import boundaries — eslint rule enforcing layer isolation

**Choice**: Custom eslint rule + architectural convention.

| Rule | Enforced |
|------|----------|
| No `@prisma/client` import outside `repositories/`, `lib/prisma.ts`, and `prisma/` | eslint `no-restricted-imports` |
| Services don't import from routes | Convention (code review) |
| Repositories don't import from services | Convention (code review) |

**Root config** (`eslint.config.mjs`) includes:
```js
{
  files: ["apps/api/src/**"],
  rules: {
    "no-restricted-imports": ["error", {
      patterns: [{
        group: ["@prisma/client"],
        message: "Use lib/prisma.ts instead of importing PrismaClient directly",
        allowImportNames: [],
      }]
    }]
  }
}
```

**Rationale**: The only way to guarantee architectural boundaries survive is to automate enforcement. A convention in a README is forgotten in 2 weeks. An eslint rule fails CI.

**Future**: When `packages/db` is extracted, the restricted import shifts from `@prisma/client` to `@crm/db`, and `lib/prisma.ts` becomes the `packages/db` barrel.

### Decision: Event system (v1)

**Choice**: Node.js `EventEmitter` wrapped in `@crm/events`, with a domain event interface.

```ts
// packages/events/src/index.ts
import { EventEmitter } from "events"

export interface DomainEvent {
  name: string
  payload: unknown
  tenantId: string
  timestamp: Date
}

class EventBus {
  private emitter = new EventEmitter()

  emit(event: DomainEvent): void {
    this.emitter.emit(event.name, event)
  }

  on(eventName: string, handler: (event: DomainEvent) => void): void {
    this.emitter.on(eventName, handler)
  }
}

export const bus = new EventBus()
```

| Aspect | Decision |
|--------|----------|
| Library | Built-in `events` module (zero-dependency) |
| Wiring | Service emits → repository listens or another service listens |
| Scope | In-process only. No persistence, no retry, no DLQ |
| Migration path | Replace `EventBus` class with RabbitMQ/NATS adapter — module code doesn't change because `bus.emit()` / `bus.on()` interface stays identical |

**Rationale**: An EventEmitter costs nothing and forces the right habit — modules communicate through events, not direct imports. By v3 when we need cross-process events, the contract is already defined and every module already speaks events. No retrofitting.

**Tradeoff**: Not durable — if the process crashes before the handler runs, the event is lost. Acceptable for v1. In v2 we add an outbox pattern.

## Architecture Contract (v1) — embedded

These rules are NOT optional. They must hold from the first commit.

```
┌─────────────────────────────────────────────┐
│            ROUTES (thin handlers)            │
│  parse → validate → call service → respond   │
├─────────────────────────────────────────────┤
│           SERVICES (business logic)          │
│  compose repos, emit events, enforce rules   │
├──────────────────┬──────────────────────────┤
│  REPOSITORIES    │     EVENT BUS            │
│  tenant-scoped   │  service emit → listen   │
│  ONLY Prisma     │  in-process EventEmitter │
└──────────────────┴──────────────────────────┘
         │
         ▼
    lib/prisma.ts (tenant wrapper)
         │
         ▼
    @prisma/client
```

### Rules
1. **Every business table has `tenantId String @map("tenant_id")`** — non-negotiable
2. **No file outside `repositories/` or `lib/prisma.ts` imports `@prisma/client`** — enforced by eslint
3. **Every service call that changes state emits a domain event** — even if no listener exists yet
4. **Modules don't import each other** — they communicate via events or a shared service interface
5. **Routes never import Prisma, repositories never import HTTP types** — layer isolation

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `package.json` | Create | Root — scripts, engines, devDeps |
| `pnpm-workspace.yaml` | Create | `apps/*` + `packages/*` globs |
| `turbo.json` | Create | Pipeline with build/dev/lint/typecheck/db:* |
| `tsconfig.base.json` | Create | Strict, ESNext, path aliases |
| `eslint.config.mjs` | Create | Flat config — TS + Prettier |
| `.prettierrc` | Create | Width 100, single quotes, trailing commas |
| `.gitignore` | Create | node_modules, dist, .env, prisma migrations |
| `prisma/schema.prisma` | Create | All v1 entities + enums + tenant_id indexes |
| `packages/shared/package.json` | Create | `@crm/shared` types & utilities |
| `packages/shared/tsconfig.json` | Create | Declaration emit |
| `packages/shared/src/index.ts` | Create | Barrel exports |
| `packages/auth/package.json` | Create | `@crm/auth` stub |
| `packages/auth/tsconfig.json` | Create | Stub config |
| `packages/auth/src/index.ts` | Create | Stub export |
| `packages/events/package.json` | Create | `@crm/events` — EventBus with DomainEvent interface |
| `packages/events/tsconfig.json` | Create | Events TS config |
| `packages/events/src/index.ts` | Create | EventBus class + DomainEvent type export |
| `packages/ui/package.json` | Create | `@crm/ui` stub |
| `packages/ui/tsconfig.json` | Create | Stub config |
| `packages/ui/src/index.ts` | Create | Stub export |
| `apps/api/package.json` | Create | `@crm/api` deps |
| `apps/api/tsconfig.json` | Create | API TS config |
| `apps/api/.env.example` | Create | DATABASE_URL, PORT |
| `apps/api/src/index.ts` | Create | Server entry + graceful shutdown |
| `apps/api/src/app.ts` | Create | Fastify app factory |
| `apps/api/src/routes/health.ts` | Create | GET /health — DB check |
| `apps/api/src/lib/prisma.ts` | Create | PrismaClient singleton + tenantScoped() wrapper |
| `apps/api/src/lib/tenant.ts` | Create | Tenant context extractor + blocking guard |
| `apps/api/src/lib/errors.ts` | Create | Domain error classes (AppError, TenantError) |
| `apps/api/src/modules/.gitkeep` | Create | Keep modules/ dir in git |
| `apps/api/src/modules/health/health.service.ts` | Create | Health check business logic |
| `apps/api/src/modules/health/health.repository.ts` | Create | DB ping with tenant scope |
| `apps/web/package.json` | Create | `@crm/web` deps |
| `apps/web/tsconfig.json` | Create | Web TS config |
| `apps/web/index.html` | Create | Vite HTML entry |
| `apps/web/vite.config.ts` | Create | React plugin, API proxy, Tailwind |
| `apps/web/.env.example` | Create | VITE_API_URL |
| `apps/web/src/main.tsx` | Create | React root render |
| `apps/web/src/App.tsx` | Create | Router provider |
| `apps/web/src/layouts/RootLayout.tsx` | Create | Layout + Outlet |
| `apps/web/src/pages/Welcome.tsx` | Create | Landing page |
| `apps/web/src/pages/NotFound.tsx` | Create | 404 page |
| `apps/web/src/styles.css` | Create | Tailwind CSS 4 entry |
| `docker-compose.yml` | Create | PG 16 + service definitions |
| `.env.example` | Create | Shared DB credentials |

**Total: 42 new files**

## Dependency Map

| Workspace | Dependencies | Dev Dependencies |
|-----------|-------------|------------------|
| Root | — | turbo, typescript, prettier, eslint, @eslint/js, typescript-eslint, eslint-config-prettier, globals, prisma |
| `@crm/api` | @crm/shared, fastify, @fastify/type-provider-typebox, @sinclair/typebox, @prisma/client | tsx, @types/node |
| `@crm/web` | react, react-dom, react-router, @tanstack/react-query | vite, @vitejs/plugin-react, tailwindcss, @tailwindcss/vite, @types/react, @types/react-dom |
| `@crm/shared` | — | typescript |
| `@crm/auth` | — | typescript |
| `@crm/events` | (built-in Node events) | typescript |
| `@crm/ui` | — | typescript |

## Testing Strategy

No test runner configured in this scaffold. **Flag for later**: configure Vitest at root, add smoke tests for `GET /health` (fastify.inject()), and type-level tests for Prisma queries. Testing infrastructure is its own change (`setup-testing`).

## Open Questions

- [ ] Tailwind CSS 4 with Vite: `@tailwindcss/vite` is the v4-native approach but was recently released — verify it's stable for production dev. Escape plan: downgrade to Tailwind v3 + PostCSS config.
- [ ] Prisma client output path: default (`node_modules/@prisma/client`) works for v1. If extraction to `packages/db` happens later, a custom `output` in schema may be needed.
- [ ] Event bus durability: v1 uses in-process EventEmitter. Events are lost on crash. Acceptable for v1 — outbox pattern deferred to v2.
- [ ] ESLint future split: single flat config works for 2 apps. When modules grow, split into `eslint/base`, `eslint/web`, `eslint/api` configs.
- [ ] `db:seed` command: pipeline placeholder exists, actual seed data defined when first module needs development fixtures.
