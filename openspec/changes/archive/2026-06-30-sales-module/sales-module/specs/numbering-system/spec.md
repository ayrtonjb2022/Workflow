# Numbering System Specification

## Purpose

Sequential document number generation per tenant with concurrency-safe locking. Supports prefixes COT (quotes), PED (orders), FAC (invoices).

## Requirements

| # | Requirement | Strength | Description |
|---|-------------|----------|-------------|
| R1 | Sequence model | MUST | Expose `DocumentSequence` with fields: `tenantId`, `prefix`, `counter`, `updatedAt` |
| R2 | getNextNumber | MUST | Accept `(tenantId, prefix)`, return formatted `"{prefix}-{counter}"` padded to 5 digits |
| R3 | Concurrency | MUST | Use `$transaction` with `SELECT ... FOR UPDATE` row-level lock |
| R4 | Counter init | MUST | Start at 1 when no sequence record exists for that tenant+prefix |
| R5 | Format | MUST | Counter zero-padded to 5 digits: `COT-00001`, `PED-00042`, `FAC-99999` |
| R6 | Tenant isolation | MUST | Counters are independent per tenant |

### Scenario: First number for a tenant+prefix

- GIVEN no `DocumentSequence` record exists for tenant `T1` and prefix `COT`
- WHEN `getNextNumber("T1", "COT")` is called
- THEN a new sequence record is created with counter 1
- AND the function returns `"COT-00001"`

### Scenario: Subsequent numbers increment

- GIVEN a `DocumentSequence` for tenant `T1`, prefix `PED` with counter 5
- WHEN `getNextNumber("T1", "PED")` is called
- THEN the counter is incremented to 6
- AND the function returns `"PED-00006"`

### Scenario: Concurrent requests produce unique numbers

- GIVEN two concurrent `getNextNumber("T1", "FAC")` calls
- WHEN both acquire the row lock sequentially
- THEN they return `"FAC-00001"` and `"FAC-00002"` respectively
- AND no duplicate numbers are produced

### Scenario: Tenant isolation

- GIVEN tenants `T1` and `T2`, both at counter 3 for prefix `COT`
- WHEN `getNextNumber` is called for each
- THEN `T1` returns `"COT-00004"` and `T2` returns `"COT-00004"`
- AND no cross-tenant counter interference occurs
