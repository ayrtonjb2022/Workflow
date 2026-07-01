# Products API Specification

**Domain**: `products-api`

## Purpose

Provide tenant-scoped CRUD operations for products with code auto-generation, paginated list with search, and permission enforcement. Products are the foundation for inventory, purchasing, and sales modules.

## Requirements

| # | Requirement | Strength | Description |
|---|-------------|----------|-------------|
| R1 | List products | MUST | `GET /api/products?page=&limit=&search=` — paginated, searchable by `code` or `name` (partial, case-insensitive). Supports optional `categoryId` and `active` filters. Returns products with category info. |
| R2 | Get product | MUST | `GET /api/products/:id` returns full product data with category info. |
| R3 | Create product | MUST | `POST /api/products` with `name`, optional `code`, `categoryId`, `unitPrice`, `costPrice`, `stock`, optional `description`, optional `minStock`. Auto-generates code if omitted or duplicate. |
| R4 | Update product | MUST | `PATCH /api/products/:id` — updates name, description, categoryId, unitPrice, costPrice, minStock. MUST NOT update `code` or `stock`. |
| R5 | Deactivate product | MUST | `DELETE /api/products/:id` — soft delete via `active = false`. Product remains in DB but excluded from default list queries. |
| R6 | Code auto-generation | MUST | If `code` is empty or a record with the same `code` already exists in the tenant, automatically generates a new code via `getNextNumber(tenantId, "PRO")` with format `PRO-XXXXX`. |
| R7 | Code uniqueness | MUST | Enforce `[tenantId, code]` unique constraint. Duplicate `code` within the same tenant returns `409 Conflict`. |
| R8 | Category relation | MUST | Include `category: { id, name }` in all product responses. If `categoryId` is provided on create, validate it exists in the tenant. |
| R9 | Tenant isolation | MUST | All queries scope to `request.tenantId`. Never leak products across tenants. |
| R10 | Permissions | MUST | Enforce `products:read` on GET routes, `products:create` on POST, `products:update` on PATCH, `products:delete` on DELETE. |
| R11 | Price precision | MUST | `unitPrice` and `costPrice` are positive Decimal values. |
| R12 | Stock on create | MUST | `stock` is optional on create (defaults to 0). If provided, MUST be a non-negative integer. |
| R13 | Active filter | SHOULD | List endpoint SHOULD default to `active: true`. An explicit `active` query param overrides the default. |
| R14 | Category filter | SHOULD | List endpoint SHOULD accept `categoryId` query param to filter by category. |

### Product response shape

```typescript
{
  id: string
  code: string              // "PRO-00001"
  name: string
  description: string | null
  categoryId: string | null
  category: { id: string; name: string } | null
  unitPrice: number
  costPrice: number
  stock: number
  minStock: number
  active: boolean
  createdAt: string
  updatedAt: string
}
```

### Paginated response shape

```typescript
{
  data: Product[]
  total: number
  page: number
  limit: number
  totalPages: number
}
```

### Scenario: List products with search and pagination

- GIVEN 25 active products across 3 categories in the requester's tenant
- WHEN `GET /api/products?page=1&limit=10&search=laptop` is called
- THEN the response returns up to 10 products where `code` or `name` contains "laptop" (case-insensitive)
- AND `total` equals the count of matching products
- AND `totalPages` is derived from `Math.ceil(total / limit)`

### Scenario: Create product with auto-generated code

- GIVEN no product with code "PRO-00001" exists in the tenant
- WHEN `POST /api/products` is sent with `{ name: "Widget", unitPrice: 10, costPrice: 5, stock: 100 }`
- THEN a new product is created
- AND its `code` is `"PRO-00001"`
- AND `stock` is `100`
- AND response is `201 Created`

### Scenario: Create product with explicit unique code

- GIVEN no product with code "CUSTOM-001" exists in the tenant
- WHEN `POST /api/products` is sent with `{ code: "CUSTOM-001", name: "Custom Widget", unitPrice: 10, costPrice: 5 }`
- THEN a new product is created with `code = "CUSTOM-001"`
- AND response is `201 Created`

### Scenario: Create product with duplicate code within tenant

- GIVEN a product with code "PRO-00001" already exists in the tenant
- WHEN `POST /api/products` is sent with `{ code: "PRO-00001", ... }`
- THEN the system MUST return `409 Conflict`
- AND the error message indicates duplicate code

### Scenario: Create product with empty code triggers auto-generation

- GIVEN no product with code "PRO-00001" exists, and one product exists with code "PRO-00002"
- WHEN `POST /api/products` is sent with `{ code: "", name: "Another", ... }`
- THEN the system calls `getNextNumber(tenantId, "PRO")` and assigns the next sequence value
- AND response is `201 Created`

### Scenario: Update product does NOT change code or stock

- GIVEN a product with `code = "PRO-00001"`, `stock = 50`, `name = "Old Name"`
- WHEN `PATCH /api/products/:id` is sent with `{ name: "New Name" }`
- THEN `code` remains `"PRO-00001"`
- AND `stock` remains `50`
- AND `name` is updated to `"New Name"`

### Scenario: Deactivate product (soft delete)

- GIVEN an active product `P1`
- WHEN `DELETE /api/products/P1` is called
- THEN `P1.active` is set to `false`
- AND `P1` no longer appears in the default list query
- AND response is `200 OK` with the deactivated product

### Scenario: Get product from different tenant returns 404

- GIVEN a product exists in Tenant A
- WHEN a user from Tenant B calls `GET /api/products/:id` with that product's ID
- THEN the system returns `404 Not Found`

### Scenario: Create product with invalid categoryId

- GIVEN a category ID that does not exist in the tenant
- WHEN `POST /api/products` is sent with that `categoryId`
- THEN the system returns `400 Bad Request` or `409 Conflict`
- AND no product is created

### Scenario: List products excludes deactivated by default

- GIVEN 5 active products and 2 deactivated products
- WHEN `GET /api/products` is called without `active` param
- THEN only the 5 active products are returned
- AND `total` is `5`

### Scenario: List products with `active=false` includes deactivated

- GIVEN 5 active and 2 deactivated products
- WHEN `GET /api/products?active=false` is called
- THEN all 7 products are returned
