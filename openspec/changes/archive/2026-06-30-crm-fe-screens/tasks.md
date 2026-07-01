# Tasks: CRM Frontend Screens

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1500 (23 files) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR #1: backend + frontend infra + 3 UI primitives + layouts (~450) | PR #2: 3 UI primitives + auth pages (~450) | PR #3: customer pages + routing (~600) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Backend GET /auth/me + HTTP client + AuthProvider + Types + Button/Input/Modal + Layouts | PR 1 | Foundation; base = main |
| 2 | Table/Pagination/SearchBar + Login + Register | PR 2 | Base = main or PR 1 branch |
| 3 | Customer pages + modals + App.tsx/main.tsx wiring | PR 3 | Base = PR 2 branch |

## Phase 1: Backend — GET /auth/me

- [x] 1.1 Add `findProfile(userId, tenantId)` to `auth.repository.ts` — query user + roles + permissions
- [x] 1.2 Add `getProfile(userId, tenantId)` to `auth.service.ts` — flatten role/permission names
- [x] 1.3 Add `GET /auth/me` route in `auth.ts` with `preHandler: [app.authGuard]` and TypeBox schema

## Phase 2: Frontend Infrastructure

- [x] 2.1 Create `types/auth.ts` — `User`, `LoginResponse`, `RegisterPayload`
- [x] 2.2 Create `types/customer.ts` — `Customer`, `PaginatedResponse<T>`, `Contact`
- [x] 2.3 Create `lib/api.ts` — typed fetch wrapper with `credentials: "include"`, `AppError`, 401 redirect
- [x] 2.4 Create `providers/AuthProvider.tsx` — `AuthContext` + `useAuth`, calls `/auth/me` on mount

## Phase 3: UI Primitives (PR #1 — partial, first 3)

- [x] 3.1 Create `components/ui/Button.tsx` — variants, sizes, loading state
- [x] 3.2 Create `components/ui/Input.tsx` — label, error, iconLeft, type variants
- [x] 3.3 Create `components/ui/Modal.tsx` — overlay with ESC/backdrop close
- [x] 3.4 Create `components/ui/Table.tsx` — generic `<T>` columns, loading skeleton, empty state (PR #2)
- [x] 3.5 Create `components/ui/Pagination.tsx` — prev/next with boundary disable (PR #2)
- [x] 3.6 Create `components/ui/SearchBar.tsx` — debounced 300ms onChange, clear button (PR #2)

## Phase 4: Layouts

- [x] 4.1 Create `components/layout/RootLayout.tsx` — header + nav + `<Outlet />` + logout
- [x] 4.2 Create `components/layout/AuthLayout.tsx` — centered card for login/register

## Phase 5: Auth Pages (PR #2)

- [x] 5.1 Create `pages/Login.tsx` — form with validation, loading, inline errors
- [x] 5.2 Create `pages/Register.tsx` — form validation, auto-login on success

## Phase 6: Customer Pages (PR #3)

- [x] 6.1 Create `pages/customers/CustomerList.tsx` — paginated table + search + create/delete
- [x] 6.2 Create `pages/customers/CreateCustomerModal.tsx` — modal form for new customer
- [x] 6.3 Create `pages/customers/CustomerDetail.tsx` — info card + contacts table + add contact
- [x] 6.4 Create `pages/customers/CustomerInfoCard.tsx` — read-only customer info with inline edit
- [x] 6.5 Create `pages/customers/ContactsTable.tsx` — contacts list with delete
- [x] 6.6 Create `pages/customers/AddContactModal.tsx` — modal form for new contact

## Phase 7: Routing + Wiring

- [x] 7.1 Modify `main.tsx` — wrap `<App />` with `<AuthProvider>`
- [x] 7.2 Modify `App.tsx` — routes: `/login`, `/register`, `/customers`, `/customers/:id`, `/`→`/customers`, `*`→NotFound
- [x] 7.3 Add `ProtectedRoute` wrapper — redirects to `/login` when unauthenticated
- [x] 7.4 Run `pnpm typecheck --filter @crm/web` + `pnpm lint`
- [x] 7.5 Mark tasks in tasks.md
