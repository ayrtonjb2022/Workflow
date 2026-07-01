# Tasks: Products Module

Implementation tasks broken down by phase. Each task is completable in one session.

---

## Phase 1 — Seed & Migration (DB changes)

### ✅ 1.1 Add `categories` to permissions seed

- **File**: `prisma/seed.ts`
- **Change**: Append `"categories"` to the `RESOURCES` array, placed adjacent to `"products"` for logical grouping.
- **Pattern**: Single constant insertion only — the existing loop generates all 4 permissions (`categories:{create,read,update,delete}`) and assigns `read` to user role, all to admin role.
- **Verification**: Re-run seed produces no duplicates. The admin role has `categories:*`, user role has `categories:read`.

### ✅ 1.2 Create enum migration for `ADJUSTMENT` stock movement type

- **File**: `prisma/migrations/20260702000000_add_stock_movement_adjustment/migration.sql` (new)
- **Change**: Raw SQL migration file because Prisma does not support enum value additions via `prisma migrate dev`:
  ```sql
  ALTER TYPE "StockMovementType" ADD VALUE 'ADJUSTMENT';
  ```
- **Strategy**: Create a new migration directory manually (`prisma/migrations/<timestamp>_add_stock_movement_adjustment/`) and apply it; or use `prisma migrate dev --create-only` then edit the generated SQL. Verify with `pnpm --filter @crm-erp/database db:status`.
- **Verification**: `npx prisma db execute` runs without error. Prisma Client regenerates correctly and recognizes `StockMovementType.ADJUSTMENT`.

---

## Phase 2 — Backend API

### ✅ 2.1 Create products repository (`products.repository.ts`)

- **File**: `apps/api/src/modules/products/products.repository.ts` (new)
- **Contents**: Prisma query methods:
  - `findAll(tenantId, page?, limit?, search?, categoryId?, active?)` — paginated, searchable by `code`/`name` (case-insensitive), filterable by `categoryId`/`active`, includes `category { id, name }`, ordered by `createdAt desc`. Returns `PaginatedResult<Product>`.
  - `findById(id, tenantId)` — single product with category include. Returns `null` if not found in tenant.
  - `findByCode(code, tenantId)` — used for duplicate detection in service.
  - `create(data)` — standard `prisma.product.create`.
  - `update(id, tenantId, data)` — scope to tenant.
  - `deactivate(id, tenantId)` — sets `active = false`, scope to tenant.
  - `adjustStockInTransaction(prismaTx, id, tenantId, newStock)` — called inside `$transaction`.
  - `findCategoryById(id, tenantId)` — for category validation on create.
- Plus category methods: `findAllCategories`, `findCategoryByName`, `createCategory`, `updateCategory`.

### ✅ 2.2 Create products TypeBox schemas (`products.schema.ts`)

- **File**: `apps/api/src/modules/products/products.schema.ts` (new)
- **Contents**: TypeBox schemas for request/response:
  - `ProductResponse`, `CreateProductBody`, `UpdateProductBody`, `AdjustStockBody`, `ProductQueryString`
  - `CategoryResponse`, `CreateCategoryBody`, `UpdateCategoryBody`
  - `PaginatedProductResponse`

### ✅ 2.3 Create products service (`products.service.ts`)

- **File**: `apps/api/src/modules/products/products.service.ts` (new)
- **Contents**: Business logic layer with `list`, `get`, `create` (code auto-generation via `getNextNumber`), `update` (no code/stock), `deactivate`, `adjustStock` (Prisma `$transaction`).

### ✅ 2.4 Create products routes + categories routes, register in app

- **File**: `apps/api/src/routes/products.ts` (new) — 6 product endpoints + 3 category endpoints with `authGuard`
- **File**: `apps/api/src/app.ts` (modified) — register `productRoutes`

---

## Phase 3 — Frontend

### ✅ 3.1 Create product types

- **File**: `apps/web/src/types/products.ts` (new)
- `Product`, `Category`, `PaginatedResponse<T>`, `CreateProductInput`, `UpdateProductInput`, `AdjustStockInput`

### ✅ 3.2 Create StockAdjustModal component

- **File**: `apps/web/src/pages/products/components/StockAdjustModal.tsx` (new)
- Modal with quantity, reason, adjust/cancel buttons, loading state, error display.

### ✅ 3.3 Create ProductList page

- **File**: `apps/web/src/pages/products/ProductList.tsx` (new)
- Paginated table with search, category filter, "Nuevo Producto" button, row click → detail.

### ✅ 3.4 Create ProductForm page

- **File**: `apps/web/src/pages/products/ProductForm.tsx` (new)
- Create/edit dual mode with category select, stock-on-create only, inline validation.

### ✅ 3.5 Create ProductDetail page

- **File**: `apps/web/src/pages/products/ProductDetail.tsx` (new)
- Read-only view with edit/deactivate/stock-adjust buttons, StockAdjustModal embedded.

### ✅ 3.6 Update RootLayout navigation and App routes

- **File**: `apps/web/src/layouts/RootLayout.tsx` (modified) — add "Inventario > Productos" nav
- **File**: `apps/web/src/App.tsx` (modified) — register `/inventory/products/*` routes

---

## Phase 4 — Verify

### 4.1 Seed verification

- Run `pnpm --filter @crm-erp/database seed`
- Verify `categories` permissions exist in DB (4 records: `create`, `read`, `update`, `delete`)
- Verify admin role has all 4, user role has `read` only
- Verify `products` permissions are unchanged (no duplicates)

### 4.2 Migration verification

- Verify `StockMovementType` enum has `ADJUSTMENT` value in PostgreSQL
- Run `npx prisma generate` to update client
- Verify TypeScript compilation succeeds in `apps/api`

### 4.3 Backend API smoke test

- Start API server, authenticate as admin
- Test each endpoint with `curl`:
  - `GET /api/categories` — empty 200
  - `POST /api/categories` — create 2 categories
  - `PATCH /api/categories/:id` — rename one
  - `POST /api/products` — create 3 products (1 with explicit code, 1 with empty code, 1 with stock)
  - `GET /api/products` — paginated list, test search, test categoryId filter
  - `GET /api/products/:id` — single with category
  - `PATCH /api/products/:id` — update name/price, verify code/stock unchanged
  - `POST /api/products/:id/adjust-stock` — increase by 5, verify stock updated
  - `POST /api/products/:id/adjust-stock` — decrease by -3, verify stock
  - `POST /api/products/:id/adjust-stock` — decrease below zero → 400
  - `DELETE /api/products/:id` — soft delete, verify `active=false`
  - `GET /api/products` — verify deactivated excluded by default
  - `GET /api/products?active=false` — verify deactivated included
- Test cross-tenant isolation: use another tenant's token → 404 on product from other tenant

### 4.4 Frontend smoke test

- Start web dev server, navigate to `/inventory/products`
- Verify "Inventario > Productos" nav link appears and highlights
- Create a product via the form, verify redirect to detail
- Edit the product, verify redirect to detail with updated values
- Adjust stock via modal, verify displayed stock updates
- Deactivate product, verify status badge and button toggle
- Verify search filters products, category filter works
- Verify pagination works with 20+ products
- Verify error states: invalid ID → error with retry
- Verify empty state: "No hay productos" when list is empty

---

## Review Workload Forecast

| Category | New Files | New Lines (est.) | Modified Files | Modified Lines (est.) |
|----------|-----------|------------------|----------------|----------------------|
| DB Seed | 0 | 0 | 1 (seed.ts) | +1 |
| DB Migration | 1 | 5 | 0 | 0 |
| Backend repository | 1 | 120 | 0 | 0 |
| Backend schema | 1 | 80 | 0 | 0 |
| Backend service | 1 | 130 | 0 | 0 |
| Backend routes | 1 | 180 | 1 (app.ts) | +2 |
| Frontend types | 1 | 30 | 0 | 0 |
| Frontend component | 1 | 100 | 0 | 0 |
| Frontend pages | 3 | 700 | 0 | 0 |
| Navigation/routes | 0 | 0 | 2 (RootLayout, App.tsx) | +25 |
| **Total** | **11 new** | **~1,345** | **4 modified** | **~28** |

### Budget Analysis

| Metric | Value |
|--------|-------|
| Estimated total lines changed | **~1,373** |
| Review budget (lines) | **400** |
| Budget exceeded? | **YES — by ~3.4x** |
| Chained PRs recommended? | **YES — strongly** |

### Chained PR Split Recommendation

| Slice | Est. Lines | Contents |
|-------|-----------|----------|
| **PR 1: DB + Backend** | ~520 | Tasks 1.1, 1.2, 2.1, 2.2, 2.3, 2.4 (seed, enum migration, repo, schema, service, routes + app.ts) |
| **PR 2: Frontend** | ~853 | Tasks 3.1 through 3.6 (types, StockAdjustModal, ProductList, ProductForm, ProductDetail, nav + routes) |

### Delivery Strategy Decisions Needed

Before starting apply phase, decide:

1. **Chained PRs**: Accept the 2-PR split above? Or merge into a single large PR with extended review? (Ask-on-risk — flag for user decision.)
2. **Migration strategy**: Manual SQL migration file vs `prisma migrate dev` then edit? The enum `ADD VALUE` requires raw SQL — confirm approach.
3. **Categories route location**: Inline with products routes in same file (as proposed), or separate `categories.ts` file? Proposed: single file for simplicity (only 3 endpoints).
4. **Stock decimal handling**: `stock` is `Int` on Prisma — passes through as-is. `unitPrice`/`costPrice` are `Decimal` — use `fromDecimal`/`toDecimal` in service layer. Confirm this is correct per existing pattern.
