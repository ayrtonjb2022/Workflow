# Stock Adjustment Specification

**Domain**: `stock-adjustment`

## Purpose

Provide an atomic stock adjustment endpoint that creates a `StockMovement` record AND updates the product stock in a single database transaction. This replaces the need to directly modify `stock` via the update endpoint.

## Schema Changes

| Change | Detail |
|--------|--------|
| `StockMovementType` enum | ADD `ADJUSTMENT` to the existing `StockMovementType` enum (currently `IN`, `OUT`). Migration: `ALTER TYPE "StockMovementType" ADD VALUE 'ADJUSTMENT'`. |

## Requirements

| # | Requirement | Strength | Description |
|---|-------------|----------|-------------|
| R1 | Adjust stock endpoint | MUST | `POST /api/products/:id/adjust-stock` with `{ quantity: number, reason?: string }`. `quantity` is a signed integer — positive increases stock, negative decreases. |
| R2 | Atomic transaction | MUST | Both the `StockMovement` creation and the product `stock` update MUST occur inside a Prisma `$transaction`. If either fails, both roll back. |
| R3 | StockMovement record | MUST | Every adjustment creates a `StockMovement` with `type = ADJUSTMENT`, `quantity = |quantity|`, `reference = reason` (optional), `warehouseId = null` (no warehouse support yet). |
| R4 | Stock update | MUST | Product stock is updated by adding `quantity` to the current stock value. Decrease below zero is rejected. |
| R5 | Negative stock guard | MUST | If `currentStock + quantity < 0`, return `400 Bad Request` with a descriptive error. |
| R6 | Product existence | MUST | Return `404 Not Found` if the product does not exist in the tenant or is deactivated. |
| R7 | Deactivated product guard | MUST | Refuse adjustment for `active: false` products — return `400 Bad Request`. |
| R8 | Tenant isolation | MUST | Scope all queries to `request.tenantId`. |
| R9 | Permissions | MUST | Enforce `products:update` on the adjust-stock endpoint. |
| R10 | Warehouse | MUST NOT | `warehouseId` is NOT exposed yet. The `StockMovement.warehouseId` field is set to `null`. Future warehouse module will extend this. |
| R11 | Document sequence | MUST NOT | Stock adjustments do NOT generate document numbers. |

### StockMovement record shape (created on adjustment)

```
productId:    string      // the product being adjusted
tenantId:     string      // from request context
warehouseId:  null        // not supported yet
type:         "ADJUSTMENT"
quantity:     number      // absolute value (always positive)
reference:    string|null // user-provided reason
```

### Scenario: Successful stock increase

- GIVEN product `P1` with `stock = 10`
- WHEN `POST /api/products/P1/adjust-stock` with `{ quantity: 5, reason: "Inventory recount" }`
- THEN within a `$transaction`:
  - A `StockMovement` is created with `type = ADJUSTMENT`, `quantity = 5`, `reference = "Inventory recount"`
  - `P1.stock` is updated to `15`
- AND response is `200 OK` with the updated product

### Scenario: Successful stock decrease

- GIVEN product `P1` with `stock = 10`
- WHEN `POST /api/products/P1/adjust-stock` with `{ quantity: -3, reason: "Damaged" }`
- THEN within a `$transaction`:
  - A `StockMovement` is created with `type = ADJUSTMENT`, `quantity = 3`, `reference = "Damaged"`
  - `P1.stock` is updated to `7`
- AND response is `200 OK`

### Scenario: Decrease below zero is rejected

- GIVEN product `P1` with `stock = 2`
- WHEN `POST /api/products/P1/adjust-stock` with `{ quantity: -5 }`
- THEN the system returns `400 Bad Request`
- AND no `StockMovement` is created
- AND `P1.stock` remains `2`

### Scenario: Zero quantity is rejected

- GIVEN product `P1` with `stock = 10`
- WHEN `POST /api/products/P1/adjust-stock` with `{ quantity: 0 }`
- THEN the system returns `400 Bad Request`

### Scenario: Deactivated product is rejected

- GIVEN product `P1` with `active = false`
- WHEN `POST /api/products/P1/adjust-stock` with `{ quantity: 5 }`
- THEN the system returns `400 Bad Request`

### Scenario: Non-existent product returns 404

- GIVEN no product with ID `invalid-id` exists in the tenant
- WHEN `POST /api/products/invalid-id/adjust-stock` with `{ quantity: 5 }`
- THEN the system returns `404 Not Found`

### Scenario: Concurrent adjustments are serialized by the transaction

- GIVEN product `P1` with `stock = 10`
- WHEN two concurrent `POST /api/products/P1/adjust-stock` calls arrive: `{ quantity: -8 }` and `{ quantity: -5 }`
- THEN one succeeds (stock becomes `2` or `5`)
- AND the other returns `400 Bad Request` (stock would go below zero)
- AND exactly one `StockMovement` record is created for the successful adjustment
