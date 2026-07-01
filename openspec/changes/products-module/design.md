# Design: Products Module

## Technical Approach

3-layer backend (`apps/api/src/modules/products/`) + 3 frontend pages (`apps/web/src/pages/products/`). Reuses existing patterns: `authGuard` + `requiredPermission`, `getNextNumber("PRO")`, `fromDecimal`/`toDecimal`, `NotFoundError`/`ValidationError`. Stock adjustment uses Prisma `$transaction` for atomicity. Categories are backend-only — frontend consumes them via a select dropdown.

No event bus — this module is self-contained. All operations are synchronous, tenant-scoped via `request.tenantId`.

## Architecture Decisions

| Option | Tradeoffs | Decision |
|--------|-----------|----------|
| Code gen on empty vs always | Always-gen loses custom codes | Empty or conflict → auto-gen via `getNextNumber` |
| Stock field on create vs separate endpoint | On-create field is simpler for initial stock, matches spec | Include `stock` on create; adjustments via dedicated endpoint |
| Categories as backend-only vs full frontend | Full CRUD UI not justified by usage (only dropdown) | Backend-only CRUD, dropdown in ProductForm |
| `$transaction` for stock vs sequential ops | Sequential can leave orphan StockMovement on failure | `$transaction` — atomicity is mandatory |
| Soft-delete vs hard-delete | Hard breaks existing FK references (quote/order items) | `active = false` — existing pattern |

**Tenant isolation**: All repository queries include `tenantId` in `where` clauses. Multi-tenant via shared DB — no new strategy needed, same pattern as `customers`.

## Data Flow

### Create Product

```
Browser ──POST /api/products──→ Route Handler
                                      │
                                      ▼
                                ProductsService.create()
                                      │
                                      ▼
                                ProductsRepository.create()
                                      │
                                      ▼
                                Prisma: product.create()
                                      │
                                      ▼
                                Response 201 + Product JSON
```

Code gen flow inside `create()`:
```
  code provided? ──yes──→ exists in tenant? ──no──→ use it
      │                          │
      no                         yes (conflict)
      │                          │
      └──→ getNextNumber()       └──→ getNextNumber() → retry
```

### Stock Adjustment (Atomic)

```
         ┌─────────────────────────────────────┐
         │  Prisma $transaction                │
         │                                     │
         │  1. Read product (lock via update)   │
         │  2. Validate stock >= |quantity|     │
         │  3. product.update({ stock: new })   │
         │  4. stockMovement.create({ type:     │
         │       ADJUSTMENT, quantity: abs })   │
         └─────────────────────────────────────┘
                          │
                    success? ──yes──→ 200 + updated product
                          │
                          no
                          ▼
                     Rollback both
```

## File Changes

| File | Action | Purpose |
|------|--------|---------|
| `apps/api/src/modules/products/products.repository.ts` | Create | Prisma queries: findAll, findById, create, update, deactivate, adjustStock |
| `apps/api/src/modules/products/products.service.ts` | Create | Business logic: validation, code gen, stock guard |
| `apps/api/src/modules/products/products.schema.ts` | Create | TypeBox schemas for request/response shapes |
| `apps/api/src/routes/products.ts` | Create | Route definitions: 6 endpoints + auth + permissions |
| `apps/api/src/app.ts` | Modify | Register `productRoutes` |
| `apps/web/src/types/products.ts` | Create | `Product`, `Category`, `PaginatedResponse<Product>` interfaces |
| `apps/web/src/pages/products/ProductList.tsx` | Create | Paginated table + search + category filter |
| `apps/web/src/pages/products/ProductForm.tsx` | Create | Create/edit form with validation |
| `apps/web/src/pages/products/ProductDetail.tsx` | Create | Detail view + adjust stock + deactivate |
| `apps/web/src/pages/products/components/StockAdjustModal.tsx` | Create | Modal for stock quantity + reason |
| `apps/web/src/layouts/RootLayout.tsx` | Modify | Add "Inventario" section with "Productos" link |
| `apps/web/src/App.tsx` | Modify | Register `/inventory/products/*` routes |
| `prisma/seed.ts` | Modify | Add `"categories"` to RESOURCES array |
| `prisma/migrations/.../add_stock_movement_adjustment.sql` | Create | Raw SQL: `ALTER TYPE "StockMovementType" ADD VALUE 'ADJUSTMENT'` |

## API Contracts

| Method | Path | Permission | TypeBox Body/Payload |
|--------|------|-----------|---------------------|
| GET | `/api/products` | `products:read` | Query: `page?`, `limit?`, `search?`, `categoryId?`, `active?` |
| GET | `/api/products/:id` | `products:read` | Params: `{ id: string }` |
| POST | `/api/products` | `products:create` | Body: `{ name, code?, categoryId?, unitPrice, costPrice, stock?, description?, minStock? }` |
| PATCH | `/api/products/:id` | `products:update` | Body: `{ name?, categoryId?, unitPrice?, costPrice?, description?, minStock? }` |
| DELETE | `/api/products/:id` | `products:delete` | Params: `{ id: string }` — sets `active = false` |
| POST | `/api/products/:id/adjust-stock` | `products:update` | Body: `{ quantity: number, reason?: string }` |
| GET | `/api/categories` | `categories:read` | No params |
| POST | `/api/categories` | `categories:create` | Body: `{ name, description? }` |
| PATCH | `/api/categories/:id` | `categories:update` | Body: `{ name?, description? }` |

**Response shapes** follow spec: Product with `{ id, code, name, category, unitPrice, costPrice, stock, minStock, active, createdAt, updatedAt }`. Paginated: `{ data, total, page, limit, totalPages }`. Categories: `{ id, name, description, active, createdAt }`.

## Frontend Component Tree

```
/pages/products/
  ProductList.tsx         ← /inventory/products
  ProductForm.tsx         ← /inventory/products/new, /inventory/products/:id/edit
  ProductDetail.tsx       ← /inventory/products/:id
  /components/
    StockAdjustModal.tsx  ← embedded in ProductDetail

RootLayout.tsx — new section:
  "Inventario" → [ Productos (/inventory/products) ]
```

Each page uses TanStack Query `useQuery`/`useMutation`, the existing `api()` helper, and reuses `Table`, `Pagination`, `SearchBar`, `Button`, `Input`, `Modal` from `components/ui/`.

## Prisma Changes

**Migration**: Raw SQL to extend the enum (Prisma does NOT support enum value addition via schema push):
```sql
ALTER TYPE "StockMovementType" ADD VALUE 'ADJUSTMENT';
```

No schema changes — `Product`, `Category`, `StockMovement` models already exist with all required fields and relations.

## Error Handling

| Scenario | Error | Status | Strategy |
|----------|-------|--------|----------|
| Product not found in tenant | `NotFoundError` | 404 | Repository returns null → service throws |
| Category not found on create | `ValidationError` | 400 | Check exists before create |
| Duplicate `[tenantId, code]` | `ValidationError` | 400 | Prisma unique violation → catch in service |
| Duplicate category name | `ValidationError` | 409 | Same pattern |
| Stock below zero on adjust | `ValidationError` | 400 | Validate before transaction |
| Zero quantity on adjust | `ValidationError` | 400 | Validate input |
| Deactivated product adjust | `ValidationError` | 400 | Check `active` before proceeding |

Frontend displays server errors via `error.message` from `api()` — code field errors shown inline, others as a banner.

## Implementation Order

1. **Seed update**: Add `"categories"` to `RESOURCES` in `prisma/seed.ts`
2. **Enum migration**: Run `ALTER TYPE "StockMovementType" ADD VALUE 'ADJUSTMENT'`
3. **Backend repository**: `products.repository.ts` — all Prisma queries
4. **Backend schema**: `products.schema.ts` — TypeBox types
5. **Backend service**: `products.service.ts` — business logic + code gen
6. **Backend routes**: `products.ts` + register in `app.ts`
7. **Frontend types**: `types/products.ts`
8. **Frontend components**: `StockAdjustModal.tsx`
9. **Frontend pages**: `ProductList`, `ProductForm`, `ProductDetail`
10. **Navigation**: Update `RootLayout.tsx` + `App.tsx` routes
11. **Test/verify**: End-to-end smoke test all endpoints and pages

## Open Questions

- None — all decisions resolved by specs and existing codebase patterns.
