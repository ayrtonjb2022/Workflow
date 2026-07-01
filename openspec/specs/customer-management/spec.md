# Customer Management Specification

## Purpose

Customer CRUD with multi-tenant isolation, search (by name, email, document), and pagination.

## Requirements

### Requirement: Create Customer

The system MUST allow authenticated users with `customers:create` to create a customer scoped to their tenant. Required fields: name, email, documentType, documentNumber. Duplicate email or documentNumber within the same tenant SHALL be rejected.

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Success | Valid body with all required fields | POST /api/customers | 201 + customer with caller's tenantId |
| Missing required | Body without name | POST /api/customers | 400 + field validation errors |
| Duplicate email | Existing customer with same email in tenant | POST /api/customers | 409 Conflict |

### Requirement: List Customers

The system MUST return a paginated, tenant-scoped list ordered by createdAt desc.

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Default page | 50 customers in tenant | GET /api/customers | 200 + page of 20 (default limit) + total count |
| Custom pagination | 50 customers | GET /api/customers?page=2&limit=10 | 200 + second page of 10 |
| Search | "Alice Corp" and "Bob Ltd" exist | GET /api/customers?search=alice | Only Alice Corp in results (name match) |
| Search by email | Customer with email alice@test.com | GET /api/customers?search=alice@test | That customer in results |
| Empty result | No matching customers | GET /api/customers?search=zzznonexist | 200 + empty array + total=0 |

### Requirement: Get Customer by ID

The system MUST scope GET by tenant. Cross-tenant access SHALL return 404.

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Own tenant | Customer exists in caller's tenant | GET /api/customers/:id | 200 + customer object |
| Wrong tenant | Customer in Tenant A, caller is B | GET /api/customers/:id | 404 (not 403) |
| Not found | ID does not exist | GET /api/customers/:id | 404 |

### Requirement: Update Customer

The system MUST allow updating name, email, phone, address, documentType, documentNumber for own-tenant customers.

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Full update | Existing customer | PUT /api/customers/:id with valid body | 200 + updated fields |
| Wrong tenant | Customer in Tenant A, caller is B | PUT /api/customers/:id | 404 |
| Email conflict | Another customer has the email | PUT /api/customers/:id | 409 |

### Requirement: Deactivate Customer (Soft Delete)

The system MUST support soft deactivation via the `active` boolean field. Deactivated customers SHALL be excluded from list/search by default but still retrievable by ID.

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Soft deactivate | Active customer | DELETE /api/customers/:id | 200 + active=false |
| Idempotent | Already deactivated | DELETE /api/customers/:id | 200 (idempotent, still active=false) |
| Wrong tenant | Customer in Tenant A, caller is B | DELETE /api/customers/:id | 404 |
| List excludes inactive | 2 active + 1 deactivated | GET /api/customers | 200 + only 2 active customers |
