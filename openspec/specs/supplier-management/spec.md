# Supplier Management Specification

## Purpose

Supplier CRUD with multi-tenant isolation, search (by name, email, document), and pagination. Follows the same patterns as Customer Management.

## Requirements

### Requirement: Create Supplier

The system MUST allow authenticated users with `suppliers:create` to create a supplier scoped to their tenant. Required fields: name, email, documentType, documentNumber. Document number SHALL be validated for format per documentType (basic regex).

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Success | Valid body with all required fields | POST /api/suppliers | 201 + supplier with caller's tenantId |
| Missing required | Body without name | POST /api/suppliers | 400 + field validation errors |
| Duplicate document | Existing supplier with same document in tenant | POST /api/suppliers | 409 Conflict |
| Invalid document format | documentType=CUIT with 5-digit documentNumber | POST /api/suppliers | 400 + validation error |

### Requirement: List Suppliers

The system MUST return paginated, tenant-scoped suppliers ordered by createdAt desc. Search SHALL match name, email, or documentNumber.

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Default page | 30 suppliers in tenant | GET /api/suppliers | 200 + page of 20 + total count |
| Search by name | "Acme Supplies" and "Beta Goods" | GET /api/suppliers?search=acme | Only Acme Supplies in results |
| Search by document | Supplier with CUIT 30-12345678-9 | GET /api/suppliers?search=12345678 | That supplier in results |
| Empty result | No matching suppliers | GET /api/suppliers?search=zzznonexist | 200 + empty array + total=0 |

### Requirement: Get Supplier by ID

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Own tenant | Supplier in caller's tenant | GET /api/suppliers/:id | 200 + supplier object |
| Wrong tenant | Supplier in Tenant A, caller is B | GET /api/suppliers/:id | 404 |
| Not found | ID does not exist | GET /api/suppliers/:id | 404 |

### Requirement: Update Supplier

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Full update | Existing supplier | PUT /api/suppliers/:id with valid body | 200 + updated fields |
| Wrong tenant | Supplier in Tenant A, caller is B | PUT /api/suppliers/:id | 404 |
| Document conflict | Another supplier has same document | PUT /api/suppliers/:id | 409 |

### Requirement: Deactivate Supplier

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Soft deactivate | Active supplier | DELETE /api/suppliers/:id | 200 + active=false |
| Idempotent | Already deactivated | DELETE /api/suppliers/:id | 200 |
| List excludes inactive | 3 active + 1 deactivated | GET /api/suppliers | 200 + only 3 active |
