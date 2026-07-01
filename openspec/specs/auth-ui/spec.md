# Auth UI Specification

## Purpose

Login and Register pages that authenticate users via the API and redirect to the main app.

## Requirements

| ID | Requirement | Strength |
|----|------------|----------|
| AU-1 | `/login` route MUST be public — no auth guard redirect | MUST |
| AU-2 | Login form MUST collect `email` (required, email format) and `password` (required, min 6 chars) | MUST |
| AU-3 | Login form MUST show inline validation errors below each field | MUST |
| AU-4 | On submit, the system MUST send `POST /api/auth/login` via the HTTP client | MUST |
| AU-5 | On success, the system MUST store user in AuthProvider context and redirect to `/customers` | MUST |
| AU-6 | On API error (wrong credentials, network error), the system MUST show an inline error above the form | MUST |
| AU-7 | `/register` route MUST be public | MUST |
| AU-8 | Register form MUST collect `name`, `email`, `password`, `companyName` (all required) | MUST |
| AU-9 | On register success, the system MUST auto-login and redirect to `/customers` | MUST |
| AU-10 | The submit button MUST show a loading spinner while the request is in flight | MUST |
| AU-11 | Both pages MUST provide a link to switch between login and register | MUST |
| AU-12 | Both pages MUST use the `AuthLayout` (centered card) | MUST |

### Scenario 1: Successful login

- GIVEN valid credentials
- WHEN the user submits the login form
- THEN `POST /api/auth/login` is called
- AND the user is stored in AuthProvider context
- AND the browser navigates to `/customers`

### Scenario 2: Wrong credentials

- GIVEN invalid email or password
- WHEN the user submits the login form
- THEN an inline error message is displayed above the form
- AND the user stays on `/login`

### Scenario 3: Client-side validation fails

- GIVEN an empty email field or password shorter than 6 characters
- WHEN the user submits the login form
- THEN the request is NOT sent
- AND inline validation errors are shown per field

### Scenario 4: Successful registration

- GIVEN valid registration data
- WHEN the user submits the register form
- THEN `POST /api/auth/register` is called
- AND the user is auto-logged in and redirected to `/customers`

### Scenario 5: Loading state

- GIVEN the user has submitted the form
- WHEN the API request is in flight
- THEN the submit button shows a spinner and is disabled
