# Magic Link Auth Specification

**Domain**: `magic-link-auth`

## Purpose

Enable passwordless authentication via email magic links. The system generates time-limited tokens, stores them in the database, and issues JWT cookies upon successful verification.

## Requirements

### Requirement: Magic Link Request

The system MUST accept an email address, generate a cryptographically secure token, store it in the database with an expiry time (15 minutes), and return success regardless of whether the email exists (to prevent enumeration).

**Affected domain**: magic-link-auth

#### Scenario: Request magic link for valid email

- GIVEN a registered user with email `user@example.com`
- WHEN they POST to `/auth/magic-link/request` with that email
- THEN a token is generated and stored in the database with a 15-minute expiry
- AND the response is `200 OK`

#### Scenario: Request magic link for unregistered email

- GIVEN an email that is NOT registered
- WHEN they POST to `/auth/magic-link/request` with that email
- THEN the system MUST return `200 OK` (same response as valid email)
- AND no token is stored

### Requirement: Magic Link Verification

The system MUST accept a token, validate it, and issue JWT cookies if valid. The token MUST be single-use and marked as consumed upon verification.

**Affected domain**: magic-link-auth

#### Scenario: Valid magic link

- GIVEN a valid unexpired magic link token
- WHEN they POST to `/auth/magic-link/verify` with the token
- THEN the token is marked as consumed
- AND HTTP-only cookies for access and refresh tokens are set
- AND the response is `200 OK`

#### Scenario: Expired magic link

- GIVEN a magic link token that was created more than 15 minutes ago
- WHEN they POST to `/auth/magic-link/verify` with that token
- THEN the system MUST return `410 Gone`

#### Scenario: Already used magic link

- GIVEN a magic link token that has already been consumed
- WHEN they POST to `/auth/magic-link/verify` with that token
- THEN the system MUST return `410 Gone`

#### Scenario: Invalid token format

- GIVEN a token string that does not match the expected format or does not exist in the database
- WHEN they POST to `/auth/magic-link/verify` with that token
- THEN the system MUST return `400 Bad Request`
