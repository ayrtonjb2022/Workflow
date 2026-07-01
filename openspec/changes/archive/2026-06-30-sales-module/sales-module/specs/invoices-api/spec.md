# Invoices API Specification

## Requirements

| # | Requirement | Strength | Description |
|---|-------------|----------|-------------|
| R1 | Create invoice | MUST | `POST /api/invoices` — header fields + items array, server calculates totals |
| R2 | Create from order | MUST | Accept optional `orderId` body field to seed invoice from existing order |
| R3 | List invoices | MUST | `GET /api/invoices?page=&limit=&search=&status=` with pagination |
| R4 | Get invoice | MUST | `GET /api/invoices/:id` returns invoice with items, customer info, and payments |
| R5 | Update invoice | MUST | `PATCH /api/invoices/:id` — ONLY allowed in DRAFT status |
| R6 | Status machine | MUST | DRAFT → SENT → PAID / CANCELLED. PAID is set automatically when `paidAmount >= total` |
| R7 | Add payment | MUST | `POST /api/invoices/:id/payments` — accepts `{ method, amount, reference? }` |
| R8 | List payments | MUST | `GET /api/invoices/:id/payments` returns all payments for the invoice |
| R9 | Auto-status | MUST | After each payment, if `SUM(payments.amount) >= total`, auto-transition to PAID |
| R10 | Partial payment | MUST | Allow payments less than the total; keep status at SENT until fully paid |
| R11 | Permissions | MUST | Enforce `invoices:create/read/update/delete` on routes |
| R12 | Numbering | MUST | Auto-assign number via `getNextNumber(tenantId, "FAC")` on CREATE |

### Scenario: Create invoice from scratch

- GIVEN a customer and two products
- WHEN `POST /api/invoices` is sent with header fields and items array
- THEN a new Invoice is created in DRAFT status
- AND assigned number `"FAC-00001"`

### Scenario: Add partial payment

- GIVEN an invoice in SENT status with total 1500.00
- WHEN `POST /api/invoices/:id/payments` is sent with `{ method: "cash", amount: 500.00 }`
- THEN a payment record is created with amount 500.00
- AND the invoice status remains SENT (500 < 1500)

### Scenario: Full payment triggers PAID status

- GIVEN an invoice in SENT status with total 1000.00 and an existing payment of 600.00
- WHEN `POST /api/invoices/:id/payments` is sent with `{ method: "transfer", amount: 400.00 }`
- THEN the cumulative paid amount reaches 1000.00
- AND the invoice status transitions to PAID

### Scenario: Update rejected when in SENT

- GIVEN an invoice in SENT status
- WHEN `PATCH /api/invoices/:id` is called
- THEN 409 Conflict is returned
