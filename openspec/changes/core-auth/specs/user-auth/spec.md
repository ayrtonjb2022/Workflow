# User Auth Specification

**Domain**: `user-auth`

## Purpose

Handle user registration, login, logout, and JWT-based session management with refresh token rotation.

## Requirements

### Requirement: User Registration

The system MUST allow a new user to register by providing `name`, `email`, `password`, and `companyName`. A new Tenant MUST be created with the provided `companyName`, and the user MUST be assigned the `admin` role within that tenant. A set of HTTP-only cookies (access token + refresh token) MUST be returned on success.

**Affected domain**: user-auth

#### Scenario: Successful registration

- GIVEN a user provides `name`, `email`, `password`, and `companyName` that are all valid
- WHEN they POST to `/auth/register`
- THEN a new Tenant is created with `companyName`
- AND the user is created with the `admin` role in that tenant
- AND the response includes HTTP-only cookies for access and refresh tokens
- AND the response status is `201 Created`

#### Scenario: Duplicate email

- GIVEN a user with email `test@example.com` already exists
- WHEN another user registers with the same email
- THEN the system MUST return `409 Conflict`
- AND the response MUST include an error message indicating the email is already in use

### Requirement: User Login

The system MUST authenticate a user by `email` and `password`. On success, a new access token (short-lived, 15 min) and refresh token (long-lived, 7 days) MUST be issued via HTTP-only cookies.

**Affected domain**: user-auth

#### Scenario: Successful login

- GIVEN a registered user with valid credentials
- WHEN they POST to `/auth/login` with correct `email` and `password`
- THEN the system returns `200 OK`
- AND HTTP-only cookies for access and refresh tokens are set

#### Scenario: Invalid credentials

- GIVEN a registered user
- WHEN they POST to `/auth/login` with an incorrect password
- THEN the system MUST return `401 Unauthorized`

### Requirement: Token Refresh Rotation

The system MUST support refresh token rotation: each time a refresh token is used, the old refresh token MUST be invalidated and a new one issued. Old refresh tokens MUST be stored in the `RefreshToken` table to detect token reuse.

**Affected domain**: user-auth

#### Scenario: Concurrent refresh detection

- GIVEN a user has a valid refresh token
- WHEN an attacker uses a stolen refresh token AFTER the legitimate user already refreshed
- THEN the system MUST detect reuse, invalidate ALL refresh tokens for that user
- AND force re-authentication

### Requirement: Logout

The system MUST clear the HTTP-only cookies and invalidate the refresh token when a user logs out.

**Affected domain**: user-auth

#### Scenario: Successful logout

- GIVEN an authenticated user with valid session cookies
- WHEN they POST to `/auth/logout`
- THEN the cookies are cleared
- AND the refresh token is marked as used in the database

#### Scenario: Expired token refresh

- GIVEN a user's refresh token has expired (beyond 7 days)
- WHEN they attempt to refresh
- THEN the system MUST return `401 Unauthorized`
- AND the user MUST login again
