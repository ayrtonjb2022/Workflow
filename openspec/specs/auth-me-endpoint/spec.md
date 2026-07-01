# Auth Me Endpoint Specification

## Purpose

Validates the user's session on page load or app boot. Returns current user identity and permissions without rotating tokens.

## Requirements

| ID | Requirement | Strength |
|----|------------|----------|
| AME-1 | The system MUST expose `GET /auth/me` as a public Fastify route | MUST |
| AME-2 | The system MUST read the `access_token` from the httpOnly cookie | MUST |
| AME-3 | The system MUST return `401` when no cookie is present | MUST |
| AME-4 | The system MUST return `401` when the token is expired or malformed | MUST |
| AME-5 | The system MUST return `200` with a JSON body containing `{ id, email, name, tenantId, roles, permissions }` when valid | MUST |
| AME-6 | The system MUST NOT rotate the refresh token or issue a new access token | MUST |
| AME-7 | The system MUST include the tenant-scoped roles and permissions in the response | MUST |

### Scenario 1: Valid session returns user data

- GIVEN a valid `access_token` cookie from an authenticated session
- WHEN the client sends `GET /auth/me`
- THEN the response status is `200`
- AND the body contains `id`, `email`, `name`, `tenantId`, `roles`, and `permissions`

### Scenario 2: No cookie returns 401

- GIVEN no `access_token` cookie is present
- WHEN the client sends `GET /auth/me`
- THEN the response status is `401`

### Scenario 3: Expired token returns 401

- GIVEN an `access_token` that has expired
- WHEN the client sends `GET /auth/me`
- THEN the response status is `401`
- AND the refresh token is NOT consulted or rotated

### Scenario 4: Malformed token returns 401

- GIVEN an `access_token` with an invalid signature or structure
- WHEN the client sends `GET /auth/me`
- THEN the response status is `401`

### Scenario 5: Read-only — no side effects

- GIVEN a valid `access_token` cookie
- WHEN the client sends `GET /auth/me`
- THEN no new tokens are issued and no session state is mutated
