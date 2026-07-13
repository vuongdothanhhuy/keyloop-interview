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

**Fully implemented, tested, and documented, and merged to `main`.** All 23 tasks in the master plan are complete (originally on branch `implement-inventory-dashboard`, merged via PR #1 along with 5 additional fixes from an external Codex CLI review pass — see that branch's history for the full task-by-task record). The app builds (`ng build`), all tests pass (19 files / 86 unit+component tests, 3/3 Playwright e2e), and both required documentation deliverables (`docs/SYSTEM_DESIGN.md`, `README.md`) are written and fact-checked against the actual code. Before making further changes, read:

- **`docs/superpowers/plans/2026-07-09-intelligent-inventory-dashboard.md`** — the master plan. All 23 tasks are checked off. **This remains the source of truth for the architecture and the reasoning behind it** — it now also documents, in place, every real bug a code-review pass found during implementation and how each was fixed (see the "Task N Execution Corrections" / "Codex Review Pass" sections scattered through the file, and the "Task Dependency Graph & Parallelization Guide" / "Commit Strategy: Red/Green Checkpoints" sections near the top). If you're picking up further work on this codebase, read the relevant task's corrections section before assuming the plan's originally-drafted code sample is exactly what's on disk — several were corrected after real execution surfaced discrepancies.
- **`README.md`**'s "AI Collaboration Narrative" section — a real, specific account of every substantive bug the review process caught (a timezone bug in the core aging calculation, two concurrency bugs in `VehicleStore`, a production-build-only dependency failure, a mutable-signal type gap, a production page silently shipping `ng new` scaffold placeholder content, and more) and how each was verified and fixed. Read this before assuming any given file is bug-free just because it has a passing test suite — several of these bugs had passing tests until a review pass specifically went looking for the failure mode the given tests didn't cover.
- **`docs/best-practices.md`** — the user's Angular/TypeScript style rules. Every Angular file in this repo follows it. Key rules that diverge from older Angular conventions: no explicit `standalone: true` (default), no explicit `ChangeDetectionStrategy.OnPush` (default in v22), prefer `@Service()` over `@Injectable({providedIn:'root'})`, prefer Signal Forms (`@angular/forms/signals`) for new forms, `input()`/`output()` functions not decorators, `host` object instead of `@HostBinding`/`@HostListener`, `NgOptimizedImage` for static images, no `ngClass`/`ngStyle`, no assumed globals like `new Date()`, `inject()` not constructor injection, `update()`/`set()` on signals not `mutate()`.
- **`KeyloopCodingChallange.pdf`** — the original assessment brief. Several requirements were deliberately ambiguous; `docs/SYSTEM_DESIGN.md`'s "Note on Ambiguity" section documents the assumptions made — do not silently reinterpret them.

The user's global CLAUDE.md enforces a strict planning/implementation split: **the planning-phase restriction has been explicitly lifted for this branch** (the user moved from planning to execution and the plan was fully executed) — but treat any *new* feature work beyond what's already implemented as its own planning decision, not an implicit continuation.

## A note on trusting this codebase's test suites

Every file in this repo has a passing test suite, and several of them *also* had a passing test suite at the exact moment they contained a real bug — the given tests, faithfully transcribed from the plan, simply didn't happen to exercise the failure mode. This was caught by an independent review pass that went beyond the given tests: reasoning through concurrent-call interleavings, testing under non-default timezones, running the actual production build instead of trusting `ng serve`, and exercising a real browser instead of only component-isolated unit tests. If you're extending this codebase, don't treat "tests pass" as sufficient evidence of correctness for anything touching concurrency, date/timezone handling, or the app's root shell/routing — those are exactly the categories where this repo's own history shows tests passed right up until someone looked harder.

## Git commit conventions

This repo is a graded take-home submission, and its commit history is part of what gets reviewed. Every commit made in this repo (by Claude Code or otherwise) must:

- **Never include a `Co-Authored-By` trailer or any other line attributing the commit to Claude, Claude Code, or Anthropic.** Author identity is the user's own git config (`Huy Vương`) — do not override it or add a co-author.
- **Not use a conventional-commit type prefix** (`feat:`, `fix:`, `docs:`, `chore:`, `test:`, etc.). Write a plain, descriptive subject line instead.
- **Be generated from the actual diff/content of that commit**, not copied boilerplate — describe what the commit contains in the committer's voice.

This overrides the default Claude Code git-commit instructions (which normally append a `Co-Authored-By: Claude ...` trailer) for this repository specifically.

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
- **`VehicleStore.load()` and `.logAction()` have specific concurrency-safety mechanisms that are load-bearing, not incidental** — a request-id guard in `load()` (discards a stale response if a newer `load()` superseded it), a per-call `optimisticId` (a timestamp plus a monotonic counter, not the timestamp alone) for `logAction()`'s optimistic entries, a targeted rollback that removes only the failed call's own entry rather than resetting to a snapshot, and `load()`'s success handler preserving any still-pending optimistic entries rather than overwriting the whole `actions` array. All four exist because a review pass found and fixed real bugs in earlier, simpler versions of this code — don't simplify them back without re-deriving why they're there (see `git log --oneline -- app/src/app/features/inventory/data-access/vehicle.store.ts`).
- **`app/package.json` must list `@angular/animations` as a real dependency**, not just rely on it being an optional peer dependency of `@angular/platform-browser`. `provideAnimationsAsync()` needs it at bundle time; `ng serve`'s dev bundler won't catch its absence, only `ng build` (production) will.

## Project layout

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

The root `.gitignore` was rewritten during scaffolding (Task 1) from the single-project-at-root patterns `ng new` generates to unanchored patterns covering both `app/` and `mock-server/` as sibling packages — `app/package-lock.json` and `mock-server/package-lock.json` are both gitignored by design (not an oversight if you notice them missing from a commit).

## Commands

```bash
# Mock backend
cd mock-server && npm install
npm run seed     # regenerate db.json deterministically (faker.seed(42) -> 130 vehicles, 67 actions)
npm run serve    # json-server on :3001, with latency/error middleware

# Angular app (second terminal)
cd app && npm install
npm start                    # ng serve on :4200, proxied to :3001 via proxy.conf.json

# Verification
npx tsc --noEmit -p tsconfig.json
npx eslint src --max-warnings=0
npm test                     # `ng test` -> Vitest (default runner in Angular 22) — 19 files, 86 tests
npm test -- --coverage       # requires @vitest/coverage-v8 (already a devDependency)
npx playwright test          # critical-path e2e (filter -> detail -> log action) — 3 tests
npx ng build --configuration production
```

To run a single Vitest spec file: `npx ng test --include="**/path/to/file.spec.ts"`.

If `mock-server`'s `npm run serve` fails with `EMFILE: too many open files` (its `--watch` flag uses a real fs watcher), raise the open-file-descriptor limit first: `ulimit -n 4096`.

## Deliverables checklist (per the PDF's "Deliverables & Submission")

1. ✅ **System Design Document** (`docs/SYSTEM_DESIGN.md`) — architecture diagram, component roles, data flow, tech justifications, "Build for the Future" (scalability/performance/reliability/maintainability), observability strategy, a GenAI-design-phase section, and documented ambiguity-resolution assumptions. 8 subsections total.
2. ✅ **Working code** (this repo) — `README.md` with build/run/test instructions, a dedicated **AI Collaboration Narrative** section (including a real, specific account of every bug the review process found and fixed), and a test suite validating core business logic (the `domain/` and `data-access/` spec files — 7 spec files, part of the 19-file / 83-test full suite).
3. **Video submission** — out of scope for any Claude Code session; the user records this themselves. Not yet done as of this writing.
