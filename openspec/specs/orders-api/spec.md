# Orders API Specification

## Requirements

| # | Requirement | Strength | Description |
|---|-------------|----------|-------------|
| R1 | Create order | MUST | `POST /api/orders` — accepts header fields + items array, server calculates totals |
| R2 | Create from quote | MUST | Accept optional `quoteId` body field. When provided, copy all items and header data from the source quote |
| R3 | Source quote reference | MUST | If created from quote, include `sourceQuoteId` in the response |
| R4 | List orders | MUST | `GET /api/orders?page=&limit=&search=&status=` with pagination |
| R5 | Get order | MUST | `GET /api/orders/:id` returns order with items and customer info |
| R6 | Update order | MUST | `PATCH /api/orders/:id` — ONLY allowed in DRAFT status |
| R7 | Status machine | MUST | DRAFT → SENT → PAID / CANCELLED. Transitions are one-way |
| R8 | Delete | SHOULD | `DELETE /api/orders/:id` — only in DRAFT status, cascade deletes items |
| R9 | Search | MUST | Filter by `number` or `customer.name` partial match |
| R10 | Permissions | MUST | Enforce `orders:create/read/update/delete` on corresponding routes |
| R11 | Numbering | MUST | Auto-assign number via `getNextNumber(tenantId, "PED")` on CREATE |

### Scenario: Create order from scratch

- GIVEN a valid customer and product data
- WHEN `POST /api/orders` is sent without `quoteId`
- THEN a new Order is created in DRAFT status with calculated totals
- AND assigned number `"PED-00001"`

### Scenario: Create order from quote conversion

- GIVEN an existing quote (already ACCEPTED) with items and header data
- WHEN `POST /api/orders` is sent with `{ quoteId: "..." }`
- THEN a new Order is created with items copied from the quote
- AND the response includes `sourceQuoteId` matching the quote
- AND the order has a new sequential number

### Scenario: Update rejected when not DRAFT

- GIVEN an order in SENT status
- WHEN `PATCH /api/orders/:id` is called
- THEN 409 Conflict is returned

### Scenario: Transition to PAID

- GIVEN an order in SENT status
- WHEN `PATCH /api/orders/:id` is called with `{ status: "PAID" }`
- THEN the order status becomes PAID

### Scenario: Search orders by number

- GIVEN orders with numbers `"PED-00005"` and `"PED-00010"`
- WHEN `GET /api/orders?search=PED-00005` is called
- THEN only the matching order is returned
