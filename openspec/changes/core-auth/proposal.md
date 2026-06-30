# Proposal: Core Auth Infrastructure

## Intent

Build auth, users, roles, permissions, and tenant context so every future module builds on a solid auth foundation — no more stubs or `x-tenant-id` header hacks.

## Scope

### In Scope
- Auth endpoints: register, login, logout, magic-link request + verify
- HTTP-only cookie JWT with refresh token rotation
- User CRUD within tenant scope
- Role CRUD with granular permission assignment
- Permission system: action-based (leer_ventas, crear_factura), assignable to roles
- Tenant auto-creation on registration
- Tenant middleware: extract tenantId from JWT cookie, attach to request
- Permission guard: Fastify hook rejecting requests without required permission
- Prisma seed: default roles + permissions

### Out of Scope
- OAuth/SSO (future)
- Module-level permission scoping (added per module later)
- Email delivery for magic links (console/file logger for v1)
- Password reset flow (deferred)

## Capabilities

### New Capabilities
- `user-auth`: Login, register, JWT cookie management, refresh rotation, logout
- `magic-link-auth`: Magic link request and verification flow
- `user-management`: User CRUD within tenant scope
- `role-management`: Role CRUD, user-role assignment
- `permission-system`: Granular permissions, role-permission mapping
- `tenant-context`: Tenant auto-creation on registration, tenant middleware injection
- `auth-guard`: Route-level permission validation middleware

### Modified Capabilities
None — greenfield for this domain.

## Approach

1. Extend Prisma schema: User-Role relation, Role-Permission M2M, RefreshToken model
2. Create `modules/auth/` service layer (password hashing, JWT sign/verify, refresh rotation)
3. Create `modules/magic-link/` service (token generation, verification)
4. Create `modules/users/` service (tenant-scoped CRUD)
5. Create `modules/roles/` service (CRUD, permission assignment)
6. Rewrite `lib/tenant.ts` to extract tenantId from JWT cookie instead of header
7. Create Fastify plugin for permission guard
8. Add auth routes under `routes/auth.ts`, user routes under `routes/users.ts`, role routes under `routes/roles.ts`
9. Register routes + plugins in `app.ts`
10. Create seed script with base roles (admin, user) and all v1 permissions
11. Test end-to-end flows

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modified | Add User-Role relation, Role-Permission M2M, RefreshToken |
| `apps/api/src/lib/tenant.ts` | Rewritten | Extract tenantId from JWT cookie, not header |
| `apps/api/src/lib/errors.ts` | Modified | Add AuthError, ForbiddenError |
| `apps/api/src/modules/auth/` | New | Auth service layer |
| `apps/api/src/modules/magic-link/` | New | Magic link service |
| `apps/api/src/modules/users/` | New | User service |
| `apps/api/src/modules/roles/` | New | Role + permission service |
| `apps/api/src/routes/auth.ts` | New | Auth endpoints |
| `apps/api/src/routes/users.ts` | New | User endpoints |
| `apps/api/src/routes/roles.ts` | New | Role endpoints |
| `apps/api/src/plugins/auth-guard.ts` | New | Permission guard plugin |
| `apps/api/src/app.ts` | Modified | Register new routes + plugins |
| `prisma/seed.ts` | New | Default roles + permissions |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| HTTP-only cookie needs HTTPS in production | Low | Document dev vs prod cookie config |
| Magic links without real email sender | Low | Console logger + mailhog in Docker |
| Permission check overhead per request | Low | Cache role→permissions in memory with TTL |

## Rollback Plan

- Prisma migration: `prisma migrate down` or restore DB snapshot
- Routes: comment out auth-related `app.register()` calls in app.ts
- Cookie config: revert to header-based tenant extraction in lib/tenant.ts
- Deploy previous build

## Dependencies

- Existing scaffold (Fastify, Prisma, TypeBox) — already complete
- `jsonwebtoken` + `bcrypt` npm packages
- `cookie` + `@fastify/cookie` for cookie parsing

## Success Criteria

- [ ] POST /auth/register creates user + tenant + returns HTTP-only cookie
- [ ] POST /auth/login validates credentials + returns HTTP-only cookie
- [ ] Authenticated routes reject requests without valid cookie (401)
- [ ] GET /users returns users scoped to current tenant
- [ ] POST /roles creates role with granular permissions
- [ ] Tenant middleware attaches tenantId to all authenticated requests
- [ ] Permission guard returns 403 when user lacks required permission
