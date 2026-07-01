# Proposal: scaffold-erp

## Intent

Establish the monorepo foundation, tooling, DB schema, and dev environment for CrmErp. Without this scaffold, no feature work is possible — no workspace, no DB connection, no way to serve API or frontend code.

Tenant isolation is embedded from day one: every business table includes `tenant_id` in the Prisma schema, ensuring multi-tenant safety without retrofitting.

## Scope

### In Scope
- Turborepo + pnpm monorepo: root config, workspace setup, shared TS/Lint/Prettier
- `apps/api`: Fastify + TypeScript + TypeBox scaffold with `/health` endpoint
- `apps/web`: React + Vite + React Router 7 scaffold with welcome page
- `packages/{shared,auth,events,ui}`: directory structure + `package.json` stubs
- Prisma schema with all v1 entities (Tenant, User, Role, Permission, Customer, Supplier, Product, Category, Branch)
- Initial Prisma migration
- Docker Compose: PostgreSQL 16 + service definitions
- `.env.example` files for all apps/packages

### Out of Scope
- Auth logic (login, register, JWT, magic links)
- CRUD operations or business logic
- Event bus implementation
- UI components (any)
- Test configuration
- Module activation system

## Capabilities

### New Capabilities
- `project-setup`: Monorepo foundation — pnpm workspaces, Turborepo pipeline, shared TypeScript config, ESLint + Prettier
- `database-schema`: Prisma schema with all v1 entities, `tenant_id` enforcement, initial migration
- `api-scaffold`: Fastify + TypeBox server with health check endpoint and Prisma client integration
- `web-scaffold`: React + Vite + React Router 7 app with routing skeleton and Tailwind CSS
- `docker-dev-env`: Docker Compose for PostgreSQL + service orchestration in development

### Modified Capabilities
None (greenfield — no existing specs).

## Approach

1. **Root config** — `package.json`, `pnpm-workspace.yaml`, `turbo.json`, shared `tsconfig.json`, ESLint, Prettier
2. **Packages** — scaffold `packages/shared` (types/DTOs), `auth`, `events`, `ui` (stubs with package.json only)
3. **API** — Fastify app with TypeBox validation, `/health` route, Prisma client setup
4. **Web** — Vite + React + React Router 7, Tailwind CSS, welcome page
5. **Prisma** — schema with all entities, `tenant_id` on business tables, `prisma generate` + `prisma migrate dev`
6. **Docker** — `docker-compose.yml` with PostgreSQL, api, web services
7. **Env** — `.env.example` per app, root `.env.example`

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `package.json` (root) | New | Workspace root config |
| `pnpm-workspace.yaml` | New | Workspace definition |
| `turbo.json` | New | Pipeline configuration |
| `apps/api/` | New | Fastify server scaffold |
| `apps/web/` | New | React + Vite scaffold |
| `packages/*/` | New | Shared types + stubs |
| `prisma/` | New | Schema + migrations |
| `docker-compose.yml` | New | Dev environment |
| `.env.example` files | New | Environment templates |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Package version incompatibility | Med | Pin major versions, test `pnpm install` early |
| Prisma migration against empty DB | Low | Validate schema, run `prisma validate` first |
| Docker networking between services | Low | Health checks, explicit port mapping, `depends_on` |

## Rollback Plan

Full scaffold teardown: delete `node_modules/`, `pnpm-lock.yaml`, `apps/`, `packages/`, `prisma/`, `docker-compose.yml`, all config files at root. The project was empty before — complete removal restores greenfield state.

## Dependencies

- Node.js >= 18, pnpm >= 8
- Docker + Docker Compose
- PostgreSQL 16 (Docker image)

## Success Criteria

- [ ] `pnpm install` completes with zero errors
- [ ] `pnpm --filter @crm/api dev` starts and `/health` returns 200
- [ ] `pnpm --filter @crm/web dev` starts and shows welcome page
- [ ] `docker compose up` launches PostgreSQL + api + web
- [ ] `pnpm db:migrate` creates all tables in PostgreSQL
- [ ] `pnpm lint` and `pnpm typecheck` pass with zero errors on scaffolded code
