# Proposal: CRM Frontend Screens

## Intent

Build CRM frontend v1 — auth screens (login/register) and customer management UI (list, detail, contacts). The backend is fully specified but has no frontend views. Users currently have no way to interact with the system through a browser.

## Scope

### In Scope
- Backend: `GET /auth/me` endpoint to validate session on boot
- Frontend: HTTP client, AuthProvider, UI component primitives
- Login + Register pages with client-side validation
- Customer list (paginated table, search, create modal)
- Customer detail (info card, contacts table, add contact modal)
- Root layout with sidebar + header shell

### Out of Scope
- Automated tests (greenfield — no test runner configured)
- Excel import/export UI (spec exists but deferred)
- Supplier UI (separate domain, deferred)
- Contact update/delete (read + create only in v1)
- Mobile responsiveness
- Password reset / forgot password flows

## Capabilities

### New Capabilities
- `auth-ui`: Login + Register pages with form validation and error handling
- `customer-list-ui`: Paginated table with search, create modal, tenant-scoped
- `customer-detail-ui`: Customer info card + contacts table + add contact modal
- `auth-me-endpoint`: `GET /auth/me` — validates session, returns current user
- `http-client`: Thin fetch wrapper with cookie credentials and error handling
- `ui-components`: Reusable Button, Input, Modal, Table, Pagination, SearchBar

### Modified Capabilities
None — new UI only; existing API specs (customer-management, contact-management) are unchanged at the requirement level.

## Approach

1. **Backend first**: Add `GET /auth/me` to `apps/api` (Fastify route + TypeBox schema) with tenant & user info from session
2. **HTTP client**: `lib/api.ts` — fetch wrapper that sends `credentials: "include"`, parses JSON, throws typed errors
3. **Auth layer**: `lib/auth.tsx` — React context that calls `/auth/me` on mount, provides user + login/logout/register actions
4. **UI primitives**: `components/ui/` — stateless components (Button, Input, Modal, Table, Pagination, SearchBar)
5. **Layouts**: `RootLayout` (sidebar + header + outlet), `AuthLayout` (centered card for login/register)
6. **Pages**: Login, Register, CustomerList, CustomerDetail — lazy-loaded via React Router

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `apps/api/src/routes/auth/me.ts` | New | `GET /auth/me` route |
| `apps/api/src/routes/auth/index.ts` | Modified | Register new route |
| `apps/web/src/lib/api.ts` | New | Fetch wrapper |
| `apps/web/src/lib/auth.tsx` | New | AuthProvider + useAuth |
| `apps/web/src/components/ui/` | New | 6 stateless components |
| `apps/web/src/components/layout/` | New | RootLayout, AuthLayout |
| `apps/web/src/pages/` | New | 4 page components |
| `apps/web/src/App.tsx` | Modified | Add routes for new pages |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `GET /auth/me` not implemented when frontend starts | Low | Backend-first order; ~20 LoC |
| Token refresh race on page load | Low | `/auth/me` reads existing session — no refresh needed |
| Tenant isolation bypass via frontend | Low | All tenant checks are server-side; UI shows only returned data |

## Rollback Plan

- Revert `apps/api/src/routes/auth/me.ts` and revert route registration
- Revert all `apps/web/src/` additions — no migration state involved

## Dependencies

- `GET /auth/me` must exist on the API before frontend auth layer works
- Requires the session/auth middleware already registered in `apps/api`

## Success Criteria

- [ ] User can register, log in, see the customer list, view customer detail
- [ ] `/auth/me` returns 200 with user data when session is valid
- [ ] Empty states render correctly (no customers, no contacts)
- [ ] API errors show inline messages on forms
