# Design: CRM Frontend Screens

## Technical Approach

Backend-first: add `GET /auth/me` (read existing session via authGuard, enrich with roles/permissions), then build the frontend as a Vite SPA with React Router 7, TanStack Query for server state, and hand-rolled Tailwind 4 components. Auth state lives in React context (not TQ) since it must be available before query client bootstraps.

## Architecture Decisions

| Decision | Options | Choice | Rationale |
|----------|---------|--------|-----------|
| Auth boot check | `/auth/refresh` vs new `/auth/me` | **`GET /auth/me`** | `/auth/refresh` rotates tokens on every page load — wasteful. `/auth/me` is read-only, uses `authGuard` (already validates the cookie), just queries DB for enriched profile. |
| Auth state location | TanStack Query vs React context | **React context** | Auth is needed before route rendering, even to decide which layout to show. TQ depends on `QueryClientProvider` which wraps inside React tree. Context is simpler and available immediately. |
| UI components library | Radix/Headless vs hand-rolled | **Hand-rolled Tailwind 4** | Only 6 primitives needed. External libs add weight and API surface to learn. Swap later if needed. |
| Data fetching | React Router loaders vs TQ | **TanStack Query** | Vite SPA — no SSR. TQ gives caching, refetch, loading/error states, and mutation invalidation with less ceremony than loaders. |

## Backend: GET /auth/me

```
authGuard validates access_token cookie
  └─ sets request.userId, request.tenantId
      └─ route handler calls authService.getProfile(userId, tenantId)
          └─ queries DB: user + roles → rolePermissions → permission names
              └─ returns { id, email, name, tenantId, roles[], permissions[] }
```

**authRepository** gets a new method `findProfile(id, tenantId)` that includes roles and permissions. **authService** gets `getProfile()` that calls the repo and flattens role/permission names. The route is registered in `authRoutes` with `preHandler: app.authGuard`.

## Frontend Data Flow

```
App boots
  └─ AuthProvider mounts → api("/auth/me") via fetch (raw, no TQ)
      ├─ 200 → setUser(response) → children render
      └─ 401 → setUser(null) → children render → protected routes redirect to /login

CustomerList mounts
  └─ useQuery(["customers", { page, limit, search }], GET /api/customers)
      ├─ loading → Table skeleton
      ├─ error → error state with retry
      └─ success → Table + Pagination

CustomerDetail mounts
  ├─ useQuery(["customers", id], GET /api/customers/:id) → CustomerInfoCard
  └─ useQuery(["customers", id, "contacts"], GET /api/customers/:id/contacts) → ContactsTable
```

## Component Contracts

Every UI primitive is a **named export**, typed with TypeScript, stateless:

- **Button** — `{ variant: "primary"|"secondary"|"danger"|"ghost", size: "sm"|"md"|"lg", loading?: boolean, disabled?: boolean, children, onClick? }`
- **Input** — `{ label?: string, error?: string, iconLeft?: ReactNode, type: "text"|"email"|"password", value, onChange }`
- **Modal** — `{ open: boolean, onClose: () => void, title: string, children }` — ESC + backdrop click close
- **Table** — `<T extends Record<string, unknown>>{ columns: Column<T>[], data: T[], loading?: boolean, emptyMessage?: string }`
- **Pagination** — `{ currentPage, totalPages, onPageChange }` — prev/next disabled at boundaries
- **SearchBar** — `{ value, onChange: debounced(300ms), onClear }`

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `apps/api/src/routes/auth.ts` | Modify | Add `GET /auth/me` with `{ preHandler: [app.authGuard] }` |
| `apps/api/src/modules/auth/auth.repository.ts` | Modify | Add `findProfile(userId, tenantId)` — includes roles + permissions |
| `apps/api/src/modules/auth/auth.service.ts` | Modify | Add `getProfile(userId, tenantId)` — composes response |
| `apps/web/src/lib/api.ts` | Create | Typed fetch wrapper with `credentials: "include"`, `AppError`, 401→redirect |
| `apps/web/src/types/auth.ts` | Create | `User`, `LoginResponse`, `RegisterPayload` types |
| `apps/web/src/types/customer.ts` | Create | `Customer`, `PaginatedResponse<T>`, `Contact` types |
| `apps/web/src/providers/AuthProvider.tsx` | Create | `AuthContext` + `AuthProvider` + `useAuth` hook |
| `apps/web/src/components/ui/Button.tsx` | Create | Reusable button with variants and loading state |
| `apps/web/src/components/ui/Input.tsx` | Create | Labeled input with error message and optional icon |
| `apps/web/src/components/ui/Modal.tsx` | Create | Overlay modal with ESC/backdrop close |
| `apps/web/src/components/ui/Table.tsx` | Create | Generic data table with loading skeleton, empty state |
| `apps/web/src/components/ui/Pagination.tsx` | Create | Page controls with boundary-disabled buttons |
| `apps/web/src/components/ui/SearchBar.tsx` | Create | Debounced search input with clear button |
| `apps/web/src/components/layout/RootLayout.tsx` | Create | Sidebar + header + `<Outlet />` for authenticated pages |
| `apps/web/src/components/layout/AuthLayout.tsx` | Create | Centered card layout for login/register |
| `apps/web/src/pages/Login.tsx` | Create | Login form with validation, loading, error states |
| `apps/web/src/pages/Register.tsx` | Create | Register form, auto-login on success |
| `apps/web/src/pages/customers/CustomerList.tsx` | Create | Paginated table + search + create modal + delete |
| `apps/web/src/pages/customers/CustomerDetail.tsx` | Create | Info card + contacts table + add contact modal |
| `apps/web/src/pages/customers/CreateCustomerModal.tsx` | Create | Modal form for customer creation |
| `apps/web/src/pages/customers/CustomerInfoCard.tsx` | Create | Read-only customer info display |
| `apps/web/src/pages/customers/ContactsTable.tsx` | Create | Contacts table with delete |
| `apps/web/src/pages/customers/AddContactModal.tsx` | Create | Modal form for adding contacts |
| `apps/web/src/main.tsx` | Modify | Wrap `<App />` with `<AuthProvider>` |
| `apps/web/src/App.tsx` | Modify | Replace routes: `/login`, `/register`, `/customers`, `/customers/:id`, `/` redirect to `/customers` |

## Route Structure (React Router 7)

```
/login          → AuthLayout → Login
/register       → AuthLayout → Register
/customers      → RootLayout → CustomerList
/customers/:id  → RootLayout → CustomerDetail
/               → redirect to /customers
*               → NotFound
```

Protected routes check `useAuth().isAuthenticated` — if falsy, `<Navigate to="/login" />`. If truthy but API returns 403 for a specific action, the HTTP client throws an `AppError(403)` which the page handles inline.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `GET /auth/me` route handler + service | Fastify `inject()` test — mock authGuard, assert response shape |
| Unit | `api()` HTTP client | Mock `fetch`, assert error handling + redirect behavior |
| Unit | UI components | React Testing Library — render each component with props, assert DOM output |
| Integration | Auth flow | Mount `AuthProvider` + render protected route, assert redirect on 401 |

No test runner configured yet — tests are deferred per proposal.

## Migration / Rollout

No migration required. All new files; existing API routes unchanged. `/auth/me` is additive — existing clients unaffected.

## Open Questions

None.
