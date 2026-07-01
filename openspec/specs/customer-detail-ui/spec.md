# Customer Detail UI Specification

## Purpose

Customer info card, inline edit, and contacts management for a single customer.

## Requirements

| ID | Requirement | Strength |
|----|------------|----------|
| CD-1 | The system MUST fetch `GET /api/customers/:id` using TanStack Query on mount | MUST |
| CD-2 | CustomerInfoCard MUST display: name, email, phone, document, address, status, created date | MUST |
| CD-3 | A "Back to list" link MUST navigate to `/customers` | MUST |
| CD-4 | An Edit button MUST switch the card to inline edit mode or open a modal with editable fields | MUST |
| CD-5 | The Contacts section MUST render a Table with columns: Name, Email, Phone, Position, Actions | MUST |
| CD-6 | An "Add Contact" button MUST open a modal with name (required), email, phone, position fields | MUST |
| CD-7 | On contact modal submit, the system MUST POST `/api/customers/:id/contacts` and refetch contacts | MUST |
| CD-8 | Each contact row MUST have a delete button with confirmation dialog → soft delete → refetch | MUST |
| CD-9 | The system MUST show loading state while fetching customer data | MUST |
| CD-10 | The system MUST show an error state if the API call fails | MUST |
| CD-11 | The page MUST scroll to the contacts section on mobile if anchor-navigated | MAY |

### Scenario 1: Customer loads with contacts

- GIVEN a valid customer ID
- WHEN the user navigates to `/customers/:id`
- THEN the CustomerInfoCard shows the customer details
- AND the Contacts table shows existing contacts for that customer

### Scenario 2: Add contact

- GIVEN the customer detail page
- WHEN the user clicks "Add Contact" and submits the form
- THEN `POST /api/customers/:id/contacts` is called
- AND the contacts list refetches and the modal closes

### Scenario 3: Delete contact

- GIVEN a contact row in the contacts table
- WHEN the user clicks delete and confirms
- THEN `DELETE /api/customers/:id/contacts/:contactId` is called
- AND the contacts list refetches

### Scenario 4: Back to list navigates correctly

- GIVEN the customer detail page
- WHEN the user clicks "Back to list"
- THEN the browser navigates to `/customers`

### Scenario 5: Loading state

- GIVEN the customer detail page is loading
- WHEN the data is being fetched
- THEN a loading indicator is shown

### Scenario 6: Error state

- GIVEN the customer does not exist or the API returns an error
- WHEN the user navigates to `/customers/:id`
- THEN an error message is displayed
