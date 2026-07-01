# Quotes API Specification

## Requirements

| # | Requirement | Strength | Description |
|---|-------------|----------|-------------|
| R1 | Create quote | MUST | Accept header fields + items array; server calculates `subtotal = quantity * unitPrice`, header sums `subtotal`, `tax` (configurable rate), `total` |
| R2 | List quotes | MUST | `GET /api/quotes?page=&limit=&search=&status=` with pagination |
| R3 | Get quote | MUST | `GET /api/quotes/:id` returns quote with items and customer info |
| R4 | Update quote | MUST | `PATCH /api/quotes/:id` — ONLY allowed in DRAFT status, reject otherwise with 409 |
| R5 | Delete quote | MUST | `DELETE /api/quotes/:id` — cascade deletes items |
| R6 | Status machine | MUST | DRAFT → SENT → ACCEPTED / REJECTED / EXPIRED. Transitions are one-way |
| R7 | Convert to order | MUST | `POST /api/quotes/:id/convert` creates Order + OrderItems, sets quote to ACCEPTED. Must be transactional |
| R8 | Convert guard | MUST | Convert fails with 409 if quote status is not SENT |
| R9 | Search | MUST | Filter by `number` (partial match) or `customer.name` (partial match) |
| R10 | Customer info | MUST | Include `customer` (`id`, `name`, `email`) in every response |
| R11 | Permissions | MUST | Enforce `quotes:create/read/update/delete` on corresponding routes. Convert requires `quotes:update` |
| R12 | Numbering | MUST | Auto-assign number via `getNextNumber(tenantId, "COT")` on CREATE |

### Scenario: Create quote with two items

- GIVEN a valid customer and two products with unit prices
- WHEN `POST /api/quotes` is sent with header fields and `items: [{productId, quantity, unitPrice}]`
- THEN a new Quote is created with DRAFT status
- AND items have calculated subtotals, and quote has calculated subtotal/tax/total
- AND the number is `"COT-00001"` (or next in sequence)

### Scenario: Update rejected when not DRAFT

- GIVEN a quote in SENT status
- WHEN `PATCH /api/quotes/:id` is called with updated data
- THEN the API returns 409 Conflict
- AND the quote remains unchanged

### Scenario: Convert SENT quote to order

- GIVEN a quote in SENT status with 3 line items
- WHEN `POST /api/quotes/:id/convert` is called
- THEN a new Order is created with all 3 items copied
- AND the quote status transitions to ACCEPTED
- AND the order number is `"PED-00001"` (or next in sequence)

### Scenario: Convert non-SENT quote fails

- GIVEN a quote in DRAFT status
- WHEN `POST /api/quotes/:id/convert` is called
- THEN the API returns 409 Conflict
- AND no Order is created

### Scenario: Search quotes by customer name

- GIVEN quotes for customers "Carlos" and "María"
- WHEN `GET /api/quotes?search=Carlos` is called
- THEN only quotes where customer name contains "Carlos" are returned
