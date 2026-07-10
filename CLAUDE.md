# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

This is a take-home submission for Keyloop's technical assessment (`KeyloopCodingChallange.pdf`). The candidate must pick **one** of four scenarios, produce a System Design Document, and fully implement **one** service layer (frontend or backend) while mocking the other.

**Chosen scenario: B — The Intelligent Inventory Dashboard** (Domain: Supply). Do not implement Scenarios A (Unified Service Scheduler), C (Sales Lead Management), or D (Unified Document Viewer) — the PDF requires exactly one.

**Chosen service layer: Frontend**, fully implemented in Angular. The backend is mocked via `json-server` — one of the PDF's explicitly sanctioned mocking options.

Core requirements for Scenario B (verbatim from the PDF — do not weaken these):
1. **Inventory Visualization** — a filterable list of all vehicles in inventory (e.g. by make, model, age).
2. **Aging Stock Identification** — automatically identify and prominently display "aging stock" (vehicles in inventory **>90 days**).
3. **Actionable Insights** — allow a manager to log and **persist** a status/proposed action per aging vehicle.

## Current status

**Not yet implemented.** The repository currently contains the challenge PDF, a README stub, a fully detailed implementation plan, and a set of Angular guidance resources the user has added. Before writing any code, read:

- **`docs/superpowers/plans/2026-07-09-intelligent-inventory-dashboard.md`** — the master plan. 23 TDD tasks with complete code for every file (models, pure business-logic functions, HTTP services, the state store, UI components, mock-server seed data, tests). **This is the source of truth for how to build the app — follow it task-by-task rather than re-deriving the architecture.** It has been revised once already (originally targeted Angular 21 + `@ngrx/signals`; now targets **Angular 22** with a plain-signals store — see its "Angular 22 Revision" section for why, verified against the actual published npm packages, not assumed).
- **`docs/best-practices.md`** — the user's Angular/TypeScript style rules. Every Angular code change in this repo must follow it. Key rules that diverge from older Angular conventions: no explicit `standalone: true` (default), no explicit `ChangeDetectionStrategy.OnPush` (default in v22), prefer `@Service()` over `@Injectable({providedIn:'root'})`, prefer Signal Forms (`@angular/forms/signals`) for new forms, `input()`/`output()` functions not decorators, `host` object instead of `@HostBinding`/`@HostListener`, `NgOptimizedImage` for static images, no `ngClass`/`ngStyle`, no assumed globals like `new Date()`, `inject()` not constructor injection, `update()`/`set()` on signals not `mutate()`.
- **`KeyloopCodingChallange.pdf`** — the original assessment brief. Several requirements are deliberately ambiguous; the plan documents the assumptions made — do not silently reinterpret them.

The user's global CLAUDE.md enforces a strict planning/implementation split: **do not write application code until explicitly told to move from planning to execution.**

## Angular tooling available in this repo

- **`angular-developer` / `angular-new-app` Claude Code skills** are installed (via `npx skills add https://github.com/angular/skills`, living under `.claude/skills/`). Invoke `angular-developer` before writing any Angular code that touches reactivity (signals/`linkedSignal`/`resource`), forms, DI, routing, testing, or styling — its reference docs were used to verify several of the API claims in the master plan (`@Service()`, Signal Forms, host bindings, zoneless testing patterns) directly against this session's downloaded `@angular/core@22.0.6` package, since Angular 22 shipped after most model training cutoffs. Invoke `angular-new-app` specifically for the `ng new` scaffolding step.
- **`angular-cli` MCP server** is configured project-scoped (`npx @angular/cli mcp`; confirmed connected via `claude mcp list`, though its tools were not visible in the session's tool registry as of the last check — likely needs a fresh session to register). Once available, prefer its `get_best_practices` / `search_documentation` tools over recalled knowledge for anything Angular-API-shaped.
- **Do not trust memorized Angular APIs for anything version-sensitive.** This session found real discrepancies by downloading and inspecting actual npm package contents (e.g., `@ngrx/signals`'s peer dependency range, `@schematics/angular`'s actual `ng new` defaults for `zoneless`/`testRunner`) rather than assuming from training data. Keep doing that for any Angular 22 API claim before relying on it.

## Locked-in architecture decisions (do not re-litigate without cause)

- **Angular 22.0.6** (latest stable as of 2026-07-09). Verify current latest before scaffolding — `npm view @angular/core version`.
- **State management: plain `signal()`/`computed()` + `@Service()`** — not `@ngrx/signals` (its peer range, `@angular/core: ^21.0.0` even on its `next` tag, doesn't cover Angular 22 as of this writing — re-check before ever reintroducing it), not a heavier custom abstraction. One store (`VehicleStore`) is the single source of truth; components never call `VehicleService`/`VehicleActionService` directly.
- **Zoneless change detection and Vitest are Angular 22's actual `ng new` defaults**, not experimental opt-ins — confirmed directly from `@schematics/angular`'s `application/schema.json` (`"zoneless": {"default": true}`, `"testRunner": {"default": "vitest"}`). Tests follow the zoneless "Act, Wait, Assert" pattern: never `fixture.detectChanges()`, always `await fixture.whenStable()`.
- **Mock backend: `json-server@0.17.4`** (pinned to the last stable pre-1.0 release, not the `1.0.0-beta.x` rewrite) seeded via a deterministic `@faker-js/faker` script (`faker.seed(42)`), plus a middleware injecting artificial latency/occasional 503s.
- **All "current time" business logic is deterministic.** Nothing calls `new Date()` directly except `ClockService`. Every pure function that needs "now" takes `asOf: Date` as an explicit parameter.
- **Signal Forms (`@angular/forms/signals`) for the one real form** (the action-log dialog), bound to **native** HTML elements rather than Angular Material form controls — Material's CVA compatibility with `[formField]` isn't confirmed, so Material is used for chrome only (dialogs, buttons, tables, chips, cards) and never for actual form inputs.
- **No real authentication.** A mocked `CurrentUserService` simulates one logged-in manager.

## Intended project layout

Two npm packages side by side (see the plan's "Project & File Structure" section for the full tree):

```
mock-server/    # json-server + seed.ts (faker-based) + middleware.js + db.json
app/            # `ng new app` — the Angular 22 SPA (zoneless, vitest)
docs/
  best-practices.md                # user-provided Angular/TS style rules
  SYSTEM_DESIGN.md                 # Part 1 deliverable
  superpowers/plans/...            # the master plan
```

Inside `app/src/app/features/inventory/`, code is organized by responsibility, not technical layer:
- `models/` — plain interfaces (`Vehicle`, `VehicleAction`, `VehicleFilter`)
- `domain/` — pure, framework-free business logic (aging calculation, filtering, KPI aggregation, enrichment) — this is what "a suite of tests that validate the core business logic" (a required deliverable) actually tests
- `data-access/` — `VehicleService`/`VehicleActionService` (thin HTTP boundary) and `VehicleStore` (plain signals wiring HTTP + domain logic together)
- `ui/` — dumb/presentational components (`AgingBadge`, `InventoryKpiBar`, `VehicleFilterBar`, `ActionLogDialog`)
- `feature/` — routed smart components (`InventoryDashboard` at `/inventory`, `VehicleDetail` at `/inventory/:vin`)

`app/src/app/core/` holds cross-cutting concerns: `ClockService`, `LoggerService`, `CurrentUserService`, `AppErrorHandler`, `http-logging.interceptor.ts`.

Component/service file names follow the 2025 style-guide convention referenced by the `angular-developer` skill: no `.component.`/`.service.` infix in filenames for components (`aging-badge.ts`, not `aging-badge.component.ts`); class names never carry a `Component` suffix.

Note: the repository's current `.gitignore` assumes a single Angular project scaffolded at the repo root. Update it when scaffolding per the plan's `app/`+`mock-server/` split.

## Commands (once scaffolded per the plan)

There is no buildable code yet. Once Task 1 has been executed, the working commands will be:

```bash
# Mock backend
cd mock-server && npm install
npm run seed     # regenerate db.json deterministically
npm run serve    # json-server on :3001, with latency/error middleware

# Angular app (second terminal)
cd app && npm install
npm start                    # ng serve on :4200, proxied to :3001 via proxy.conf.json

# Verification
npx tsc --noEmit -p tsconfig.json
npx eslint src --max-warnings=0
npm test                     # `ng test` -> Vitest (default runner in Angular 22)
npm test -- --coverage
npx playwright test          # critical-path e2e (filter -> detail -> log action)
npx ng build --configuration production
```

To run a single Vitest spec file: `npx ng test --include="**/path/to/file.spec.ts"`.

## Deliverables checklist (per the PDF's "Deliverables & Submission")

1. **System Design Document** (`docs/SYSTEM_DESIGN.md`) — architecture diagram, component roles, data flow, tech justifications, observability strategy, a GenAI-design-phase section, and documented ambiguity-resolution assumptions.
2. **Working code** (this repo) — README.md with build/run/test instructions, a dedicated **AI Collaboration Narrative** section, and a test suite validating core business logic (the `domain/` and `data-access/` spec files).
3. **Video submission** — out of scope for any Claude Code session; the user records this themselves.
