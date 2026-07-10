# Repository Guidelines

## Project Structure & Module Organization

This is a Keyloop technical assessment for Scenario B, the Intelligent Inventory Dashboard. It currently contains planning only: `README.md`, `CLAUDE.md`, `KeyloopCodingChallange.pdf`, and resources under `docs/`.

The intended implementation is two npm packages side by side:

- `app/` - Angular 22 frontend.
- `mock-server/` - `json-server` backend with deterministic seed data.
- `docs/` - design deliverables, best practices, and implementation plans.

Within `app/src/app/features/inventory/`, organize code by responsibility: `models/`, `domain/`, `data-access/`, `ui/`, and `feature/`. Keep shared services in `app/src/app/core/`.

## Build, Test, and Development Commands

There is no buildable app until scaffolding is complete. Afterward, use:

- `cd mock-server && npm run seed` - regenerate `db.json` deterministically.
- `cd mock-server && npm run serve` - run the mock API on port 3001.
- `cd app && npm start` - run the Angular app on port 4200.
- `cd app && npm test` - run Vitest via Angular CLI.
- `cd app && npm test -- --coverage` - generate coverage.
- `cd app && npx ng build --configuration production` - verify a production build.
- `cd app && npx playwright test` - run critical-path e2e tests.

## Coding Style & Naming Conventions

Follow `docs/best-practices.md` for Angular and TypeScript rules. Use Angular 22 defaults: standalone components, zoneless testing, `input()`/`output()` functions, `inject()` instead of constructor injection, and signals for state. Prefer `@Service()` singletons. Do not use `ngClass` or `ngStyle`.

Use 2-space indentation for TypeScript, HTML, CSS, and JSON. Component filenames omit `.component.` and class names omit the `Component` suffix, for example `aging-badge.ts` with class `AgingBadge`.

## Testing Guidelines

Use Vitest for unit and component tests. Place specs beside implementation files as `*.spec.ts`. Cover domain logic in `app/src/app/features/inventory/domain/`: aging-stock detection, filtering, KPI aggregation, and vehicle enrichment.

For Angular component tests, follow zoneless "Act, Wait, Assert": create the fixture, trigger state changes, then `await fixture.whenStable()`. Avoid manual `fixture.detectChanges()`.

## Commit & Pull Request Guidelines

The current history only has `Initial commit`, so use Conventional Commit style going forward, such as `feat: add inventory dashboard` or `test: cover aging-stock logic`.

Pull requests should include a summary, linked issue or task, test commands run, and screenshots for UI changes. Call out deviations from `docs/superpowers/plans/2026-07-09-intelligent-inventory-dashboard.md`.

## Agent-Specific Instructions

Before Angular implementation, read `CLAUDE.md`, `docs/best-practices.md`, and the master plan under `docs/superpowers/plans/`. Do not implement scenarios A, C, or D. Keep the backend mocked with `json-server` unless the user explicitly changes scope.
