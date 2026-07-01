# Excel I/O Specification

## Purpose

Excel export and import for customers and suppliers using xlsx (SheetJS). Export returns .xlsx files; import accepts .xlsx, validates rows, and reports results.

## Requirements

### Requirement: Export Customers

The system MUST allow authenticated users with `customers:read` to export all active customers (tenant-scoped) as an .xlsx file.

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Export all active | 5 active customers in tenant | GET /api/customers/export | 200 with Content-Type application/vnd.openxmlformats-officedocument.spreadsheetml.sheet |
| Correct headers | Any data | GET /api/customers/export | File includes columns: Name, Email, Phone, DocumentType, DocumentNumber, Address |
| Empty tenant | No customers | GET /api/customers/export | 200 with file containing only headers row |
| File name | Request from any tenant | GET /api/customers/export | Content-Disposition: attachment; filename="customers.xlsx" |

### Requirement: Export Suppliers

Same as customer export but for suppliers and with permission `suppliers:read`. File name: `suppliers.xlsx`.

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Export all active | 3 active suppliers | GET /api/suppliers/export | 200 with .xlsx file, correct headers |

### Requirement: Import Customers

The system MUST allow authenticated users with `customers:create` to import customers from an uploaded .xlsx file. Duplicates SHALL be detected by email or documentNumber within the tenant.

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| All valid rows | File with 10 valid new customers | POST /api/customers/import | 200 + summary: { imported: 10, skipped: 0, errors: [] } |
| With duplicates | 2 of 5 rows have existing email/doc | POST /api/customers/import | 200 + summary: { imported: 3, skipped: 2, errors: ["row 2: duplicate email", "row 4: duplicate document"] } |
| Malformed row | Row missing name field | POST /api/customers/import | 200 + summary: imported valid rows, errors for malformed rows (partial success) |
| Empty file | File with only headers | POST /api/customers/import | 200 + summary: { imported: 0, skipped: 0, errors: [] } |
| Wrong content type | Upload as .csv or .txt | POST /api/customers/import | 400 + "Only .xlsx files are accepted" |
| Invalid column headers | File with wrong columns | POST /api/customers/import | 200 + summary: 0 imported, all rows errored as malformed |

### Requirement: Import Suppliers

Same pattern as customer import but for suppliers with permission `suppliers:create`. Route: POST /api/suppliers/import.

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| All valid rows | File with 5 valid new suppliers | POST /api/suppliers/import | 200 + summary: { imported: 5, skipped: 0, errors: [] } |
