# Proposal: CRM — Customers & Suppliers

## Intent

Add customer and supplier management as the first CRM domain modules. Both entities are foundational for invoicing, purchasing, and sales — the core ERP loop. Without them, downstream features (invoices, purchase orders) have no counterparty to reference.

## Scope

### In Scope
- Customer CRUD with tenant isolation, search, pagination
- Supplier CRUD with tenant isolation, search, pagination
- Contact CRUD nested under customer
- Supplier model in Prisma schema + migration
- Supplier permissions in seed script
- Excel export (customers + suppliers)
- Excel import (customers + suppliers)
- API routes: `/api/customers/*`, `/api/suppliers/*`, `/api/customers/:id/contacts/*`

### Out of Scope
- Frontend pages (deferred)
- Customer sales history / supplier purchase history (deferred)
- Advanced search / filtering (basic name/email search only)

## Capabilities

### New Capabilities
- `customer-management`: Customer CRUD with tenant isolation, search, pagination
- `supplier-management`: Supplier CRUD with tenant isolation, search, pagination
- `contact-management`: Contact CRUD nested under customer
- `excel-io`: Excel import and export for customers and suppliers

### Modified Capabilities
- `permission-system`: Add `suppliers:*` permissions to seed (delta spec)
- `database-schema`: Add Prisma `Supplier` model + migration (already declared in v1 catalog)

## Approach

1. Add `Supplier` model to Prisma schema + generate migration
2. Add supplier permissions (`suppliers:*`) to seed script + re-seed
3. Create customers module (service + repository pattern)
4. Create suppliers module (service + repository)
5. Create contacts module (nested under customer, own repository)
6. Create Excel export service (shared, supports both entities)
7. Create Excel import service (parse → validate → upsert by email/document)
8. Wire routes into app entry point
9. Typecheck + lint

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `packages/db/prisma/schema.prisma` | Modified | Add Supplier model |
| `packages/db/prisma/seed.ts` | Modified | Add suppliers permissions |
| `apps/api/src/modules/customers/` | New | Customer module (routes, service, repo) |
| `apps/api/src/modules/suppliers/` | New | Supplier module (routes, service, repo) |
| `apps/api/src/modules/contacts/` | New | Contact module (service, repo) |
| `apps/api/src/modules/excel/` | New | Excel import/export service |
| `apps/api/src/app.ts` | Modified | Register new route modules |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Excel parsing lib choice | Low | xlsx (SheetJS) — mature, well-supported |
| Duplicate detection on import | Med | Match by email or doc number, upsert or warn |
| Large Excel file performance | Low | Cap rows per import, process in batches |

## Tenant Isolation

All new entities (`Customer`, `Supplier`, `Contact`) MUST include `tenant_id` with compound index. Tenant middleware MUST scope all queries. Cross-tenant access MUST return 404, not 403.

## Rollback Plan

1. Revert route registrations in `app.ts`
2. Delete modules: `customers/`, `suppliers/`, `contacts/`, `excel/`
3. Keep Supplier migration (non-breaking additive change) or run `prisma migrate down` if isolated
4. Revert seed script to remove supplier permissions

## Dependencies

- Existing auth middleware (JWT, tenant context, permission guard)
- xlsx (SheetJS) npm package for Excel I/O
- Prisma already has Customer model; Supplier needs adding

## Success Criteria

- [ ] POST `/api/customers` creates customer scoped to tenant
- [ ] GET `/api/customers` returns paginated list with `?search` filtering
- [ ] GET `/api/customers/:id` returns 404 if wrong tenant
- [ ] POST `/api/suppliers` creates supplier scoped to tenant
- [ ] GET `/api/suppliers/export` returns Excel file
- [ ] POST `/api/customers/import` bulk-creates from Excel
- [ ] POST `/api/customers/:id/contacts` creates contact
- [ ] All routes protected by auth guard + `customers:*` / `suppliers:*` permission check
