# Design: CRM — Customers & Suppliers

## Technical Approach

Follow existing singleton service+repository pattern (users, roles modules). Each domain (customers, suppliers, contacts) gets its own module with `tenantId`-scoped Prisma queries. Routes use Fastify + TypeBox, protected by `authGuard` with `config.requiredPermission`. Shared Excel I/O lives in `lib/excel.ts` using SheetJS (`xlsx`).

## Architecture Decisions

| Option | Alternatives | Rationale |
|--------|-------------|-----------|
| Separate Supplier model | Customer with type field | Cleaner domain isolation; Supplier may diverge in fields/validation |
| Singleton object (service/repo) | Classes | Matches existing users/roles module pattern — no ceremony needed for CRUD |
| Explicit `tenantId` in queries | Prisma middleware | Follows existing pattern; middleware obscures query intent |
| xlsx (SheetJS) for Excel | exceljs | Simpler `sheet_to_json` for import, mature buffer API for export |
| Soft delete via `active=false` | Hard delete | Matches Customer spec; preserves audit trail, idempotent |
| Search via Prisma `contains: 'insensitive'` | Raw SQL | Consistent with tenant-scoped Prisma pattern, portable across DB adapters |

## Data Flow

```
Client → Fastify → authGuard (JWT → permission check) → route handler
  → {customers|suppliers|contacts}Service (validation + business logic)
    → {customers|suppliers|contacts}Repository (Prisma queries)
      → PostgreSQL (all WHERE tenantId = ?)

Excel export:  DB → format rows → lib/excel.ts (json_to_sheet) → Buffer → Content-Disposition response
Excel import:  Upload .xlsx → lib/excel.ts (parse + validate per row) → upsert → ImportResult summary
```

Tenant scoping: every `findMany`/`findFirst` includes `where: { tenantId }`. Cross-tenant access returns 404 (handled by service checking `findFirst` result, same as existing user module).

## Prisma Changes

Add Supplier model to `prisma/schema.prisma` — mirrors Customer but without `branchId`, without unique constraints on email/document (app-level validation only), and with `documentType` optional:

```prisma
model Supplier {
  id             String       @id @default(cuid())
  tenantId       String       @map("tenant_id")
  name           String
  email          String?
  phone          String?
  documentType   DocumentType?
  documentNumber String?
  address        String?
  active         Boolean      @default(true)
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Restrict)

  @@index([tenantId])
  @@index([tenantId, name])
  @@map("suppliers")
}
```

No existing model or field changes. Migration is additive only.

## File Changes

| File | Action |
|------|--------|
| `prisma/schema.prisma` | Modify — add Supplier model |
| `prisma/seed.ts` | Modify — add `"suppliers"` to RESOURCES array |
| `apps/api/package.json` | Modify — add `xlsx` dependency |
| `apps/api/src/lib/excel.ts` | Create — `exportToExcel()`, `parseExcel()`, `validateCustomerRow()`, `validateSupplierRow()` |
| `apps/api/src/modules/customers/customers.service.ts` | Create |
| `apps/api/src/modules/customers/customers.repository.ts` | Create |
| `apps/api/src/modules/suppliers/suppliers.service.ts` | Create |
| `apps/api/src/modules/suppliers/suppliers.repository.ts` | Create |
| `apps/api/src/modules/contacts/contacts.service.ts` | Create |
| `apps/api/src/modules/contacts/contacts.repository.ts` | Create |
| `apps/api/src/routes/customers.ts` | Create |
| `apps/api/src/routes/suppliers.ts` | Create |
| `apps/api/src/app.ts` | Modify — register `customerRoutes`, `supplierRoutes` |

## Module Structure

```
apps/api/src/
├── lib/
│   └── excel.ts              # Shared exportToExcel, parseExcel, validators
├── modules/
│   ├── customers/
│   │   ├── customers.service.ts
│   │   └── customers.repository.ts
│   ├── suppliers/
│   │   ├── suppliers.service.ts
│   │   └── suppliers.repository.ts
│   └── contacts/
│       ├── contacts.service.ts
│       └── contacts.repository.ts
└── routes/
    ├── customers.ts
    └── suppliers.ts
```

## Route Design

| Method | Path | Permission | Notes |
|--------|------|-----------|-------|
| GET | /api/customers | customers:read | `?page=1&limit=20&search=` |
| POST | /api/customers | customers:create | Validates required + unique email/doc |
| GET | /api/customers/:id | customers:read | Tenant-scoped (404 if wrong tenant) |
| PATCH | /api/customers/:id | customers:update | Partial update |
| DELETE | /api/customers/:id | customers:delete | Sets `active=false` |
| GET | /api/customers/export | customers:read | Returns .xlsx buffer |
| POST | /api/customers/import | customers:create | Parse → validate → upsert → summary |
| GET | /api/customers/:id/contacts | customers:read | List (no pagination) |
| POST | /api/customers/:id/contacts | customers:update | Create nested contact |
| GET | /api/customers/:id/contacts/:contactId | customers:read | Tenant + parent scoped |
| DELETE | /api/customers/:id/contacts/:contactId | customers:update | Hard delete |

Same routes for `/api/suppliers` with `suppliers:*` permissions, excluding contacts endpoints.

Paginated response: `{ data: [], total: number, page: number, limit: number }`. Search via Prisma `contains: 'insensitive'` on name, email, documentNumber within `OR` condition.

## Key Contracts

```typescript
// Paginated result (all list endpoints)
interface PaginatedResult<T> {
  data: T[]; total: number; page: number; limit: number
}

// Excel import summary
interface ImportResult {
  imported: number; skipped: number
  errors: Array<{ row: number; field: string; reason: string }>
}

// Excel utility signatures
exportToExcel(data: Record<string,unknown>[], headers: string[], filename: string): Buffer
parseExcel(buffer: Buffer): Record<string,unknown>[]
validateCustomerRow(row: Record<string,unknown>, index: number,
  existingEmails: Set<string>, existingDocs: Set<string>): string[]
```

## Testing Strategy

Testing framework not yet configured (greenfield). Manual verification via curl/HTTPie until test infra is set up. Design ready for test-first when Vitest/Mocha is introduced.

## Migration / Rollout

1. `pnpm add xlsx --filter=@crm/api`
2. Add Supplier model → `prisma migrate dev --name add_suppliers`
3. Update RESOURCES in seed → `prisma db seed`
4. Create modules, lib, routes
5. Register in `app.ts`
6. `pnpm typecheck && pnpm lint`

Rollback: revert `app.ts`, delete new files, keep migration (non-destructive additive).

## Open Questions

- **Import duplicate matching**: Match by email OR documentNumber? If both fields are empty on source and target, treat as new row? Decision: match by email first, fall back to documentNumber. Rows with neither field empty are always imported.
- **Contacts for suppliers**: Deferred per spec — v1 handles customer contacts only.
