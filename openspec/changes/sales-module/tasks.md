# Tasks: Sales Module

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~2000+ |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | 5 chained PRs (see below) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Base |
|------|------|-----------|------|
| 1 | Schema + numbering + currency + backend modules (service+repo) | PR #1 | main |
| 2 | Backend routes (quotes, orders, invoices) + app.ts wiring | PR #2 | main |
| 3 | Frontend types + StatusBadge/LineItemEditor + QuoteList/QuoteForm | PR #3 | main |
| 4 | OrderList + InvoiceList + QuoteDetail | PR #4 | main |
| 5 | OrderDetail + InvoiceDetail + AddPaymentModal + routing + nav | PR #5 | main |

## Phase 1: Schema + Libs

- [x] 1.1 Add `DocumentSequence` model (`@@unique([tenantId, prefix])`) + `Order.sourceQuoteId` to `prisma/schema.prisma`
- [x] 1.2 Create `apps/api/src/lib/currency.ts` — `decimalToNumber` / `numberToDecimal`
- [x] 1.3 Create `apps/api/src/lib/numbering.ts` — `getNextNumber` with atomic `upsert` on `@@unique`
- [x] 1.4 Run `pnpm db:migrate` — generate migration for DocumentSequence + sourceQuoteId

## Phase 2: Backend Modules

- [x] 2.1 Create `modules/quotes/quotes.repository.ts` + `quotes.service.ts` — CRUD, status machine, `convertToOrder`
- [x] 2.2 Create `modules/orders/orders.repository.ts` + `orders.service.ts` — CRUD, status machine
- [x] 2.3 Create `modules/invoices/invoices.repository.ts` + `invoices.service.ts` — CRUD, status machine, payment tracking

## Phase 3: Backend Routes + Wiring

- [x] 3.1 Create `routes/quotes.ts` — CRUD + `POST /:id/convert`
- [x] 3.2 Create `routes/orders.ts` — CRUD
- [x] 3.3 Create `routes/invoices.ts` — CRUD + `POST /:id/payments`
- [x] 3.4 Modify `app.ts` — register quotes, orders, invoices route modules

## Phase 4: Frontend Foundation

- [ ] 4.1 Create `types/sales.ts` — Quote/Order/Invoice/InvoicePayment interfaces + status unions
- [ ] 4.2 Create `pages/sales/components/StatusBadge.tsx` — colored pill per status
- [ ] 4.3 Create `pages/sales/components/LineItemEditor.tsx` — product autocomplete, qty/price, add/remove rows

## Phase 5: Quote Pages

- [ ] 5.1 Create `pages/sales/QuoteList.tsx` — table + status filter + StatusBadge column
- [ ] 5.2 Create `pages/sales/QuoteForm.tsx` — full-page form with LineItemEditor, customer autocomplete, save/send

## Phase 6: Order + Invoice Lists

- [ ] 6.1 Create `pages/sales/OrderList.tsx` — list with StatusBadge + sourceQuoteId link
- [ ] 6.2 Create `pages/sales/InvoiceList.tsx` — list with paid column (paidAmount / total)

## Phase 7: Detail Pages + Payments

- [ ] 7.1 Create `pages/sales/QuoteDetail.tsx` — info + line items table + action buttons per status (PR #4)
- [ ] 7.2 Create `pages/sales/OrderDetail.tsx` — info + line items + source quote link (PR #5)
- [ ] 7.3 Create `pages/sales/InvoiceDetail.tsx` — info + payments section + "Registrar Pago" button (PR #5)
- [ ] 7.4 Create `pages/sales/AddPaymentModal.tsx` — method dropdown, amount, reference (PR #5)

## Phase 8: Routing + Nav + Verify

- [ ] 8.1 Modify `App.tsx` — add 7 sales routes (`/sales/quotes/*`, `/sales/orders/*`, `/sales/invoices/*`)
- [ ] 8.2 Modify `RootLayout.tsx` — add "Ventas" group with sub-nav for quotes, orders, invoices
- [ ] 8.3 Verify: `pnpm build` passes, all routes accessible, all permissions enforced

