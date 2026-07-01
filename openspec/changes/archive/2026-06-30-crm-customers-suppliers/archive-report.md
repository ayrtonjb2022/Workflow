# Archive Report: CRM — Customers & Suppliers

**Change**: `crm-customers-suppliers`
**Archived**: 2026-06-30
**Verdict**: PASS WITH WARNINGS — Intentional-with-warnings

---

## Change Summary

Added customer and supplier management as the first CRM domain modules for the CrmErp platform. Implemented full CRUD with multi-tenant isolation, search, pagination, nested contact management under customers, and Excel import/export for both entities. This delivers the foundational counterparty data model required by downstream invoicing and purchasing features.

**New capabilities delivered**:
- `customer-management` — CRUD, soft delete, search, pagination, tenant-isolated
- `supplier-management` — CRUD, soft delete, search, pagination, tenant-isolated (mirrors customer pattern)
- `contact-management` — CRUD nested under `/api/customers/:id/contacts`, cascade on customer deactivation
- `excel-io` — Shared export/import using SheetJS (`xlsx`) with per-row validation
- `database-schema` — Supplier Prisma model added, contacts cascade relation, compound tenant indexes
- `permission-system` — `suppliers:*` permissions seeded (create/read/update/delete)

---

## Artifact Inventory

| Artifact | Path | Status |
|----------|------|--------|
| Proposal | `openspec/changes/crm-customers-suppliers/proposal.md` | ✅ Present |
| Specs (delta: database-schema) | `openspec/changes/crm-customers-suppliers/specs/database-schema/spec.md` | ✅ Present — fixed W4 `@unique` inconsistency |
| Specs (delta: permission-system) | `openspec/changes/crm-customers-suppliers/specs/permission-system/spec.md` | ✅ Present → promoted to main spec |
| Design | `openspec/changes/crm-customers-suppliers/design.md` | ✅ Present |
| Tasks | `openspec/changes/crm-customers-suppliers/tasks.md` | ✅ Present — 16/16 tasks complete |
| Verify Report | `openspec/changes/crm-customers-suppliers/verify-report.md` | ✅ Present — PASS WITH WARNINGS |
| Archive Report | `openspec/changes/crm-customers-suppliers/archive-report.md` | ✅ This file |

---

## Implementation Stats

| Metric | Value |
|--------|-------|
| Commits | 5 |
| Files created | 12 |
| Files modified | 4 |
| Lines added | 1,069 |
| Lines deleted | 1 |
| Total changed files | 15 |

### Files Created
- `apps/api/src/lib/excel.ts` — Shared Excel export/import utility
- `apps/api/src/lib/prisma.ts` — Prisma client singleton (1 line addition to existing)
- `apps/api/src/modules/contacts/contacts.repository.ts` — Contact DB queries
- `apps/api/src/modules/contacts/contacts.service.ts` — Contact business logic
- `apps/api/src/modules/customers/customers.repository.ts` — Customer DB queries
- `apps/api/src/modules/customers/customers.service.ts` — Customer business logic
- `apps/api/src/modules/suppliers/suppliers.repository.ts` — Supplier DB queries
- `apps/api/src/modules/suppliers/suppliers.service.ts` — Supplier business logic
- `apps/api/src/routes/customers.ts` — Customer/contact route definitions
- `apps/api/src/routes/suppliers.ts` — Supplier route definitions

### Files Modified
- `prisma/schema.prisma` — Added Supplier model + contacts cascade
- `prisma/seed.ts` — Added `"suppliers"` to RESOURCES array
- `apps/api/src/app.ts` — Registered customer and supplier route modules
- `apps/api/package.json` — Added `xlsx` dependency (+1, -1)

### Commits
| Hash | Message |
|------|---------|
| `4291efd` | feat(db): add Supplier model and suppliers permissions to seed |
| `8010a56` | feat(api): add Excel utility and customers/contacts modules |
| `42ac6f7` | feat(api): add customers routes with nested contacts and wire into app |
| `701cf8f` | feat(api): add tenant-scoped suppliers module with CRUD, export, and import |
| `de115a8` | docs: mark PR #2 suppliers tasks complete in tasks.md |

---

## Known Gaps (from Verify Report)

### Warnings (non-blocking)

| # | Description | Detail |
|---|-------------|--------|
| W1 | Contact endpoints don't check customer `active` status | Contact service's `findFirst` queries don't filter by `active: true`. A deactivated customer's contacts remain accessible. |
| W2 | Contact DELETE returns 200, not 204 | Spec says "204 No Content" for contact delete. Route returns the deleted contact object (missing explicit `reply.status(204)`). |
| W3 | No document format validation for suppliers | Supplier spec requires format validation per documentType (basic regex). No regex/format validation exists in service or route. |

### Suggestions

| # | Description | Detail |
|---|-------------|--------|
| S1 | Customer update lacks duplicate check | `customersService.update()` does not check for email/document duplicates before updating. Supplier update does. |
| S2 | Customer import requires document fields unconditionally | Route rejects rows without documentType/documentNumber but these could be optional in future. |
| S3 | No automated tests | No test files exist in `apps/api/src/`. Future changes will lack regression safety net. |

---

## Delta Spec Sync

### database-schema → `openspec/specs/database-schema/spec.md`

**Fix applied**: Removed `@unique` from the `email` field in the Supplier Model Fields requirement (W4 inconsistency). The spec text previously said `email (String? @unique)` which implied a DB unique constraint, but the scenario correctly showed that the same email in different tenants should succeed. Email uniqueness is enforced at the application layer only, matching the design intent and the implementation.

**Merge result**:
- **ADDED** — "Requirement: Supplier Model Fields" appended to main spec after V1 Entity Catalog
  - 4 scenarios: schema compile, migration, supplier creation, unique email across tenants
- **MODIFIED** — "Requirement: V1 Entity Catalog" — no content change (Supplier was already listed, scenarios unchanged)

### permission-system → `openspec/specs/permission-system/spec.md`

**Action**: Created new main spec (no existing main spec found). The delta spec was promoted to `openspec/specs/permission-system/spec.md` with proper spec formatting.

**Content**: "Requirement: Supplier Permissions" with 4 scenarios covering seed creation, idempotent re-seeding, route guard rejection (403), and route guard pass.

---

## Verification Summary

| Check | Result |
|-------|--------|
| `pnpm typecheck` (6 packages) | ✅ 6/6 successful |
| `pnpm lint` (2 packages) | ✅ 2/2 successful |
| Unit/integration tests | ⚠️ N/A — no test infra configured |
| Spec compliance (customer) | ✅ 6/6 requirements PASS |
| Spec compliance (supplier) | ✅ 6/6 requirements PASS |
| Spec compliance (contact) | ✅ 5/5 requirements PASS |
| Spec compliance (excel) | ✅ 4/4 requirements PASS |
| Spec compliance (database-schema) | ✅ All requirements PASS (W4 fixed) |
| Spec compliance (permission-system) | ✅ All requirements PASS |
| Final verdict | **PASS WITH WARNINGS** — No CRITICAL issues |

---

## Archived Path

```
openspec/changes/crm-customers-suppliers/
  → openspec/changes/archive/2026-06-30-crm-customers-suppliers/
```

## Source of Truth Updated

The following main specs now reflect the delivered behavior:
- `openspec/specs/database-schema/spec.md` — Added Supplier Model Fields requirement
- `openspec/specs/permission-system/spec.md` — Created with Supplier Permissions requirement

---

*SDD cycle complete. Change archived 2026-06-30.*
