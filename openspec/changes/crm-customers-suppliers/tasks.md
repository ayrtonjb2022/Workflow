# Tasks: CRM — Customers & Suppliers

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~700-900 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR #1: Foundation + Customers + Contacts | PR #2: Suppliers + Wiring + Verify |
| Delivery strategy | auto-forecast |
| Chain strategy | feature-branch-chain |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | PR | Notes |
|------|------|----|-------|
| 1 | Prisma + deps + Excel util + Customers module + Contacts module + customers route | PR #1 | Base: main. Includes migration, seed, xlsx, contacts (needed by customers route), export/import endpoints. ~350-450 lines |
| 2 | Suppliers module + route + app wiring + typecheck + lint | PR #2 | Base: main. Depends on PR #1 only for the patterns being established. ~250-350 lines |

## Phase 1: Prisma + deps

- [x] 1.1 Add `Supplier` model to `prisma/schema.prisma` (mirrors Customer, optional documentType, no unique on email/doc)
- [x] 1.2 Add `"suppliers"` to RESOURCES array in `prisma/seed.ts`
- [x] 1.3 Run `pnpm prisma generate` — migration deferred (DB not available in this environment, schema change applied)
- [x] 1.4 `xlsx` (SheetJS) already installed — no action needed

## Phase 2: Excel utility

- [x] 2.1 Create `apps/api/src/lib/excel.ts` with `exportToExcel()`, `parseExcel()`, `validateCustomerRow()`, `validateSupplierRow()`

## Phase 3: Customers module

- [x] 3.1 Create `apps/api/src/modules/customers/customers.repository.ts` — findAll (paginated + search), findById, findByEmail, findByDocument, create, update, deactivate
- [x] 3.2 Create `apps/api/src/modules/customers/customers.service.ts` — list, get, create (check duplicate email/doc), update, deactivate. All tenant-scoped with 404 on miss
- [x] 3.3 Create `apps/api/src/modules/contacts/contacts.repository.ts` — findByCustomer, findByIdWithCustomer, create, hardDelete
- [x] 3.4 Create `apps/api/src/modules/contacts/contacts.service.ts` — list, get, create, delete. Verify parent customer exists in tenant (404 if not)
- [x] 3.5 Create `apps/api/src/routes/customers.ts` — GET/POST/PATCH/DELETE /api/customers, GET /api/customers/export, POST /api/customers/import, nested contacts endpoints

## Phase 4: Suppliers module

- [ ] 4.1 Create `apps/api/src/modules/suppliers/suppliers.repository.ts` — (PR #2)
- [ ] 4.2 Create `apps/api/src/modules/suppliers/suppliers.service.ts` — (PR #2)
- [ ] 4.3 Create `apps/api/src/routes/suppliers.ts` — (PR #2)

## Phase 5: App wiring

- [x] 5.1 Register `customerRoutes` in `apps/api/src/app.ts` under `/api` prefix (supplierRoutes deferred to PR #2)

## Phase 6: Verification

- [x] 6.1 Run `pnpm typecheck` — fixed all type errors
- [x] 6.2 Run `pnpm lint` — fixed all lint warnings
