# Products Frontend Specification

**Domain**: `products-frontend`

## Purpose

Provide product management UI: a paginated list with search, a create/edit form, and a detail view. Add an "Inventario" section in the main navigation with a "Productos" link.

## Requirements

### Navigation

| # | Requirement | Strength | Description |
|---|-------------|----------|-------------|
| N1 | Nav section | MUST | Add an "Inventario" nav section in `RootLayout.tsx`, placed between "Ventas" and any future sections, following the same `NavLink` pattern used by sales links. |
| N2 | Nav link | MUST | "Productos" link under "Inventario" pointing to `/inventory/products`. |
| N3 | Route registration | MUST | Register product routes in `App.tsx`: list at `/inventory/products`, create at `/inventory/products/new`, detail at `/inventory/products/:id`, edit at `/inventory/products/:id/edit`. |

### ProductList

| # | Requirement | Strength | Description |
|---|-------------|----------|-------------|
| L1 | Table display | MUST | Show paginated table with columns: `code`, `name`, `category`, `unitPrice`, `costPrice`, `stock`, `minStock`, `status` (active/inactive badge). |
| L2 | Search | MUST | Search bar that filters by `code` or `name` (partial, case-insensitive). Resets to page 1 on new search. |
| L3 | Pagination | MUST | `Pagination` component at the bottom. 20 items per page. |
| L4 | Category filter | SHOULD | Select dropdown to filter by category. Options populated from `GET /api/categories`. |
| L5 | Create button | MUST | "Nuevo Producto" button that navigates to `/inventory/products/new`. |
| L6 | Row click | MUST | Clicking a row navigates to `/inventory/products/:id` (detail page). |
| L7 | Loading/error/empty | MUST | Show loading spinner, error state with retry, and empty state ("No hay productos") as appropriate. |
| L8 | Stock warning | SHOULD | Highlight rows where `stock <= minStock` with a visual indicator (e.g., amber background or icon). |

### ProductForm

| # | Requirement | Strength | Description |
|---|-------------|----------|-------------|
| F1 | Create mode | MUST | `POST /api/products` on submit, navigates to the new product's detail on success. |
| F2 | Edit mode | MUST | `PATCH /api/products/:id` on submit, pre-populated with existing product data. Navigates to detail on success. |
| F3 | Fields | MUST | `name` (required), `code` (optional — placeholder shows auto-generated hint), `description` (textarea, optional), `categoryId` (select dropdown from `GET /api/categories`), `unitPrice` (required, number), `costPrice` (required, number), `stock` (create-only, optional number, default 0), `minStock` (optional number, default 0). |
| F4 | Stock field behavior | MUST | `stock` field is visible in create mode only. In edit mode, stock is displayed as read-only text with a link/button to the detail page where adjustment can be made. |
| F5 | Validation | MUST | Client-side validation before submit: `name` required, `unitPrice >= 0`, `costPrice >= 0`, `stock >= 0`, `minStock >= 0`. |
| F6 | Server errors | MUST | Display server-side validation errors (e.g., duplicate code) as inline field errors or a general error banner. |
| F7 | Cancel button | MUST | "Cancelar" button that navigates back to the product list. |
| F8 | Loading state | MUST | Submit button shows loading state during mutation. |
| F9 | Category select | MUST | Dropdown populated from `GET /api/categories`. First option is "Sin categoría" (value empty). |

### ProductDetail

| # | Requirement | Strength | Description |
|---|-------------|----------|-------------|
| D1 | Display fields | MUST | Show all product fields in a read-only card layout: `code`, `name`, `description`, `category`, `unitPrice`, `costPrice`, `stock`, `minStock`, `createdAt`, `updatedAt`, `active` status. |
| D2 | Edit button | MUST | "Editar" button that navigates to `/inventory/products/:id/edit`. |
| D3 | Deactivate/Activate button | MUST | "Desactivar" button (or "Activar" if currently inactive) that calls `DELETE /api/products/:id` (deactivate). Shows confirmation dialog before deactivating. After deactivation, refreshes the page data and toggles the button label. |
| D4 | Adjust stock | MUST | "Ajustar Stock" button that opens an inline or modal form with a quantity field (signed integer) and optional reason text. Calls `POST /api/products/:id/adjust-stock`. Updates the displayed stock on success. |
| D5 | Back link | MUST | "Volver a Productos" link that navigates to `/inventory/products`. |
| D6 | Loading/error | MUST | Loading spinner while fetching, error state with retry if fetch fails. |
| D7 | Stock movement history | SHOULD NOT | Out of scope — no StockMovement list shown on this page. |

### Types

Add a `products.ts` type file (or extend an existing inventory types file):

```typescript
export interface Product {
  id: string
  code: string
  name: string
  description: string | null
  categoryId: string | null
  category: { id: string; name: string } | null
  unitPrice: number
  costPrice: number
  stock: number
  minStock: number
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  name: string
  description: string | null
  active: boolean
  createdAt: string
}
```

### Scenario: Navigate to product list from nav

- GIVEN the user is on any page within the authenticated app
- WHEN they click "Productos" under "Inventario" in the navigation
- THEN they are taken to `/inventory/products`
- AND the "Productos" link shows the active state

### Scenario: Create a product with initial stock

- GIVEN the user navigates to `/inventory/products/new`
- WHEN they fill in name "Widget", unitPrice "10", costPrice "5", stock "100", and submit
- THEN `POST /api/products` is called with the form data
- AND on success they are redirected to `/inventory/products/:id`
- AND the detail page shows stock = 100

### Scenario: Edit product name and price

- GIVEN an existing product with id `P1`
- WHEN the user navigates to `/inventory/products/P1/edit`, changes the name and price, and submits
- THEN `PATCH /api/products/P1` is called with the updated fields
- AND on success they are redirected to the detail page
- AND the detail page shows the updated values

### Scenario: Adjust stock from detail page

- GIVEN a product with stock = 10 on its detail page
- WHEN the user clicks "Ajustar Stock", enters quantity = -3 and reason "Dañado", and confirms
- THEN `POST /api/products/P1/adjust-stock` is called with `{ quantity: -3, reason: "Dañado" }`
- AND on success the displayed stock updates to 7

### Scenario: Deactivate product from detail page

- GIVEN an active product on its detail page
- WHEN the user clicks "Desactivar" and confirms the dialog
- THEN `DELETE /api/products/P1` is called
- AND the detail page shows the product as inactive
- AND the button text changes to "Activar"

### Scenario: Duplicate code on form submit

- GIVEN a product with code "PRO-00001" already exists in the tenant
- WHEN the user creates a new product with explicit code "PRO-00001"
- THEN the server returns `409 Conflict`
- AND the form displays an inline error on the code field
- AND the form data is preserved (not cleared)

### Scenario: Product list filter by category

- GIVEN products exist across categories "Electrónica" and "Ropa"
- WHEN the user selects "Electrónica" from the category filter
- THEN `GET /api/products?categoryId=<id>` is called
- AND only products in "Electrónica" are displayed
