# Sales Frontend Specification

## Requirements

| # | Requirement | Strength | Description |
|---|-------------|----------|-------------|
| R1 | Quotes list | MUST | Table with columns: number, customer name, date, status (color badge), total. Click row → detail |
| R2 | Quote detail | MUST | Header info card, items table, status action buttons, "Convertir a Pedido" button only when SENT |
| R3 | Orders list | MUST | Same table pattern: number, customer, date, status badge, total |
| R4 | Order detail | MUST | Header info, items table, status actions. Include source quote link if converted |
| R5 | Invoices list | MUST | Same table pattern + paid column showing `paidAmount / total` |
| R6 | Invoice detail | MUST | Header info, items table, payments section with table, "Registrar Pago" button when in SENT |
| R7 | Pagination | MUST | All lists use shared `Pagination` component |
| R8 | Search | MUST | All lists have `SearchBar` filtering by number or customer name |
| R9 | Status filter | MUST | All lists have dropdown filter by status |
| R10 | Nav sidebar | MUST | "Ventas" entry in `navLinks` with sub-items: Cotizaciones, Pedidos, Facturas |
| R11 | Routes | MUST | `/sales/quotes`, `/sales/quotes/:id`, `/sales/quotes/new`, `/sales/orders`, `/sales/orders/:id`, `/sales/invoices`, `/sales/invoices/:id` |
| R12 | Loading/error | MUST | Loading spinner and error state with retry on all pages |

### Scenario: Navigate to quotes list

- GIVEN the user is logged in
- WHEN clicking "Ventas" → "Cotizaciones" in the nav
- THEN the quotes list page loads with paginated data
- AND each row shows number, customer, date, colored status badge, and total

### Scenario: Convert quote to order from detail

- GIVEN a quote in SENT status on the detail page
- WHEN clicking "Convertir a Pedido"
- THEN the app calls `POST /api/quotes/:id/convert`
- AND navigates to the new order detail page

### Scenario: Register payment on invoice

- GIVEN an invoice in SENT status on the detail page
- WHEN clicking "Registrar Pago"
- THEN a modal/form opens to enter method, amount, and reference
- AND after success, the payments table updates and status may change to PAID
