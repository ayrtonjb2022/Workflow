# Verification Report

**Change**: `crm-customers-suppliers`
**Mode**: Standard (no Strict TDD)
**Date**: 2026-06-30

---

## Completeness

| Artifact | Status |
|---|---|
| Proposal | Present |
| Design | Present |
| Tasks | Present (all 16/16 completed) |
| Specs (customer-management) | Present |
| Specs (supplier-management) | Present |
| Specs (contact-management) | Present |
| Specs (excel-io) | Present |
| Delta specs (database-schema) | Present |
| Delta specs (permission-system) | Present |

## Build & Verification Evidence

| Check | Result |
|---|---|
| `pnpm typecheck` (turbo — all 6 packages) | 6/6 successful |
| `pnpm lint` (turbo — 2 packages ran) | 2/2 successful |
| Unit/integration tests | N/A — no test files found (`apps/api/src/**/*.test.*`, `apps/api/src/**/*.spec.*`) |

## Task Completion

All 16 tasks across 6 phases marked `[x]`:

| Phase | Tasks | Status |
|---|---|---|
| 1 — Prisma + deps | 4/4 | Complete |
| 2 — Excel utility | 1/1 | Complete |
| 3 — Customers module | 5/5 | Complete |
| 4 — Suppliers module | 3/3 | Complete |
| 5 — App wiring | 2/2 | Complete |
| 6 — Verification | 4/4 | Complete |

---

## Spec Compliance Matrix

### 1. Customer Management (6 requirements)

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| REQ-CUST-01 | CRUD | **PASS** | `customers.ts` — POST/GET/PATCH/DELETE routes at lines 122, 16, 153, 186 with `requiredPermission` config |
| REQ-CUST-02 | Soft delete (active=false) | **PASS** | `DELETE /api/customers/:id` → `customersService.deactivate()` → `customersRepository.deactivate()` sets `active: false` (customers.repository.ts:96-101) |
| REQ-CUST-03 | Search name/email/doc | **PASS** | `customers.repository.ts:44-50` — `OR: [{ name: { contains, mode: "insensitive" } }, { email }, { documentNumber }]` |
| REQ-CUST-04 | Pagination (page, limit) | **PASS** | `customers.ts:18-23` — optional `page`/`limit` query params; repository uses `skip`/`take` (customers.repository.ts:40, 55-56); returns `{ data, total, page, limit }` |
| REQ-CUST-05 | Duplicate prevention | **PASS** | App-layer: `customersService.create()` checks email and document duplicates before create (customers.service.ts:38-48). DB-layer: `@@unique([tenantId, documentType, documentNumber])` on Customer model (schema.prisma:214). Email uniqueness at app layer only (design intent). |
| REQ-CUST-06 | Tenant isolation | **PASS** | All repository methods include `tenantId` in WHERE clauses. `findById` uses `findFirst({ where: { id, tenantId } })` — returns null for wrong tenant, service throws `NotFoundError`. |

### 2. Supplier Management (6 requirements)

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| REQ-SUP-01 | CRUD | **PASS** | `suppliers.ts` — POST/GET/PATCH/DELETE routes at lines 115, 15, 144, 175 with `requiredPermission: "suppliers:*"` |
| REQ-SUP-02 | Soft delete | **PASS** | `DELETE /api/suppliers/:id` → `suppliersService.deactivate()` → `suppliersRepository.deactivate()` sets `active: false` (suppliers.repository.ts:92-97) |
| REQ-SUP-03 | Search name/email/doc | **PASS** | `suppliers.repository.ts:42-48` — same `contains: insensitive` OR pattern |
| REQ-SUP-04 | Pagination | **PASS** | `suppliers.ts:18-23` — optional `page`/`limit`; repository `skip`/`take`; `{ data, total, page, limit }` response |
| REQ-SUP-05 | Duplicate prevention | **PASS** | App-layer checks in `suppliersService.create()` (email + document). Update also checks duplicates when field changes (suppliers.service.ts:56-69). |
| REQ-SUP-06 | Tenant isolation | **PASS** | All supplier repository methods include `tenantId`. `findById` uses `findFirst({ where: { id, tenantId } })`. |

### 3. Contact Management (5 requirements)

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| REQ-CONT-01 | Nested under customers | **PASS** | Routes at `/api/customers/:id/contacts/*` (customers.ts:199-262) |
| REQ-CONT-02 | CRUD (list, get, create, delete) | **PASS** | GET list (199), GET by id (237), POST create (210), DELETE (251). No update endpoint — spec doesn't require one. |
| REQ-CONT-03 | Fields: name, email, phone, position | **PASS** | Schema has all fields (schema.prisma:244-247). Route POST body schema validates them (customers.ts:214-219). |
| REQ-CONT-04 | Parent customer verified | **PASS** | `contactsService.create()` checks `prisma.customer.findFirst({ where: { id, tenantId } })` and throws `NotFoundError` if missing (contacts.service.ts:34-38). Same check in `list()` and `get()`. |
| REQ-CONT-05 | Tenant-scoped | **PASS** | Contact repository methods include `tenantId` in all WHERE clauses. |

### 4. Excel I/O (4 requirements)

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| REQ-EXCEL-01 | Export customers to xlsx | **PASS** | `GET /api/customers/export` (customers.ts:31-42) — returns buffer from `exportToExcel()`, sets `Content-Disposition: attachment; filename=customers.xlsx`, `Content-Type: application/vnd.openxmlformats...` |
| REQ-EXCEL-02 | Import customers from xlsx | **PASS** | `POST /api/customers/import` (customers.ts:45-108) — uses `@fastify/multipart` (registered app.ts:20), parses via `parseExcel(buffer)`, validates per row, returns `{ imported, skipped, errors }` |
| REQ-EXCEL-03 | Import validation | **PASS** | `validateCustomerRow()` checks: name required, email format, documentType enum, duplicate email/doc within file. Route returns per-row error summary. |
| REQ-EXCEL-04 | Suppliers export/import | **PASS** | Same pattern: `GET /api/suppliers/export` (suppliers.ts:30-41) with `filename=suppliers.xlsx`. `POST /api/suppliers/import` (suppliers.ts:44-101) with `validateSupplierRow()`. |

### 5. Database Schema (delta spec)

| Requirement | Status | Evidence |
|---|---|---|
| Supplier model fields | **PASS** | Schema.prisma:220-238 — all required fields present. `documentType` is `DocumentType?` (optional, per design), no `@unique` on email (matches design intent, not spec text — see Issues). Compound index `@@index([tenantId])` and `@@index([tenantId, name])`. |
| Contacts onDelete: Cascade from Customer | **PASS** | Schema.prisma:251 — `customer Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)` |
| Customer `@@unique([tenantId, documentType, documentNumber])` | **PASS** | Schema.prisma:214 — `@@unique([tenantId, documentType, documentNumber])` |

### 6. Permission System (delta spec)

| Requirement | Status | Evidence |
|---|---|---|
| suppliers:create/read/update/delete in seed | **PASS** | `seed.ts:9` — `"suppliers"` in RESOURCES array. Loop creates all 4 permissions. |
| customers:* permissions pre-existing | **PASS** | `seed.ts:8` — `"customers"` in RESOURCES. Pre-existing, verified present. |
| Routes use `requiredPermission` config | **PASS** | All customer routes: `customers:create/read/update/delete`. All supplier routes: `suppliers:create/read/update/delete`. |

---

## Issues

### CRITICAL

None.

### WARNING

| # | Description | File | Detail |
|---|---|---|---|
| W1 | Contact endpoints don't check customer `active` status | `contacts.service.ts:19-21, 35-37` | Spec scenario expects 404 when customer is deactivated (`active=false`), but the contact service's `findFirst` queries don't filter by `active: true`. A deactivated customer's contacts remain accessible. |
| W2 | Contact DELETE returns 200, not 204 | `customers.ts:251-262` | Spec says "204 No Content" for contact delete. Route returns the deleted contact object (default 200). Missing explicit `reply.status(204)` or `reply.code(204)`. |
| W3 | No document format validation for suppliers | `suppliers.service.ts` | Supplier spec requires "Document number SHALL be validated for format per documentType (basic regex)" with scenario for invalid CUIT format returning 400. No regex/format validation exists in service or route. |
| W4 | Delta spec (database-schema) says email `@unique` but design+impl intentionally omit it | `openspec/changes/crm-customers-suppliers/specs/database-schema/spec.md` | Spec text says `email (String? @unique)` but the scenario on line 14 demonstrates the opposite (same email in different tenant → both succeed). The design explicitly omits DB unique on email (app-layer only). Spec text should be corrected to match intent. |

### SUGGESTION

| # | Description | File | Detail |
|---|---|---|---|
| S1 | Duplicate check on customer update is missing | `customers.service.ts:53-57` | `customersService.update()` does not check for email or document duplicates before updating — only verifies the target customer exists. Supplier update does check. Customer update duplicates should also be verified. |
| S2 | Customer import requires document fields unconditionally | `customers.ts:84-88` | The customer import route rejects rows without `documentType`/`documentNumber`, but the route schema for POST `/customers` marks these as required too (consistent). However, the service allows creating customers with only email+name if those were optional in the future. Not a bug, but restrictive. |
| S3 | No automated tests | Whole project | No test files exist in `apps/api/src/`. While not required by this change, future changes will have no regression safety net. |

---

## Design Coherence

| Design Decision | Status | Notes |
|---|---|---|
| Separate Supplier model (not type field) | **Consistent** | Separate `Supplier` model in schema |
| Singleton service/repository pattern | **Consistent** | Both customers and suppliers use singleton objects with `repository` suffix |
| Explicit `tenantId` in queries | **Consistent** | Every query includes `tenantId` in WHERE |
| xlsx (SheetJS) for Excel | **Consistent** | `xlsx` ^0.18.5 in package.json, used in `excel.ts` |
| Soft delete via `active=false` | **Consistent** | Both entities use `active: false` update |
| Search via Prisma `contains: insensitive` | **Consistent** | Both entities use `{ contains, mode: "insensitive" }` |
| Paginated response format | **Consistent** | `{ data, total, page, limit }` returned from all list endpoints |
| Contacts use onDelete: Cascade | **Consistent** | Schema has `onDelete: Cascade` on Contact → Customer relation |
| File structure (modules per domain) | **Consistent** | Separate `modules/customers/`, `modules/suppliers/`, `modules/contacts/` |
| All routes behind authGuard | **Consistent** | `app.addHook("preHandler", app.authGuard)` at top of both route files |
| Cross-tenant returns 404 not 403 | **Consistent** | Uses `findFirst` → returns null → service throws `NotFoundError` |
| Supplier documentType optional | **Consistent** | Schema has `DocumentType?`, service supports optional |
| No unique constraint on email (app-layer only) | **Consistent** | Schema has no `@unique` on supplier email; app-layer checks exist |

---

## Final Verdict

**PASS WITH WARNINGS**

All 6 specification areas are functionally implemented with no CRITICAL issues. 4 warnings exist: (W1) contact endpoints don't respect customer deactivation, (W2) contact delete returns 200 instead of 204, (W3) missing supplier document format validation, and (W4) spec text discrepancy on email uniqueness. The change is archive-ready pending resolution of these warnings.

Build: `pnpm typecheck` ✅, `pnpm lint` ✅
All 16 tasks: ✅
All spec requirements implemented with minor compliance gaps documented above.
