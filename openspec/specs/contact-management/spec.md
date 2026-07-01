# Contact Management Specification

## Purpose

Contact CRUD nested under `/api/customers/:customerId/contacts`. Contacts are child entities — a contact cannot exist without its parent customer.

## Requirements

### Requirement: Create Contact

The system MUST allow authenticated users with `customers:update` to create a contact nested under a customer in their tenant. Required fields: name. Email is unique per customer (optional but unique when present).

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Success | Valid body with name + email | POST /api/customers/:customerId/contacts | 201 + contact with customerId |
| Wrong tenant | Customer belongs to Tenant A, caller is B | POST /api/customers/:customerId/contacts | 404 |
| Customer not found | customerId does not exist | POST /api/customers/:customerId/contacts | 404 |
| Missing name | Body without name | POST /api/customers/:customerId/contacts | 400 |

### Requirement: List Contacts

The system MUST return all contacts for a customer scoped to the caller's tenant.

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| List contacts | Customer has 3 contacts | GET /api/customers/:customerId/contacts | 200 + array of 3 contacts |
| Empty list | Customer has no contacts | GET /api/customers/:customerId/contacts | 200 + empty array |
| Wrong tenant | Customer in Tenant A, caller is B | GET /api/customers/:customerId/contacts | 404 |

### Requirement: Get Contact by ID

The system MUST verify the contact belongs to the customer before returning it.

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Contact found | Contact exists under that customer | GET /api/customers/:customerId/contacts/:contactId | 200 + contact object |
| Contact from wrong customer | Contact exists under different customer | GET /api/customers/:customerId/contacts/:contactId | 404 |
| Wrong tenant | Customer in Tenant A, caller is B | GET /api/customers/:customerId/contacts/:contactId | 404 |

### Requirement: Delete Contact

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Hard delete | Existing contact | DELETE /api/customers/:customerId/contacts/:contactId | 204 No Content |
| Wrong customer | Contact under different customer | DELETE /api/customers/:customerId/contacts/:contactId | 404 |
| Contact not found | Contact ID does not exist | DELETE /api/customers/:customerId/contacts/:contactId | 404 |

### Requirement: Cascade on Customer Deactivation

When a customer is deactivated (soft delete), its contacts MUST remain in the database but SHOULD NOT be accessible through contact endpoints.

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Customer deactivated | Customer with 2 contacts is deactivated | GET /api/customers/:customerId/contacts | 404 (customer not found by tenant scope) |
