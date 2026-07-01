# Proposal: Products Module

## Intent

Enable inventory management — CRUD products with categories, initial stock on creation, and atomic stock adjustments. Products are foundational for purchasing, sales, and inventory modules.

## Scope

### In Scope
- Products CRUD (list, get, create, update, deactivate) + duplicate code validation
- Categories minimal CRUD (GET list, POST create, PATCH rename) for dropdown management
- Stock adjustment endpoint (`POST /products/:id/adjust-stock`) with atomic stock + StockMovement record
- Products frontend: paginated list with search, create/edit form, detail page
- "Inventario" nav section in RootLayout with "Productos" link
- Seed permissions: `products:{create,read,update,delete}` + `categories:{create,read,update}`

### Out of Scope
- StockMovement lifecycle (IN/OUT, warehouse)
- Categories list view / full CRUD frontend
- Product import/export, stock alerts/reports
- Quote/Order/Invoice product integration (already works via FK)

## Capabilities

### New Capabilities
- `products-api`: Full CRUD + stock adjustment with auth, validation, pagination
- `categories-api`: Minimal CRUD (list, create, rename)
- `products-frontend`: List, Form, and Detail pages

### Modified Capabilities
- `permissions-delta`: Add `products:*` and `categories:*` permission seeds

## Approach

- **Backend**: 3-layer module at `apps/api/src/modules/products/`. AuthGuard + TypeBox schemas. Prisma `$transaction` for stock adjustment.
- **Frontend**: TanStack Query + reusable components: `ProductList`, `ProductForm`, `ProductDetail`. Nav under "Inventario" in RootLayout.
- **Numbering**: Reuse `getNextNumber` with prefix `PRO-`. Auto-generate if empty or duplicate.
- **Stock**: Settable on create only. Adjust-stock creates StockMovement (`ADJUSTMENT`) and updates stock atomically.

## Affected Areas

| Area | Impact |
|------|--------|
| `apps/api/src/modules/products/` | New — module code |
| `apps/web/src/pages/products/` | New — 3 pages |
| `apps/web/src/components/layout/RootLayout.tsx` | Modified — nav section |
| `prisma/seed.ts` | Modified — permissions |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Code collision on concurrent create | Low | `$transaction` + unique + auto-generate fallback |
| Stock race condition | Low | Prisma `$transaction` with atomic read+update |
| Permissions drift if seed not re-run | Low | Document setup; incremental migration for production |

## Rollback Plan

1. Revert backend: delete module dir, remove route registration
2. Revert frontend: delete pages dir, restore `RootLayout.tsx` from git
3. Revert seed changes from git
4. No DB migration — schema already has all 3 models

## Dependencies

- `getNextNumber` (numbering.ts), auth guard (guards/auth.ts), Prisma models — all already exist

## Success Criteria

- [ ] 5 product endpoints respond with auth, pagination, validation
- [ ] Create product with initial stock works end-to-end
- [ ] Adjust-stock atomically creates StockMovement + updates stock
- [ ] List renders paginated products with search
- [ ] Form creates/edits; detail shows info + edit/deactivate
- [ ] Nav shows "Inventario > Productos"
- [ ] Permissions seeded: admin all, user read-only
