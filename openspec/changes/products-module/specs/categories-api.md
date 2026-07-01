# Categories API Specification

**Domain**: `categories-api`

## Purpose

Provide minimal CRUD for product categories — enough to power a dropdown selector in the product form. Categories are tenant-scoped with name uniqueness.

## Requirements

| # | Requirement | Strength | Description |
|---|-------------|----------|-------------|
| R1 | List categories | MUST | `GET /api/categories` — returns all active categories for the tenant, ordered by name. No pagination (categories are few). |
| R2 | Create category | MUST | `POST /api/categories` with `name` and optional `description`. Validates name uniqueness within tenant. |
| R3 | Rename category | MUST | `PATCH /api/categories/:id` accepts `name` and/or `description`. Validates name uniqueness. |
| R4 | Name uniqueness | MUST | `[tenantId, name]` unique constraint enforced. Duplicate name returns `409 Conflict`. |
| R5 | No delete endpoint | MUST | No `DELETE /api/categories/:id` endpoint exists. Categories with products have `onDelete: SetNull` — safely deactivatable via DB but no API route. |
| R6 | Tenant isolation | MUST | All queries scope to `request.tenantId`. |
| R7 | Permissions | MUST | Enforce `categories:read` on GET, `categories:create` on POST, `categories:update` on PATCH. |
| R8 | Active only | SHOULD | List endpoint SHOULD return only `active: true` categories. |
| R9 | Frontend | MUST NOT | No frontend list/view/edit/detail pages for categories. Categories are managed via the backend only (API tools or future admin UI). |

### Category response shape

```typescript
{
  id: string
  name: string
  description: string | null
  active: boolean
  createdAt: string
}
```

### Scenario: List all active categories

- GIVEN 3 categories in the tenant: "Electrónica", "Ropa", "Hogar"
- WHEN `GET /api/categories` is called
- THEN the response returns all 3 categories ordered by name
- AND `active: false` categories are excluded

### Scenario: Create category with unique name

- GIVEN no category named "Electrónica" exists in the tenant
- WHEN `POST /api/categories` is sent with `{ name: "Electrónica" }`
- THEN a new category is created
- AND response is `201 Created`

### Scenario: Create category with duplicate name

- GIVEN a category named "Electrónica" already exists in the tenant
- WHEN `POST /api/categories` is sent with `{ name: "Electrónica" }`
- THEN the system returns `409 Conflict`

### Scenario: Rename category

- GIVEN a category with id `C1` and name "Old Name"
- WHEN `PATCH /api/categories/C1` is sent with `{ name: "New Name" }`
- THEN the category name is updated to "New Name"
- AND response is `200 OK`

### Scenario: Rename category to an existing name

- GIVEN categories "A" and "B" exist in the same tenant
- WHEN `PATCH /api/categories/A` is sent with `{ name: "B" }`
- THEN the system returns `409 Conflict`

### Scenario: Rename category in different tenant is isolated

- GIVEN categories "A" exists in Tenant A and "A" exists in Tenant B
- WHEN a request from Tenant A renames their "A" to "X"
- THEN Tenant B's "A" is unaffected
- AND Tenant A's category is renamed
