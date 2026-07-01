# Archive Report: sales-module

**Archived**: 2026-06-30
**Status**: intentional-with-warnings
**Warning**: `verify-report.md` artifact was not created during the SDD cycle. All 78 tasks are marked complete in `tasks.md` and 5 feature-branch-chain PRs were merged. Archive proceeded per user instruction.

---

## Change Summary

**What was built**: Full sales workflow — Quote → Order → Invoice with payment tracking. Includes sequential document numbering per tenant (COT, PED, FAC prefixes), CRUD APIs with status machines for each document type, quote-to-order conversion, partial/full invoice payments, and frontend list/detail/form pages with shared UI components.

**Capabilities delivered**:
1. **numbering-system** — Sequential numbering via `DocumentSequence` model with atomic `upsert` on `@@unique([tenantId, prefix])`
2. **quotes-api** — CRUD + status machine (DRAFT↔SENT→ACCEPTED/REJECTED/EXPIRED) + `POST /quotes/:id/convert`
3. **orders-api** — CRUD + status machine (DRAFT↔SENT→PAID/CANCELLED)
4. **invoices-api** — CRUD + status machine (DRAFT↔SENT→PAID/CANCELLED) + `POST /invoices/:id/payments` for partial/full payments
5. **sales-frontend** — Quote/Order/Invoice list/detail pages with StatusBadge, SearchBar, Pagination
6. **quote-form** — Full-page create/edit form with LineItemEditor (product autocomplete, real-time subtotals)
7. **permissions-delta** — 12 permission records seeded (quotes:*/orders:*/invoices:* CRUD)

---

## Artifact Inventory

| Artifact | Path | Status |
|----------|------|--------|
| Proposal | `openspec/changes/archive/2026-06-30-sales-module/proposal.md` | ✅ |
| Specs | `openspec/changes/archive/2026-06-30-sales-module/specs/` | ✅ 7 delta specs |
| Design | `openspec/changes/archive/2026-06-30-sales-module/design.md` | ✅ |
| Tasks | `openspec/changes/archive/2026-06-30-sales-module/tasks.md` | ✅ 78/78 tasks complete |
| Verify Report | *(not created)* | ❌ Missing — intentional partial archive |

### Delta Specs — 7 domains

| Domain | Requirements | Scenarios |
|--------|-------------|-----------|
| numbering-system | 6 requirements (R1–R6) | 4 scenarios |
| quotes-api | 12 requirements (R1–R12) | 5 scenarios |
| orders-api | 11 requirements (R1–R11) | 5 scenarios |
| invoices-api | 12 requirements (R1–R12) | 4 scenarios |
| permissions-delta | 6 requirements (R1–R6) | 3 scenarios |
| quote-form | 15 requirements (R1–R15) | 3 scenarios |
| sales-frontend | 12 requirements (R1–R12) | 3 scenarios |
| **Total** | **74 requirements** | **27 scenarios** |

---

## Implementation Stats

| Metric | Value |
|--------|-------|
| Feature commits | 12 (in the sales-module range) |
| Total commits (inc. chore/docs) | 16 |
| Files created/modified | 31 unique paths |
| Feature PRs | 5 (feature-branch-chain) |
| PR split | Schema+libs → Backend modules → Routes → Frontend foundation → Detail pages + nav |
| Backend files | ~15 (libs, modules, routes, app.ts wiring) |
| Frontend files | ~16 (types, pages, components, hooks, routing, nav) |
| Tasks completed | 78/78 (8 phases) |

### Commit Log (feature commits)

```
a854e6b feat(db): add DocumentSequence model, Order.sourceQuoteId, and numbering/currency libs
59bc3dc feat(api): add quotes module with CRUD, status machine, and convertToOrder
61e9bf0 feat(api): add orders module with CRUD, status machine, and createFromQuote
2f35906 feat(api): add invoices module with CRUD, status machine, and payment tracking
fa056d0 feat(api): add quote, order, and invoice routes with authGuard and TypeBox schemas
6821008 feat(web): add HTTP client and shared UI primitives (Button, Table, Pagination, SearchBar, Input, Modal)
192c8ec feat(web): add sales module types and shared components (StatusBadge, LineItemEditor)
b70cfa7 feat(web): implement QuoteList and QuoteForm pages
01b9390 feat(web): add OrderList page with search, status filter, and pagination
50e26ea feat(web): add InvoiceList page with paid balance column
92fd157 feat(web): add QuoteDetail page with info, items table, and action buttons
cfafc77 feat(sales): add OrderDetail, InvoiceDetail and AddPaymentModal pages
4d2c8a5 feat(sales): wire sales routes in App.tsx and add Ventas navigation in RootLayout
```

---

## Spec Promotion

All 7 delta specs were new domains (no existing main specs). They were promoted directly:

| Domain | Source | Destination | Action |
|--------|--------|-------------|--------|
| numbering-system | delta spec | `openspec/specs/numbering-system/spec.md` | Created |
| quotes-api | delta spec | `openspec/specs/quotes-api/spec.md` | Created |
| orders-api | delta spec | `openspec/specs/orders-api/spec.md` | Created |
| invoices-api | delta spec | `openspec/specs/invoices-api/spec.md` | Created |
| permissions-delta | delta spec | `openspec/specs/permissions-delta/spec.md` | Created |
| quote-form | delta spec | `openspec/specs/quote-form/spec.md` | Created |
| sales-frontend | delta spec | `openspec/specs/sales-frontend/spec.md` | Created |

---

## Source of Truth

The following main specs now reflect the sales module behavior:
- `openspec/specs/numbering-system/spec.md`
- `openspec/specs/quotes-api/spec.md`
- `openspec/specs/orders-api/spec.md`
- `openspec/specs/invoices-api/spec.md`
- `openspec/specs/permissions-delta/spec.md`
- `openspec/specs/quote-form/spec.md`
- `openspec/specs/sales-frontend/spec.md`

---

## SDD Cycle Complete

The change has been fully planned, implemented, and archived. Ready for the next change.
