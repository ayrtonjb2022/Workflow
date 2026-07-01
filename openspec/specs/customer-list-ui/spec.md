# Customer List UI Specification

## Purpose

Paginated customer table with search, create modal, delete confirmation, and export. Protected by `customers:read` permission.

## Requirements

| ID | Requirement | Strength |
|----|------------|----------|
| CL-1 | The system MUST fetch `GET /api/customers?page=&limit=&search=` using TanStack Query | MUST |
| CL-2 | The system MUST render a Table with columns: Name, Email, Document, Phone, Status (active/inactive), Actions | MUST |
| CL-3 | The system MUST show Pagination below the table synced with the query response | MUST |
| CL-4 | The system MUST show a SearchBar above the table that resets to page 1 on new search | MUST |
| CL-5 | The system MUST provide a "New Customer" button that opens CreateCustomerModal | MUST |
| CL-6 | CreateCustomerModal MUST include: name (required), email, phone, documentType (select), documentNumber, address | MUST |
| CL-7 | On modal submit, the system MUST POST `/api/customers`, refetch the list, and close the modal | MUST |
| CL-8 | Each row MUST have a delete button that shows a confirmation dialog → soft delete → refetch | MUST |
| CL-9 | Each row MUST be clickable and navigate to `/customers/:id` | MUST |
| CL-10 | The system MUST show loading skeleton, empty state ("No customers found"), and error state | MUST |
| CL-11 | The system MUST provide an "Export" button that calls `GET /api/customers/export` and downloads an xlsx | MUST |
| CL-12 | The page MUST be protected — redirect to `/login` if user lacks `customers:read` | MUST |

### Scenario 1: Page loads with data

- GIVEN a user with `customers:read` permission
- WHEN the user navigates to `/customers`
- THEN a Table is rendered with customer rows and Pagination below

### Scenario 2: Search filters results

- GIVEN the customer list page is loaded
- WHEN the user types a search term in the SearchBar
- THEN after 300ms the query refetches with the search term
- AND the page resets to 1

### Scenario 3: Create customer modal

- GIVEN the customer list page
- WHEN the user clicks "New Customer" and submits the form
- THEN `POST /api/customers` is called
- AND the list refetches and the modal closes

### Scenario 4: Delete customer

- GIVEN a row in the customer table
- WHEN the user clicks the delete button and confirms
- THEN `DELETE /api/customers/:id` is called (soft delete)
- AND the list refetches

### Scenario 5: Empty state

- GIVEN no customers exist for the current tenant
- WHEN the user navigates to `/customers`
- THEN the empty state message "No customers found" is displayed

### Scenario 6: Error state

- GIVEN the API returns an error
- WHEN the user is on `/customers`
- THEN an error message is displayed with a retry option
