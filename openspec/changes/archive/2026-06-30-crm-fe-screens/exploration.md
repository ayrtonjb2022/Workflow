# Exploration: CRM Frontend Screens v1

## Current State

### Web Scaffold (`apps/web/src/`)

The frontend is in early scaffold state — 5 files total, no business logic:

| File | Role |
|------|------|
| `main.tsx` | Entry point: renders `<App/>` wrapped in `<QueryClientProvider>` |
| `App.tsx` | Routes: `createBrowserRouter` with `RootLayout` → `Welcome` (index) + `NotFound` (*) |
| `layouts/RootLayout.tsx` | Shell: header + `<Outlet/>` inside `max-w-7xl` container, `bg-gray-50` |
| `pages/Welcome.tsx` | Landing page: 3-card grid (CRM, Ventas, Inventario) |
| `pages/NotFound.tsx` | 404 page with link back to `/` |
| `styles.css` | Single line: `@import "tailwindcss"` |

**TanStack Query Client**: created in `main.tsx` with defaults, wraps `<App/>`. No hooks or prefetches exist yet.

**Vite config**: React plugin + Tailwind CSS 4 plugin (`@tailwindcss/vite`). Dev server on port 5173 with `/api` proxy → `localhost:3000`.

**No HTTP client** is configured — no `fetch` wrapper, no `axios`, no interceptor setup.

### Auth API Contract (already implemented)

Four endpoints behind `POST /api/auth/*` — no auth guard, no RBAC:

| Endpoint | Request Body | Response | Cookie Side-Effect |
|----------|-------------|----------|-------------------|
| `POST /auth/register` | `{ email, password, name, companyName }` | `{ id, email, name }` | `access_token` (900s), `refresh_token` (7d) |
| `POST /auth/login` | `{ email, password }` | `{ id, email, name }` | `access_token` (900s), `refresh_token` (7d) |
| `POST /auth/logout` | (none, reads cookie) | `{ message: "Logged out" }` | Clears both cookies |
| `POST /auth/refresh` | (none, reads cookie) | `{ id, email, name }` | Rotates both cookies |

**Cookie details**:
- `access_token`: httpOnly, secure in prod, sameSite=lax, 15min expiry (JWT with `{ userId, email, tenantId }`)
- `refresh_token`: httpOnly, secure in prod, sameSite=lax, 7 day expiry (DB-stored random token with rotation)
- Both set on `/` path
- On refresh, old refresh token is revoked and new one issued (rotation)

The `login` response `result.user` contains `{ id: string, email: string, name: string }` — notably **no** `tenantId` in the user object (it's in the JWT but not returned in the response body).

### Customers API Contract (already implemented)

All under `GET/POST/PATCH/DELETE /api/customers` — guarded by `authGuard` preHandler with RBAC (`customers:read`, `customers:create`, `customers:update`, `customers:delete`).

**List endpoint** (`GET /api/customers`):
- Query params: `?page=1&limit=20&search=term`
- Response shape:
  ```json
  {
    "data": [{ "id": "...", "name": "...", "email": "...", "phone": "...", "documentType": "DNI|CUIT|PASSPORT", "documentNumber": "...", "address": "...", "active": true, "branchId": "...", "branch": { "id": "...", "name": "..." }, "createdAt": "...", "updatedAt": "..." }],
    "total": 50,
    "page": 1,
    "limit": 20
  }
  ```
- Search: case-insensitive contains on `name`, `email`, `documentNumber` (via Prisma `mode: "insensitive"`)
- Default pagination: page=1, limit=20
- Ordered by `createdAt desc`
- Soft-deleted customers (`active: false`) are excluded from list by default (Prisma `where` doesn't filter `active` explicitly — confirmed by checking repo: the `findAll` where clause only filters `tenantId` and optionally `search`)

**Create endpoint** (`POST /api/customers`):
- Required: `name`, `documentType` (DNI|CUIT|PASSPORT), `documentNumber`
- Optional: `email`, `phone`, `branchId`, `address`
- Duplicate email and duplicate documentNumber within tenant → 409
- Returns created customer object

**Update endpoint** (`PATCH /api/customers/:id`):
- All fields optional
- 404 if not found or wrong tenant

**Delete endpoint** (`DELETE /api/customers/:id`):
- Soft deactivate: sets `active: false`
- 200 (not 204) returns updated customer
- Idempotent on already deactivated

**Contact sub-resources** (`GET/POST/DELETE /api/customers/:id/contacts`):
- Minimum: `name` required, `email`, `phone`, `position` optional
- Customer must be active and in caller's tenant (checked by parent customer lookup)
- Delete returns 204 No Content

### OpenSpec Structure

The project has 10 domain specs and 2 completed changes (`core-auth`, `scaffold-erp`). The `core-auth` change covers API auth only — no frontend auth screens. Customer and contact specs exist for API behavior only. No frontend UI specs exist anywhere.

---

## Analysis: Screens Needed for v1 CRM Frontend

### 1. Auth Flow

**Screens needed**:
- **Login page** (`/login`): email + password form, submit → POST /auth/login → store user context → redirect to `/customers`
- **Register page** (`/register`): email + password + name + companyName → POST /auth/register → auto-login → redirect to `/customers`

**Auth state**: The API uses httpOnly cookies — the frontend never touches the JWT directly. This means:
- On app load, we can't inspect a cookie to know if the user is logged in
- Strategy: hit `POST /auth/refresh` on app boot — if it succeeds, user is authenticated; if it fails (401), show login
- Or simpler: check auth on mount of protected routes via a query to a "me" endpoint... but there's no `/auth/me` endpoint. Only refresh tells us.
- **Decision needed**: either add `/auth/me` to the API, or use refresh-as-healthcheck approach.

**Route protection**: React Router 7 supports `loader` functions that can check auth before rendering a route. However, TanStack Query is already set up — we could use a custom hook (`useAuth`) that queries `/auth/refresh` on mount.

### 2. Customer List Screen

**Single main screen**: `/customers`

**Components**:
- **Data table**: columns for Name, Email, Phone, Document Type/Number, Actions
- **Search bar**: text input → debounced query parameter → refetch list
- **Pagination**: page controls, page size selector (10/20/50)
- **Create modal/drawer**: form with Name, Email, Phone, Document Type (select), Document Number, Address
- **Delete confirmation**: confirm dialog → soft delete → refresh list
- **Row actions**: Edit (→ modal or inline), Delete

### 3. Customer Detail Screen

`/customers/:id` — shows customer info + contacts sub-list.

**Sections**:
- Customer info card (read-only or editable inline)
- Contacts table for that customer
- Add contact modal

### 4. Routing Structure

```
/
├── login          → LoginPage (public)
├── register       → RegisterPage (public)
├── customers      → CustomerListPage (protected, customers:read)
├── customers/:id  → CustomerDetailPage (protected, customers:read)
└── *              → NotFoundPage
```

The `RootLayout` should:
- Show a nav/sidebar when authenticated (Dashboard, Customers, etc.)
- Show a minimal layout (just the form) for public auth pages
- Load auth state early via a root loader

### 5. Component Tree

```
<App>
  <QueryClientProvider>
    <RouterProvider>
      <RootLayout>              // auth-aware shell
        ├── <AuthProvider>      // context: user, logout, isLoading
        ├── <Sidebar>           // nav links (visible when authed)
        └── <Outlet />
            ├── <LoginPage>     // LoginForm
            ├── <RegisterPage>  // RegisterForm
            ├── <CustomerListPage>
            │   ├── <SearchBar>
            │   ├── <CustomerTable>
            │   │   └── rows → <CustomerRow>
            │   ├── <Pagination>
            │   └── <CreateCustomerModal>
            │       └── <CustomerForm>
            ├── <CustomerDetailPage>
            │   ├── <CustomerInfoCard>
            │   ├── <ContactsTable>
            │   └── <AddContactModal>
            └── <NotFoundPage>
```

### 6. State Management

Three options:

| Approach | Tradeoff |
|----------|----------|
| **TanStack Query for everything** | Consistent caching, automatic refetch, loading/error states built-in. Auth state as a React context + query. Simple. |
| React Router loaders + TanStack Query | Loaders for initial data (SSR-ready pattern), TQ for mutations/refetches. More boilerplate but separates initial fetch from interactive updates. |
| React Router loaders only | Works but loses TQ's caching, retry, and background refetch. |

**Recommendation**: TanStack Query for everything. The app doesn't need SSR (Vite SPA). React Router loaders add ceremony without benefit here. Auth state via a small React context (`useAuth()`) that wraps the refresh query and provides `user`, `login()`, `logout()`, `isAuthenticated`.

### 7. HTTP Client Setup

Need a thin fetch wrapper because:
- All requests go through Vite proxy (`/api/*`)
- Cookies are sent automatically with `credentials: "include"` (httpOnly, so no manual token header)
- Need consistent error handling: unwrap 401 → redirect to login, unwrap 403 → show forbidden, unwrap validation errors → show field messages

```ts
// lib/api.ts
const BASE = "/api"

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    if (res.status === 401) { /* redirect to login */ }
    if (res.status === 403) { /* show forbidden */ }
    const error = await res.json().catch(() => ({ message: "Unknown error" }))
    throw new ApiError(res.status, error)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}
```

### 8. Missing API Endpoints Discovered

| Missing | Why needed | Workaround |
|---------|------------|------------|
| `GET /auth/me` | On app boot we need to know if session is valid | Could use `/auth/refresh` as healthcheck (side-effect: rotates tokens on every page load — wasteful). **Recommend adding a lightweight `/auth/me` that validates the access_token and returns user info.** |
| `PUT /customers/:id` | The API only has `PATCH`. For full-update forms this is fine. | PATCH works for partial updates. |
| `PATCH /customers/:id/contacts/:contactId` | No update endpoint for contacts — only create and delete. | Defer to v2, or implement now since the CRUD is nearly complete. |

---

## Screens Flow Diagram

```
[App Load]
    │
    ├─ POST /auth/refresh? ── 401 ──→ [Login Page]
    │                                  │
    │                              email + password
    │                                  │
    │                              POST /auth/login
    │                                  │
    │                              ← { user } + cookies
    │                                  │
    │                              redirect → [/customers]
    │
    └─ 200 ──→ [Customer List] ←──────┘
                  │
                  ├── search → query params → refetch
                  ├── create → modal → POST /customers → invalidate list
                  ├── click row → /customers/:id
                  │                 │
                  │                 ├── customer info card
                  │                 ├── contacts list
                  │                 └── add contact → POST /contacts
                  └── delete → confirm → DELETE /customers/:id → invalidate
```

## Recommendations Summary

1. **HTTP Client**: Create `lib/api.ts` with `credentials: "include"`, JSON defaults, error unwrapping, and 401→redirect logic
2. **Auth**: Add `AuthProvider` React context wrapping `useQuery` on `/auth/refresh` for boot auth check. `useAuth()` hook exposes `user`, `isAuthenticated`, `login()`, `logout()`, `isLoading`
3. **Routing**: `createBrowserRouter` with public routes (login, register) and protected routes (customers) using a `ProtectedRoute` wrapper or loader guard
4. **Layout**: Modify `RootLayout` to be auth-aware — show sidebar when authenticated, minimal when not
5. **Customers list**: TanStack Query `useQuery` for paginated list, `useMutation` for create/delete, debounced search
6. **Customer detail**: `useQuery` for single customer, nested query for contacts
7. **Missing `/auth/me`**: Add this lightweight endpoint to avoid refresh-on-boot token rotation
8. **State management**: TanStack Query for server state, React context for auth — no Redux or Zustand needed for v1

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `apps/web/src/lib/api.ts` | New | Fetch wrapper with credentials, error handling, 401 redirect |
| `apps/web/src/lib/auth.ts` | New | Auth context + provider + hook |
| `apps/web/src/App.tsx` | Modified | Add new routes (login, register, customers, customer detail) |
| `apps/web/src/layouts/RootLayout.tsx` | Modified | Auth-aware shell with sidebar nav |
| `apps/web/src/layouts/AuthLayout.tsx` | New | Minimal layout for login/register (no sidebar) |
| `apps/web/src/pages/Login.tsx` | New | Login form page |
| `apps/web/src/pages/Register.tsx` | New | Registration form page |
| `apps/web/src/pages/CustomerList.tsx` | New | Customer list with table, search, pagination |
| `apps/web/src/pages/CustomerDetail.tsx` | New | Customer detail with contacts |
| `apps/web/src/components/ui/` | New | Shared UI primitives (Button, Input, Modal, Table, Pagination) |
| `apps/web/src/components/customers/` | New | Customer-specific components (CustomerForm, CustomerTable, ContactsTable) |
| `apps/web/src/hooks/useAuth.ts` | New | Auth hook wrapping context |
| `apps/web/src/hooks/useCustomers.ts` | New | TanStack Query hooks for customer CRUD |
| `apps/api/src/routes/auth.ts` | Modified (optional) | Add `GET /auth/me` endpoint for session validation |

## Ready for Proposal

Yes. The exploration is complete — API contracts are understood, scaffold state is known, component tree is designed, and the approach is clear. Next phase: **sdd-propose** to formalize the change scope and approach.

---

## Key Decisions Made During Exploration

1. **TanStack Query over React Router loaders** — since we're in a Vite SPA (no SSR), TQ gives us caching, refetch, mutations, and loading states with less ceremony than loaders.
2. **Auth via React Context + TQ** — `AuthProvider` wraps the app, calls refresh on mount, exposes `login`/`logout` functions. Simple, no external auth library needed.
3. **No `/auth/me` → must add it** — the only way to validate a session is to call refresh, which rotates tokens. Add a read-only `/auth/me` that decodes the access_token and returns `{ user, tenant }`.
4. **No UI library** — v1 will use hand-rolled Tailwind components (Button, Input, Modal, Table) to keep deps minimal. Can swap to Radix/Headless later if complexity grows.
5. **Pagination handled server-side** — the API already returns `{ data, total, page, limit }` — the client just passes `?page=&limit=` params.
