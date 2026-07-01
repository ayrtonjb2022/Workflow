# Proposal: Sales Module — Full Quote → Order → Invoice Workflow

## Intent

Enable the complete sales cycle: create quotes, convert accepted quotes to orders, and manage invoices with payment tracking. Currently the Prisma schema exists but no backend modules, routes, or frontend screens implement the workflow.

## Scope

### In Scope
- Sequential document numbering per tenant (COT-00001, PED-00001, FAC-00001)
- Quotes API: CRUD + status transitions + convert to order
- Orders API: CRUD + status transitions (DRAFT→SENT→PAID/CANCELLED)
- Invoices API: CRUD + status transitions + partial/full payments
- Frontend: list/detail screens for quotes, orders, invoices
- Quote create/edit form with line item editor
- 12 CRUD permissions (quotes:*, orders:*, invoices:*)

### Out of Scope (Non-goals)
- PDF generation
- Email sending
- Reports or dashboard
- Stock decrement on order/invoice
- Recurring invoices

## Capabilities

### New Capabilities
- **numbering-system**: Sequential numbering via `Sequence` model (`FOR UPDATE` locking). Prefixes: COT (quotes), PED (orders), FAC (invoices).
- **quotes-api**: CRUD + status machine (DRAFT↔SENT→ACCEPTED/REJECTED) + `POST /quotes/:id/convert` creates an order from quote items.
- **orders-api**: CRUD + status machine (DRAFT↔SENT→PAID/CANCELLED).
- **invoices-api**: CRUD + status machine (DRAFT↔SENT→PAID/CANCELLED) + `POST /invoices/:id/payments` for partial/full payments via `InvoicePayment`.
- **sales-frontend**: Quote list/detail, Order list/detail, Invoice list/detail with line items, status badges, and action buttons.
- **quote-form**: Create/edit form with line item editor (product autocomplete, quantity, unit price, auto-calculated subtotals).
- **permissions**: Seed 12 permission records (`quotes:create/read/update/delete`, `orders:create/read/update/delete`, `invoices:create/read/update/delete`).

## Approach

Use existing singleton module pattern (`modules/{domain}/service + repository`), route files with authGuard + TypeBox, and frontend TanStack Query + `api()` wrapper. Add a `Sequence` table to Prisma, then build modules bottom-up: numbering → quotes → orders → invoices. Frontend uses shared UI components (`Table`, `Button`, `Input`, `Modal`, `SearchBar`, `Pagination`).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Modified | Add `Sequence` model |
| `apps/api/src/modules/sequence/` | New | Numbering service + repository |
| `apps/api/src/modules/quotes/` | New | Quote service + repository |
| `apps/api/src/modules/orders/` | New | Order service + repository |
| `apps/api/src/modules/invoices/` | New | Invoice service + repository |
| `apps/api/src/routes/quotes.ts` | New | Quotes REST routes |
| `apps/api/src/routes/orders.ts` | New | Orders REST routes |
| `apps/api/src/routes/invoices.ts` | New | Invoices REST routes |
| `apps/api/src/app.ts` | Modified | Register new routes |
| `apps/web/src/pages/sales/` | New | 7+ pages (list/detail/form) |
| `apps/web/src/hooks/` | New | TanStack Query hooks for sales |
| `apps/web/src/lib/api/` | New | Sales API client functions |
| `apps/web/src/types/` | New | Sales TypeScript types |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `FOR UPDATE` deadlock on concurrent numbering | Low | Keep tx short; single-row lock on `Sequence` |
| Convert-to-order duplicates under race | Low | Check order existence via `quoteId` FK before creating |
| Decimal precision inconsistencies | Low | Prisma `Decimal` + round at service boundary |

## Rollback Plan

1. Revert `app.ts` route registrations.
2. Delete `modules/sequence/`, `modules/quotes/`, `modules/orders/`, `modules/invoices/`.
3. Delete `routes/quotes.ts`, `routes/orders.ts`, `routes/invoices.ts`.
4. Revert `prisma/schema.prisma` `Sequence` addition.
5. Delete frontend `pages/sales/` and hooks.
6. Run migration down or create a revert migration.

## Dependencies

- Permission system (core-auth) already seeded and working
- Shared UI components (Table, Button, Input, Modal, SearchBar, Pagination) already exist
- `api()` wrapper already working in frontend

## Success Criteria

- [ ] All 7 capabilities accepted as delivered by stakeholder review
- [ ] All 12 permission records seeded and enforced on every route
- [ ] Quote→Order conversion creates a complete order with matching line items
- [ ] Invoice payments correctly track paid amount (partial + full)
- [ ] Document numbers are sequential and unique per tenant
- [ ] Estimated **25–30 files** across backend + frontend
