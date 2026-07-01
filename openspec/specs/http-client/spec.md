# HTTP Client Specification

## Purpose

Thin typed fetch wrapper used by all frontend services. Provides consistent error handling, JSON parsing, and automatic redirect on auth failure.

## Requirements

| ID | Requirement | Strength |
|----|------------|----------|
| HC-1 | The system MUST expose a function `api<T>(url, options?)` with generic response typing | MUST |
| HC-2 | The system MUST resolve the base path from `VITE_API_URL` env var, falling back to `/api` | MUST |
| HC-3 | The system MUST send `credentials: "include"` on every request | MUST |
| HC-4 | The system MUST parse JSON responses automatically | MUST |
| HC-5 | The system MUST throw a structured `AppError` with `{ status, message, code }` on non-2xx responses | MUST |
| HC-6 | The system MUST redirect to `/login` on `401` unless the current path is already `/login` | MUST |
| HC-7 | The system MUST prefix request paths with the base path | MUST |
| HC-8 | The system MUST set `Content-Type: application/json` when a body is provided | MUST |
| HC-9 | The system SHOULD accept typed request body via `options.body` | SHOULD |

### Scenario 1: Successful GET request

- GIVEN a valid endpoint `/api/auth/me`
- WHEN calling `api<UserResponse>('/auth/me')`
- THEN the response is parsed as `UserResponse` and returned
- AND no error is thrown

### Scenario 2: Non-2xx throws AppError

- GIVEN an endpoint that returns `400` with `{ message: "Validation failed", code: "VALIDATION_ERROR" }`
- WHEN calling `api('/customers', { body: { } })`
- THEN an `AppError` is thrown with `{ status: 400, message: "Validation failed", code: "VALIDATION_ERROR" }`

### Scenario 3: 401 redirects to /login

- GIVEN an endpoint that returns `401`
- WHEN calling `api('/customers')` from path `/customers`
- THEN an `AppError` is thrown
- AND the browser navigates to `/login`

### Scenario 4: 401 on /login does NOT redirect

- GIVEN an endpoint that returns `401`
- WHEN calling `api('/auth/login')` from path `/login`
- THEN an `AppError` is thrown
- AND the browser does NOT navigate away from `/login`

### Scenario 5: Network error is re-thrown

- GIVEN the server is unreachable
- WHEN calling `api('/auth/me')`
- THEN an `AppError` is thrown with the original network error as cause
