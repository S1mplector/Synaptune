# Simbeat

A binaural beat simulator web tool, structured as a monorepo using Clean Architecture principles.

## Architecture Overview

Layers (inside-out dependency direction):

- Domain (`packages/domain`)
  - Pure business logic: entities, value objects, domain services, repository interfaces.
  - No framework or IO dependencies.
- Application (`packages/application`)
  - Use cases (interactors), DTOs, and ports.
  - Orchestrates domain logic and repository interfaces. Depends only on Domain.
- Infrastructure (`packages/infrastructure`)
  - Adapters and concrete implementations for repositories, audio engines, persistence, and external services.
  - Depends on Application and Domain.
- Interface / Web (`apps/web`)
  - UI and delivery mechanism. Talks to Application via adapters.
  - Depends on Application.

Dependency Rule: Inner layers must not depend on outer layers. Outer layers can depend inward.

## Repository Layout

- `packages/domain`
- `packages/application`
- `packages/infrastructure`
- `apps/web`

Shared root configuration lives at the top-level: `tsconfig.base.json`, ESLint, Prettier, etc.

## Getting Started

1. Install dependencies (uses npm workspaces):
   ```bash
   npm install
   ```
2. Useful scripts:
   ```bash
   npm run build      # build all packages
   npm run typecheck  # type-check all workspaces
   npm run lint       # lint all packages
   npm run format     # format with Prettier
   ```

We keep the web app minimal for now. In a later step, we'll scaffold a full Vite (React/TS) app and wire it to the application layer.

## Development Workflow

- Add or modify domain rules in `packages/domain` first.
- Implement use cases in `packages/application`.
- Add adapters/implementations in `packages/infrastructure`.
- Integrate with UI in `apps/web`.

## Contribution Guidelines

- Write pure, deterministic domain logic without side effects.
- Keep boundaries explicit: define interfaces (ports) in inner layers and implement in outer layers.
- Prefer small, focused modules and functions.
- Enforce formatting and linting via provided configs and CI.
