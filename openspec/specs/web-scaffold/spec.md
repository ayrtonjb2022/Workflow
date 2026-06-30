# Web Scaffold Specification

## Purpose

Scaffold the React + Vite application with routing skeleton, Tailwind CSS 4 styling, and API proxy configuration for local development.

## Requirements

### Requirement: Vite Dev Server

The application MUST boot a Vite dev server with the React plugin enabled.

#### Scenario: Dev server start

- GIVEN the workspace root
- WHEN `pnpm dev` runs
- THEN Vite MUST start on port `5173` (or `PORT` env override)

#### Scenario: HMR

- GIVEN the dev server is running
- WHEN a source file is modified
- THEN the browser MUST hot-reload without a full page refresh

### Requirement: React Router 7 Routing Skeleton

The application MUST define a route tree with lazy-loaded layout and page modules.

#### Scenario: Public routes

- GIVEN the app loads at `/`
- WHEN the root route matches
- THEN it MUST render a `Layout` component with an `<Outlet />` for child routes

#### Scenario: 404 fallback

- GIVEN a request to `/nonexistent`
- WHEN no route matches
- THEN the router MUST render a `NotFoundPage` component with HTTP 404 status

#### Scenario: Lazy module loading

- GIVEN a route for `/dashboard`
- WHEN the user navigates to it
- THEN the `DashboardPage` component MUST be loaded asynchronously via `React.lazy` or a React Router load function

### Requirement: Tailwind CSS 4 Integration

The app MUST compile Tailwind CSS utility classes and apply a base design token set.

#### Scenario: Utility compilation

- GIVEN a component with `className="flex items-center p-4"`
- WHEN the page renders in the browser
- THEN the utility classes MUST resolve to the correct CSS properties

#### Scenario: Design tokens

- GIVEN a custom color `primary-500` defined in the Tailwind config
- WHEN a component uses `bg-primary-500`
- THEN it MUST render with the configured hex value

### Requirement: API Proxy Configuration

The Vite config MUST proxy `/api/*` requests to the Fastify backend during development.

#### Scenario: Proxy forwarding

- GIVEN the Vite dev server runs on port `5173` and the API on port `3001`
- WHEN a fetch to `/api/health` is made from the browser
- THEN Vite MUST proxy the request to `http://localhost:3001/api/health`
