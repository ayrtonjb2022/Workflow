# Permissions Delta Specification

**Domain**: `permissions-delta`

## Purpose

Add the `categories` resource to the permission seed script, enabling permission-based access control for the categories API. `products` permissions are already seeded (present in the existing `RESOURCES` array).

## Analysis

The current `prisma/seed.ts` `RESOURCES` array:

```
["users", "roles", "customers", "suppliers", "products", "invoices", "quotes", "orders", "cash", "reports", "settings"]
```

- `products` is ALREADY present. The 4 permissions `products:{create,read,update,delete}` are already generated and assigned to admin (all) and user (read-only).
- `categories` is NOT present. It MUST be added.

## Requirements

| # | Requirement | Strength | Description |
|---|-------------|----------|-------------|
| R1 | Add categories to RESOURCES | MUST | Append `"categories"` to the `RESOURCES` constant array in `prisma/seed.ts`. |
| R2 | Permission auto-generation | MUST | The existing loop logic generates 4 permission records: `categories:create`, `categories:read`, `categories:update`, and `categories:delete`. |
| R3 | Categories:delete is seeded but unused | MUST | `categories:delete` is seeded for consistency with the existing action-per-resource pattern, even though no DELETE endpoint exists for categories. It is harmlessly assigned to the admin role but unused by any route. |
| R4 | Admin role assignment | MUST | On the next seed run, the admin role receives all 4 categories permissions via `deleteMany + create` logic already in the seed. |
| R5 | User role assignment | MUST | On the next seed run, the user role receives `categories:read` only (filtered by `action === "read"` via existing logic). |
| R6 | Idempotent execution | MUST | The existing `upsert` call on each permission handles reruns safely — no duplicate permissions are created. |
| R7 | Sequential counter order | SHOULD | Place `"categories"` adjacent to `"products"` in the RESOURCES array for logical grouping. |

### Affected file

`prisma/seed.ts` — single line insertion into the `RESOURCES` array.

### Scenario: Seed adds categories permissions

- GIVEN a fresh database with no categories permissions
- WHEN `pnpm --filter @crm-erp/database seed` runs
- THEN 4 new permission records are created: `categories:create`, `categories:read`, `categories:update`, `categories:delete`
- AND the admin role is linked to all 4
- AND the user role is linked to `categories:read` only

### Scenario: Re-run seed after categories added

- GIVEN an already-seeded database that now has `categories` in RESOURCES
- WHEN the seed script runs again
- THEN the `upsert` calls find existing records and leave them unchanged
- AND the role's `deleteMany + create` reassigns all permissions (including the new ones)
- AND no duplicate permissions exist

### Scenario: products permissions unchanged

- GIVEN the existing `products:*` permissions are already seeded
- WHEN the seed script runs (before or after the change)
- THEN products permissions remain as-is: 4 permissions assigned to admin, `products:read` assigned to user
- AND no new products permissions are created
