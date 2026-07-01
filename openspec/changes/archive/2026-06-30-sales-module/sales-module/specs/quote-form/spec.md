# Quote Form Specification

## Requirements

| # | Requirement | Strength | Description |
|---|-------------|----------|-------------|
| R1 | Full page form | MUST | Create/edit in a dedicated page (not a modal) |
| R2 | Customer selector | MUST | Searchable dropdown to find customers by name. Displays selected customer name + email |
| R3 | Date field | MUST | Date input, defaults to today |
| R4 | Notes field | MAY | Optional textarea for notes |
| R5 | Line items | MUST | Table with columns: product (autocomplete), quantity, unit price, subtotal, remove button |
| R6 | Product autocomplete | MUST | Search products by name or code. Shows code + name in dropdown. Sets unitPrice from product |
| R7 | Real-time subtotal | MUST | Each line shows `quantity * unitPrice` updated on every input change |
| R8 | Add/remove items | MUST | "Agregar producto" button adds a new empty row. Each row has a remove button |
| R9 | Min 1 item | MUST | Form validation rejects submission with 0 items |
| R10 | Customer required | MUST | Form validation rejects if no customer selected |
| R11 | Quantity > 0 | MUST | Each line item must have `quantity > 0` |
| R12 | Footer totals | MUST | Show subtotal (sum of line subtotals), tax, and total below the items table |
| R13 | Save as DRAFT | MUST | "Guardar Borrador" saves with status DRAFT |
| R14 | Save and send | MUST | "Guardar y Enviar" saves with status SENT |
| R15 | Edit mode | MUST | Pre-populate all fields from existing quote. Only editable if DRAFT |

### Scenario: Create quote as DRAFT

- GIVEN a customer selected and 2 products added with quantities
- WHEN clicking "Guardar Borrador"
- THEN a new quote is created with DRAFT status
- AND the form navigates to the quote detail page

### Scenario: Create and send quote

- GIVEN a customer and 3 line items with valid quantities
- WHEN clicking "Guardar y Enviar"
- THEN a new quote is created with SENT status
- AND the form navigates to the quote detail page

### Scenario: Validation blocks empty form

- GIVEN no customer and no items
- WHEN clicking any save button
- THEN validation errors are displayed: "Cliente requerido" and "Al menos un producto"
- AND no API call is made
