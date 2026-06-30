# Project Setup Specification

## Purpose

Establish the monorepo foundation — pnpm workspaces, Turborepo pipeline, shared TypeScript configuration, and code quality tooling — that every other workspace builds upon.

## Requirements

### Requirement: PNPM Workspace Structure

The repository MUST define a pnpm workspace with `apps/` for deployable projects and `packages/` for shared libraries.

#### Scenario: Workspace resolution

- GIVEN a root `pnpm-workspace.yaml`
- WHEN `pnpm install` runs from the root
- THEN all packages under `apps/*` and `packages/*` MUST be resolved and linked

#### Scenario: Workspace root isolation

- GIVEN the workspace is installed
- WHEN `pnpm ls --depth -1` runs
- THEN no dependency graph hoisting errors MUST appear

### Requirement: Turborepo Pipeline

The project MUST define a Turborepo pipeline with `build`, `lint`, `dev`, and `test` tasks respecting inter-package dependency order.

#### Scenario: Build dependency order

- GIVEN workspaces `@crmerp/db`, `@crmerp/api`, `@crmerp/web`
- WHEN `turbo run build` executes
- THEN `@crmerp/db` MUST build before `@crmerp/api`, and `@crmerp/api` before `@crmerp/web` where configured

#### Scenario: Dev mode parallel execution

- GIVEN `turbo run dev` is invoked
- THEN all workspaces SHOULD start in parallel without blocking each other

### Requirement: Shared TypeScript Configuration

The root MUST provide a base `tsconfig.json` extended by every workspace.

#### Scenario: Configuration inheritance

- GIVEN a workspace `tsconfig.json` with `"extends": "../../tsconfig.base.json"`
- WHEN TypeScript compiles
- THEN it MUST resolve path aliases, strict mode, and target settings from the base config

#### Scenario: Workspace override

- GIVEN a workspace needs different `target` or `module`
- WHEN it declares overrides in its own `compilerOptions`
- THEN those overrides MUST take precedence over the base config

### Requirement: ESLint and Prettier Configuration

The root MUST provide shared ESLint and Prettier configs for consistent code style across all workspaces.

#### Scenario: Lint consistency

- GIVEN a TypeScript file in any workspace
- WHEN `pnpm lint` runs
- THEN the file MUST be validated against the shared ESLint config

#### Scenario: Format enforcement

- GIVEN any source file
- WHEN `pnpm format` runs
- THEN Prettier MUST format it according to the root `.prettierrc`
