# Permissions Delta Specification

## Purpose

Add 12 permission records to the seed script for the sales module resources.

## Requirements

| # | Requirement | Strength | Description |
|---|-------------|----------|-------------|
| R1 | Quote permissions | MUST | Add to `RESOURCES` array: create 4 perms `quotes:create/read/update/delete` |
| R2 | Order permissions | MUST | Add to `RESOURCES` array: create 4 perms `orders:create/read/update/delete` |
| R3 | Invoice permissions | MUST | Add to `RESOURCES` array: create 4 perms `invoices:create/read/update/delete` |
| R4 | RESOURCES update | MUST | Append `"quotes"`, `"orders"`, `"invoices"` to the `RESOURCES` constant in `prisma/seed.ts` |
| R5 | Backwards compat | MUST | Existing roles (admin, user) auto-inherit new permissions on next seed run. Admin gets all, user gets read-only |
| R6 | Idempotent | MUST | Use `create` (not `upsert` — existing pattern). Re-seeding fails gracefully on unique constraint; production should use incremental migrations instead |

### Scenario: Seed adds new permissions

- GIVEN a fresh database with no sales permissions
- WHEN `pnpm --filter @crm-erp/database seed` runs
- THEN 12 new permission records are created (4 per resource: `quotes`, `orders`, `invoices`)
- AND the admin role is linked to all 12

### Scenario: Re-run seed is safe

- GIVEN existing permissions for all resources
- WHEN the seed script runs again
- THEN it fails on unique constraint for permission name
- AND no duplicate permissions are created (idempotent within the script's existing pattern)

### Scenario: User role gets read-only sales access

- GIVEN the user role created with read permissions filtered by action
- WHEN the seed script runs
- THEN `quotes:read`, `orders:read`, `invoices:read` are assigned to the user role
- AND create/update/delete permissions are NOT assigned to the user role
