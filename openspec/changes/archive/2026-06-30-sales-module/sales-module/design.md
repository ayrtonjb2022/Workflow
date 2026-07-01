# Design: Sales Module

## Technical Approach

Service-Repository pattern over Fastify + Prisma, mirroring existing `users`/`roles` modules. Each document type (quote/order/invoice) gets its own service+repository pair. Numbering uses a dedicated `DocumentSequence` model with atomic `update` inside a Prisma transaction — Prisma's `update` on a unique composite key provides row-level locking. Decimal fields converted to `number` at the service boundary. Frontend follows established `CustomerList`/`CustomerDetail` patterns with shared UI components.

## Schema Changes

Add to `prisma/schema.prisma`:

| Model | Fields | Notes |
|-------|--------|-------|
| `DocumentSequence` | `id`, `tenantId`, `prefix`, `counter`, `updatedAt` | `@@unique([tenantId, prefix])` |
| `Order.sourceQuoteId` | Optional String → `Quote` relation | `@map("source_quote_id")` |

No Invoice-to-Order relation needed — invoice seeding copies data without persisting the reference (per spec).

## Architecture Decisions

| Option | Tradeoff | Decision |
|--------|----------|----------|
| `$transaction` + raw `FOR UPDATE` vs Prisma `update` on unique key | Raw SQL locks explicitly; Prisma's `update` on `@@unique` is also atomic for this use case | Prisma `update` — follows existing codebase pattern of no raw SQL |
| Separate service per doc type vs single `sales.service.ts` | Separate = more files but clearer boundaries; single = less repetition but harder to evolve | One per doc type — matches existing module structure |
| Decimal→number in service vs route layer | Service is closer to Prisma output; routes should be thin | Convert in service before returning — cleaner route handlers |
| Status machine logic in service vs repository | Service has business knowledge; repository is data access only | Status-transition methods in service (e.g. `send()`, `accept()`) — repository only updates the field |

## Data Flow

```
Client → Fastify Route → authGuard → Service → Repository → Prisma → PostgreSQL
                              │
                    config.requiredPermission
                          
Service flow (create):
  1. Validate input (TypeBox schema in route)
  2. Call getNextNumber(tenantId, prefix) — atomic counter
  3. Calculate line subtotals, header totals
  4. Prisma transaction: create doc + items
  5. Convert Decimal → number, return response
```

## Backend File Design

### `lib/numbering.ts`
```ts
async function getNextNumber(tenantId: string, prefix: string): Promise<string>
```
- Uses `prisma.$transaction` to `upsert` DocumentSequence (create with counter=1 or increment existing)
- Prisma's `upsert` on `@@unique([tenantId, prefix])` is atomic — acts as `SELECT ... FOR UPDATE` equivalent
- Returns `"${prefix}-${String(counter).padStart(5, '0')}"`

### `lib/currency.ts`
```ts
function decimalToNumber(d: Decimal): number    // Decimal → JS number
function numberToDecimal(n: number): Decimal     // JS number → Prisma Decimal
```

### Module pattern (per doc type)
```
quotes.service.ts   → quotesRepository + numbering + currency helpers
quotes.repository.ts → Prisma queries with 'items' includes, pagination helpers
```
Status methods follow this pattern:
```ts
async send(id: string, tenantId: string) {
  const quote = await this.repository.findById(id, tenantId)
  if (!quote) throw new NotFoundError("Quote")
  if (quote.status !== "DRAFT") throw new ValidationError("Only DRAFT quotes can be sent")
  return this.repository.updateStatus(id, "SENT")
}
```

`convertToOrder`: single Prisma transaction that reads Quote+items, creates Order+items via ordersRepository, updates quote to ACCEPTED.

### Route pattern (per doc type)
Follows `routes/users.ts` exactly:
- `app.addHook("preHandler", app.authGuard)`
- Each route has `config: { requiredPermission: "resource:action" }`
- TypeBox schemas for body/params/querystring
- Decimal fields returned as `number` (converted in service layer)

## Frontend Design

### Types (`types/sales.ts`)
```ts
type QuoteStatus = "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED"
type OrderStatus = "DRAFT" | "SENT" | "PAID" | "CANCELLED"  
type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "CANCELLED"

interface Quote { id, tenantId, customerId, number, date, status, subtotal, tax, total, notes, customer, items, createdAt, updatedAt }
interface QuoteItem { id, productId, quantity, unitPrice, subtotal, product }
interface Order { /* same + sourceQuoteId */ }
interface Invoice { /* same + payments */ }
interface InvoicePayment { id, invoiceId, method, amount, reference, createdAt }
interface PaginatedResponse<T> { data, total, page, limit, totalPages } // shared
```

### Pages
| Page | Pattern source | Key specifics |
|------|---------------|---------------|
| `QuoteList.tsx` | `CustomerList.tsx` | + status filter dropdown, StatusBadge col |
| `QuoteDetail.tsx` | `CustomerDetail.tsx` | + action buttons per status, line items table |
| `QuoteForm.tsx` | New (no modal — full page) | Customer autocomplete, line item editor, save/send buttons |
| `OrderList.tsx` | Same list pattern | StatusBadge, sourceQuoteId link |
| `OrderDetail.tsx` | Detail pattern | Source quote link if converted |
| `InvoiceList.tsx` | List pattern | + paid column `paidAmount / total` |
| `InvoiceDetail.tsx` | Detail pattern | + payments section, "Registrar Pago" button |
| `AddPaymentModal.tsx` | `CreateCustomerModal.tsx` | Method dropdown, amount, reference |

### Shared components
- `StatusBadge.tsx` — colored pill per status value
- `LineItemEditor.tsx` — product autocomplete via existing products API, qty/price/subtotal per row, add/remove

### Routes added to App.tsx
```tsx
{ path: "/sales/quotes", element: <QuoteList /> },
{ path: "/sales/quotes/new", element: <QuoteForm /> },
{ path: "/sales/quotes/:id", element: <QuoteDetail /> },
{ path: "/sales/orders", element: <OrderList /> },
{ path: "/sales/orders/:id", element: <OrderDetail /> },
{ path: "/sales/invoices", element: <InvoiceList /> },
{ path: "/sales/invoices/:id", element: <InvoiceDetail /> },
```

### Nav update (RootLayout.tsx)
Replace flat `navLinks` with grouped structure: "Ventas" accordion or sub-nav with "Cotizaciones", "Pedidos", "Facturas".

## Seed / Permissions

The `RESOURCES` array in `prisma/seed.ts` already includes `"quotes"`, `"orders"`, `"invoices"` — no change needed. Existing seed generates all 12 permissions and assigns them to admin/user roles on next run. The permissions-delta spec is already satisfied.

## File Changes

| File | Action |
|------|--------|
| `prisma/schema.prisma` | Modify — add DocumentSequence model, add sourceQuoteId to Order |
| `apps/api/src/lib/numbering.ts` | Create |
| `apps/api/src/lib/currency.ts` | Create |
| `apps/api/src/modules/quotes/quotes.service.ts` | Create |
| `apps/api/src/modules/quotes/quotes.repository.ts` | Create |
| `apps/api/src/modules/orders/orders.service.ts` | Create |
| `apps/api/src/modules/orders/orders.repository.ts` | Create |
| `apps/api/src/modules/invoices/invoices.service.ts` | Create |
| `apps/api/src/modules/invoices/invoices.repository.ts` | Create |
| `apps/api/src/routes/quotes.ts` | Create |
| `apps/api/src/routes/orders.ts` | Create |
| `apps/api/src/routes/invoices.ts` | Create |
| `apps/api/src/app.ts` | Modify — register 3 new route modules |
| `apps/web/src/types/sales.ts` | Create |
| `apps/web/src/pages/sales/QuoteList.tsx` | Create |
| `apps/web/src/pages/sales/QuoteDetail.tsx` | Create |
| `apps/web/src/pages/sales/QuoteForm.tsx` | Create |
| `apps/web/src/pages/sales/OrderList.tsx` | Create |
| `apps/web/src/pages/sales/OrderDetail.tsx` | Create |
| `apps/web/src/pages/sales/InvoiceList.tsx` | Create |
| `apps/web/src/pages/sales/InvoiceDetail.tsx` | Create |
| `apps/web/src/pages/sales/AddPaymentModal.tsx` | Create |
| `apps/web/src/pages/sales/components/LineItemEditor.tsx` | Create |
| `apps/web/src/pages/sales/components/StatusBadge.tsx` | Create |
| `apps/web/src/App.tsx` | Modify — add 7 sales routes |
| `apps/web/src/components/layout/RootLayout.tsx` | Modify — add Ventas nav sub-items |

## Testing Strategy

| Layer | What | How |
|-------|------|-----|
| Unit | `getNextNumber` atomicity, status transitions, total calculation | Vitest with mocked Prisma |
| Integration | Quote→Order conversion, invoice partial→full payment, status guard (409) | Fastify `inject()` with test DB |
| Integration | Permission enforcement per route | authGuard mock → assert 403 |
| E2E | Full flow: create quote → send → convert → pay invoice | Playwright or manual |

## Migrations

Add a new Prisma migration for DocumentSequence + Order.sourceQuoteId. Existing data unaffected — no backfill needed.

## Open Questions

- None.
