# Keyloop Technical Assessment — Intelligent Inventory Dashboard (Scenario B)

## Overview

This is a submission for Keyloop's technical assessment, Scenario B: **The Intelligent Inventory Dashboard**. The **frontend** service layer is fully implemented in Angular 22 (zoneless, standalone components, plain-signals state management); the backend is mocked using `json-server`, seeded with deterministic fake inventory data — one of the assessment's explicitly sanctioned mocking options. The app lets a dealership manager view a filterable inventory list, see aging stock (>90 days) automatically identified and prominently surfaced, and log a persisted status/action against any aging vehicle.

## Architecture

See [`docs/SYSTEM_DESIGN.md`](docs/SYSTEM_DESIGN.md) for the full architecture diagram, component roles, data flow, technology justifications, observability strategy, and documented assumptions.

In short: a zoneless Angular 22 SPA talks over real HTTP (through a dev-server proxy) to a local `json-server` instance. All "intelligence" — aging-stock detection, filtering, KPI aggregation — lives in pure, framework-free TypeScript functions, unit-tested directly. A single plain-signals `VehicleStore` is the app's only source of truth; every UI component reads from it and no component ever calls an HTTP service directly.

## Prerequisites

- Node.js >= 20.19 (built and tested on Node v25.2.1 — see the note under [Known Issues](#known-issues) below regarding an EBADENGINE warning this produces)
- npm >= 10

## Getting Started

### 1. Install dependencies

```bash
cd mock-server && npm install
cd ../app && npm install
```

### 2. Seed the mock data (one-time, or whenever you want to reset it)

```bash
cd mock-server && npm run seed
```

This deterministically (`faker.seed(42)`) generates 130 vehicles and their associated action history into `mock-server/db.json`, including two fixed boundary-case vehicles at exactly 90 and 91 days old for manual QA of the aging threshold.

### 3. Run the mock backend

```bash
cd mock-server && npm run serve   # http://localhost:3001
```

### 4. Run the app (in a second terminal)

```bash
cd app && npm start   # http://localhost:4200/inventory
```

## Running Tests

```bash
cd app
npm test                    # Vitest via `ng test` — 19 files, 83 unit + component tests
npm test -- --coverage      # with coverage report
npx playwright test         # critical-path e2e suite (filter -> detail -> log action), auto-starts both servers via `webServer`
npx ng build                # production build sanity check
```

The business-logic test suite lives in `app/src/app/features/inventory/domain/*.spec.ts` (aging calculation, filtering, KPI aggregation, vehicle enrichment — all pure, framework-free functions) and `app/src/app/features/inventory/data-access/*.spec.ts` (the HTTP boundary and the `VehicleStore` that wires it all together).

## AI Collaboration Narrative

### Strategy

Claude Code (Sonnet 5) was the primary AI collaborator for this submission, used deliberately in two separate phases rather than as a single "build me the app" prompt. In the **planning phase**, it read the challenge PDF and produced a full master implementation plan — 23 discrete tasks, each with complete test code and complete implementation code written out in advance — before a single line of application code existed. That plan went through three independent review passes (see below) before implementation started. In the **implementation phase**, the plan was executed task-by-task using a subagent-driven workflow: each task was handed to a fresh implementer subagent with only that task's specific brief (not the accumulated conversation history), which wrote the failing test, implemented it, and committed — followed immediately by an independent second review pass before moving to the next task. A personal Angular/TypeScript best-practices document was provided upfront, and the official Angular team's Claude Code skills plus a project-scoped Angular CLI MCP server were installed specifically so Angular 22-specific output (a framework version released after most model training cutoffs) would track the framework's actual current API surface rather than outdated conventions recalled from training data.

### Verification & Refinement Process

Every task's diff was reviewed before being accepted as done — first by the implementer subagent's own self-review, then by an independent review pass using Codex CLI (GPT-5.5) dispatched with no memory of the implementer's reasoning, given only the task's requirements, the diff, and instructions to verify claims empirically (running the actual tests, not trusting the report) rather than reviewing the diff text alone. Before implementation even began, the original plan's proposed architecture was independently stress-tested by two other AI CLIs (Google Antigravity/Gemini-backed, and Codex), and when the plan was later revised to target the newly-released Angular 22, every version-sensitive API claim was re-verified by downloading and inspecting the actual published npm packages rather than trusted from memory — this is how the `@ngrx/signals`/Angular-22 incompatibility, the zoneless/Vitest-are-actual-defaults fact, and several Angular 22 CLI/API surface changes were confirmed, not assumed.

This verification loop was not a formality — it caught real, substantive defects across the implementation, including:

- **A timezone-dependent bug in the aging-stock calculation itself** (`inventory-age.util.ts`): the day-boundary math used local-timezone `Date` getters instead of UTC ones, meaning a vehicle's aging classification could differ by a day depending on which timezone the browser ran in — a real risk to the single most safety-critical rule in the whole app (the PDF's literal ">90 days" requirement). Caught by a review pass that tested the function under multiple `TZ` values, not just the given test cases; fixed by switching to UTC-based date normalization, with a new regression test proving it.
- **Two real concurrency bugs in `VehicleStore`**, the app's central state container: (1) a failed `logAction()` call's rollback path reset the whole action list to a stale snapshot, meaning one failed action-log could silently destroy a *different*, already-successfully-saved action if two calls overlapped; (2) a `load()` call resolving while a `logAction()` was still in flight could erase that action's optimistic UI entry before its own server response arrived to replace it. Both were found by a review pass that reasoned through actual interleaved-call scenarios (using controlled RxJS `Subject`s to force specific resolution orders in the regression tests), not just running the given tests. Both are fixed and covered by tests that reproduce the exact race.
- **A production-build-only failure**: `ng build` failed outright because `provideAnimationsAsync()` requires `@angular/animations`, which was never actually installed (only an *optional* peer dependency of `@angular/platform-browser`) — the dev server's bundler didn't hit this failure, so it was invisible until a review pass specifically ran the production build rather than trusting `ng serve` and the test suite.
- **A real product defect invisible to unit testing**: the app's root shell (`app.html`) still contained the full default `ng new` scaffold — Angular logo, marketing links, and a stray `<h1>` — rendered above every routed page, meaning the production build would have shipped placeholder boilerplate on top of the real dashboard on every single page. No unit or component test ever renders the routed root shell in a browser context, so this went undetected through 19 prior tasks; it surfaced only once the Playwright e2e suite exercised a real browser against the real running app, and was fixed at the root cause rather than papered over with a narrower test selector.
- **Several verified library-API discrepancies** between what the plan assumed about Angular 22/Angular Material's CLI and Signal Forms surface and what the actually-published packages do — e.g. `ng new`'s real flag names, Angular Material 22's M3-only theming schematic, `MatSlideToggle`'s real click-target DOM structure, and Signal Forms' `submit()` actually resolving `Promise<boolean>` rather than `Promise<void>`. Each was confirmed by inspecting the real installed package source or by direct empirical reproduction (not guessed), and the master plan document was corrected in place each time so the discrepancy wouldn't resurface as a surprise later.

Every fix above went through the same cycle as new code: a failing regression test proving the bug, a minimal fix, and a follow-up independent re-review confirming the fix actually resolved the issue without introducing a regression, before the task was considered done.

### Rejected AI Suggestions (evidence of ownership, not blind acceptance)

- Considered `@ngrx/signals` for state management (a real second-opinion recommendation from the initial architecture review); rejected once its published peer-dependency range was directly confirmed not to cover the Angular version actually being targeted — a plain `signal()`/`computed()`/`@Service()` store was used instead.
- Considered binding the action-log form's Material `mat-select`/`mat-input` controls directly to Signal Forms; rejected in favor of native `<select>`/`<textarea>` elements, since Signal Forms' `[formField]` compatibility with Material's CVA implementation wasn't confirmed at design time (later independently re-verified against the real published `@angular/forms@22.0.6` source during implementation — native elements, including `<select>`, are the documented, supported path).
- Considered leaving observability aspirational-only; rejected in favor of implementing the achievable slice (structured logging, HTTP request timing, two complementary error-catching layers) and explicitly labeling the rest (distributed tracing, RUM/APM, correlation-ID propagation) as roadmap rather than blurring the line between what's built and what's aspirational.
- When a review pass found a real Critical-severity concurrency bug in `VehicleStore.logAction()`'s rollback path, the straightforward "fix" of just re-adding a `previousActions` snapshot check was rejected in favor of a targeted per-call rollback (filtering out only that call's own optimistic entry) — the snapshot approach would have resolved the specific reported scenario but left the same class of bug reachable from a slightly different interleaving.
- When a documentation-inconsistency review found the plan's own commit-message convention for TDD "red" commits (a `test:` prefix) directly contradicted this repo's separately-stated rule banning conventional-commit prefixes, the fix was to change the convention itself (drop the prefix, keep only a `(red)` marker) rather than carve out a special-case exception in the no-prefix rule — keeping one consistent rule rather than two rules with an exception.

### Final Quality Assurance

The full test suite (19 files, 83 unit/component tests) passes, the Playwright critical-path e2e suite (3 scenarios: filter to aging-only, navigate list→detail, log an action and see it persist in history) passes against the real running app, and `ng build` (production) succeeds with the two routed features correctly split into their own lazy-loaded chunks. `tsc --noEmit` and `eslint --max-warnings=0` are both clean. The app was manually exercised end-to-end via `curl` and direct API checks against the real mock server (a headless environment without a graphical browser was used for this session, so visual browser verification of the rendered UI is the one verification step deferred to the recorded video submission) — including the boundary-case vehicles at exactly 90/91 days, the mock server's injected latency and error-response paths, and the full filter→detail→log-action flow that the e2e suite also covers.

## Assumptions

See [`docs/SYSTEM_DESIGN.md#note-on-ambiguity`](docs/SYSTEM_DESIGN.md#note-on-ambiguity) for the full list of 10 documented assumptions made where the assessment brief was intentionally underspecified (aging threshold semantics, single-dealership scope, mocked authentication, and others).

## Known Issues

- Every `npm`/`ng` command in this environment prints a Node.js `EBADENGINE`/LTS-version advisory (built on Node v25.2.1, an odd-numbered non-LTS release; the toolchain prefers `^22.22.3 || ^24.15.0 || >=26.0.0`). This is a pre-existing environment characteristic, not a defect introduced by this submission — nothing failed because of it.
- `mock-server`'s `npm run serve` uses json-server's file watcher (`--watch db.json`), which can hit `EMFILE: too many open files` on machines with a low open-file-descriptor `ulimit` (some CI runners and sandboxed environments). If you hit this, raise the limit (e.g. `ulimit -n 4096`) before running `npm run serve`.
- `NgOptimizedImage` renders vehicle photos from `picsum.photos` mock URLs and emits a soft "unrecognized image loader" console advisory as a result — expected and documented in the System Design Document's Note on Ambiguity; a real deployment would point at a CDN with a registered loader.
