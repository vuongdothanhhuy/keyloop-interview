# Intelligent Inventory Dashboard (Scenario B) — Master Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Before executing any task, invoke the `angular-developer` skill (and, if available in your session, the `angular-cli` MCP server's `get_best_practices`/`search_documentation` tools) to double-check any Angular API surface this plan touches.** Angular 22 shipped after most training data cutoffs — several APIs used below (`@Service()`, Signal Forms, zoneless-by-default, `provideBrowserGlobalErrorListeners()`) were verified in this session by downloading and inspecting the actual published `@angular/core@22.0.6` and `@schematics/angular@22.0.5` npm packages, not recalled from memory. Re-verify if anything looks off.
>
> **Commit at both the red and green checkpoint of every test/implement cycle, not just once at task-end.** See "Commit Strategy: Red/Green Checkpoints" below — this is what makes a hard mid-task interruption (context/token limit, quota reset, brand-new session) resumable without re-reading implementation code.

**Goal:** Deliver Keyloop's take-home assessment for **Scenario B: The Intelligent Inventory Dashboard**, implementing the **frontend** service layer fully (Angular 22) against a **mocked backend** (json-server), plus the required System Design Document and README (with AI Collaboration Narrative and a business-logic test suite).

**Architecture:** A zoneless, standalone-components Angular 22 SPA talks over real HTTP to a local `json-server` instance seeded with deterministic fake inventory data. All "intelligence" (aging-stock detection, severity banding, KPI aggregation, filtering) lives in pure, framework-free TypeScript functions that are unit-tested directly; a plain `@Service()`-decorated `VehicleStore` built from `signal()`/`computed()` wires those pure functions to HTTP calls and exposes reactive state to dumb UI components. An injectable `ClockService` supplies "now" everywhere so date-based business logic is deterministic in tests and immune to client clock drift being treated as ground truth.

**Tech Stack:** Angular 22.0.6 (zoneless by default, standalone by default, `@Service()` singletons, Signal Forms, new control-flow), Angular Material 22.0.4 (CDK table/dialog/chips/snackbar — non-form chrome only), `json-server` 0.17.4 + `@faker-js/faker` 10.5.0 (mock backend), **Vitest** via the Angular CLI's built-in `@angular/build:unit-test` builder (unit/component tests, zoneless "Act, Wait, Assert" pattern), `@playwright/test` 1.61 (small critical-path e2e suite), ESLint (`angular-eslint`) + Prettier.

## Global Constraints

- Scenario: **B — Intelligent Inventory Dashboard** (Domain: Supply). Do not implement Scenarios A/C/D.
- Implement **frontend fully**; backend is **mocked** via `json-server` — per the challenge PDF's explicitly sanctioned option.
- Must satisfy all 3 core requirements verbatim from the PDF:
  1. **Inventory Visualization** — filterable list of all vehicles (make, model, age, etc.).
  2. **Aging Stock Identification** — auto-identify and prominently display vehicles in inventory **>90 days**.
  3. **Actionable Insights** — manager can log and **persist** a status/proposed action per aging vehicle.
- "Build for the Future": design/implementation must address scalability, performance, reliability, maintainability, observability — even though only the frontend is implemented.
- Deliverables: (1) System Design Document, (2) Git repo with README (build/run/test instructions + dedicated **AI Collaboration Narrative** section + **a suite of tests validating core business logic**), (3) video — **user records this themselves, out of scope for this plan.**
- Ambiguities resolved with a documented assumption — see "Assumptions & Ambiguity Resolutions" below.
- **Follow `docs/best-practices.md` (the user's Angular/TypeScript style rules) and the installed `angular-developer` skill's reference docs (`.claude/skills/angular-developer/references/*.md`) for every line of Angular code written under this plan** — see "Official Angular Guidance & Tooling" below for what was verified from them.
- **Planning-phase rule (user's global CLAUDE.md):** this document is a plan only. No application code is written until the user approves and explicitly moves to execution.
- Package versions in this plan were verified against the live npm registry and, for Angular-specific API claims, against the actual downloaded package contents on 2026-07-09 — do not silently swap in newer majors without re-checking peer-dependency and API compatibility the same way.

---

## Second-Opinion Review (Antigravity + Codex) — original review, still valid

Before the Angular-22 revision below, this plan was reviewed by two independent subagents (`agy`/Antigravity and `codex`/Codex) on the original Angular-21 + `@ngrx/signals` draft. Points that still apply after the v22 rewrite:

1. **State management:** don't hand-roll a store poorly, don't reach for heavy state machinery either. (Original recommendation was `@ngrx/signals`; superseded — see "Angular 22 Revision" below for why and with what.)
2. **Mock backend:** `json-server` + seeded `@faker-js/faker` data confirmed as the *right* call — preserves a real HTTP boundary (unlike `in-memory-web-api`/a fake interceptor), which matters for the logging interceptor and latency-injection work, and persists mutations to disk. **Unchanged.**
3. **Requirement depth:** a plain table+filters reads as "a table," not "intelligent." Keep: KPI cards, severity bands, a dedicated aging view, explicit loading/empty/error states, documented date edge cases. **Unchanged.**
4. **Clock-drift risk:** don't compute "age" against a hidden `new Date()` call. Fixed via `ClockService` + `asOf: Date` parameters everywhere. **Unchanged — and independently reinforced by `docs/best-practices.md`**, which explicitly says: "Do not assume globals like (`new Date()`) are available."
5. **Testing depth:** pure unit tests alone don't prove UI wiring. Keep the small Playwright suite over the critical path. **Unchanged.**
6. **Scope discipline:** don't build full OpenTelemetry-Web/correlation-ID plumbing for a locally-mocked app; scope observability to what's actually implemented, document the rest as roadmap. **Unchanged.**
7. **Missing RBAC signal:** add a trivial mocked `CurrentUserService` so "allow **a manager** to log..." has a visible role boundary. **Unchanged.**

## Angular 22 Revision (this session, superseding the Angular-21 draft)

The user asked to target the **latest Angular (v22)** and provided `docs/best-practices.md` plus the official `angular-developer`/`angular-new-app` skills (installed via `npx skills add https://github.com/angular/skills`) and an `angular-cli` MCP server (`npx @angular/cli mcp`, confirmed connected via `claude mcp list`). Verifying these against the actual published packages (not memory) changed several decisions:

1. **Dropped `@ngrx/signals`.** Its latest release (`21.1.1`) and even its `next` tag both declare `@angular/core: ^21.0.0` as a hard peer ceiling — confirmed by downloading the package metadata directly. It does not support Angular 22 today. Rather than fight that (or stay on Angular 21 against the user's explicit instruction), `VehicleStore` is now a plain `@Service()`-decorated class built from `signal()`/`computed()`/`.update()` directly — which is exactly what `docs/best-practices.md` already asks for ("Use signals for state management," "Use `computed()` for derived state," "Do NOT use `mutate`... use `update` or `set`") and what the `angular-developer` skill's `creating-services.md` demonstrates. This also removes a fragility noted in the old plan (calling `inject()` inside a `SignalStore`'s `withComputed`/`withMethods` factory) — the new store injects everything once, in one place, like an ordinary class.
2. **`@Service()` instead of `@Injectable({ providedIn: 'root' })`.** Confirmed as a real, exported decorator by extracting `@angular/core@22.0.6`'s type definitions directly (`declare const Service: ServiceDecorator;`, documented as auto-provided + tree-shakeable, no `providers` array needed). Used for every true singleton service in this plan (`ClockService`, `LoggerService`, `CurrentUserService`, `VehicleService`, `VehicleActionService`, `VehicleStore`). `AppErrorHandler` is the one exception — it's manually provided under the `ErrorHandler` DI token (`{ provide: ErrorHandler, useClass: AppErrorHandler }`), not auto-provided as itself, so it keeps a plain `@Injectable()`.
3. **Zoneless is the actual default**, not an opt-in flag — confirmed via `@schematics/angular@22.0.5`'s `application/schema.json` (`"zoneless": { "default": true }`). **Corrected against the real `ng new` output (Task 1 execution, 2026-07-10):** the generated `app.config.ts` does *not* contain a `provideZonelessChangeDetection()` call — when scaffolding with `--zoneless=true`, the template simply omits the zone-provider block entirely, since zoneless is the inherent runtime default with nothing to opt into. `provideZonelessChangeDetection()` is still a real, exported function (confirmed against the installed `@angular/core@22.0.6`'s type definitions), and this plan's own Task 17 calls it explicitly to make the app's zoneless-ness self-documenting in code — but that call is added by Task 17, not present in the fresh scaffold. New in v22 scaffolding: `provideBrowserGlobalErrorListeners()`, added alongside `AppErrorHandler` (they're complementary — the browser listener catches truly-uncaught `window.onerror`/`unhandledrejection` events outside Angular's own execution, `AppErrorHandler` catches errors Angular itself surfaces during change detection/template/event execution).
4. **Vitest is the default test runner**, not Karma — confirmed via the same schema (`"testRunner": { "enum": ["vitest", "karma"], "default": "vitest" }`) and the CLI's `@angular/build:unit-test` builder (there's even an official `migrate-karma-to-vitest` migration script in the schematics package, so this is a supported, permanent transition, not experimental). This plan drops the manually-wired `jest-preset-angular` setup from the original draft entirely — `ng new`/`ng test` configure Vitest automatically. Per the `angular-developer` skill's `testing-fundamentals.md`, zoneless testing is "Act, Wait, Assert": never call `fixture.detectChanges()`; always `await fixture.whenStable()` after the fixture is created or after a state-changing action.
5. **No explicit `standalone: true`** (default since Angular 19) **and no explicit `ChangeDetectionStrategy.OnPush`** (default in v22) on any `@Component` — both removed from every component in this plan per `docs/best-practices.md`.
6. **Signal Forms (`@angular/forms/signals`) for the one real form** — the action-log dialog. Verified the API directly against the `angular-developer` skill's `signal-forms.md` reference (imports, `form()`, `FormField`, `required()`, `submit()` must be async, "never null — use `''`/`0`/`[]`" model rule). Because Signal Forms' `[formField]` directive binds via a mechanism the skill only demonstrates against **native** `<input>`/`<select>`/`<textarea>` elements, and Angular Material 22's `mat-select`/`mat-input` CVA-compatibility with it isn't confirmed, the dialog's actual form controls are native HTML elements (Material is still used for the dialog chrome/buttons). The filter bar isn't converted — it has no validation/submit semantics, it's a live signal-driven UI control, not "a form."
7. **`NgOptimizedImage` for vehicle photos.** The old draft's `Vehicle.imageUrl` field was never actually rendered anywhere — that's fixed now (list-row thumbnail + a larger detail-page image), both via `NgOptimizedImage`'s `ngSrc`, per `docs/best-practices.md`'s explicit requirement. (Source images are `picsum.photos` URLs, which `NgOptimizedImage` will render correctly but without a recognized third-party loader — expect a soft console advisory, not an error; noted as a known limitation, not fixed, since wiring a custom loader for a demo image CDN is out of scope.)
8. **Host bindings**: none of this plan's components need `@HostBinding`/`@HostListener` — noted as a standing rule (use the `host` object in `@Component`/`@Directive` if a future component needs one) rather than a code change.
9. **`ngClass`/`ngStyle`**: never used anywhere in this plan already (plain `[class]`/`[style]` bindings only) — no change needed, just confirmed compliant.

---

## Official Angular Guidance & Tooling (new resources added this session)

- **`docs/best-practices.md`** — the user's Angular/TypeScript style rules. Every task's code in this plan follows it. Read it before writing any Angular code not covered by this plan.
- **`angular-developer` / `angular-new-app` skills** (installed via `npx skills add https://github.com/angular/skills`, living in `.claude/skills/`) — invoke `angular-developer` for anything touching reactivity (signals/`linkedSignal`/`resource`), forms, DI, routing, testing, or styling; invoke `angular-new-app` specifically when running Task 1's `ng new`.
- **`angular-cli` MCP server** (`npx @angular/cli mcp`, configured project-scoped; connected per `claude mcp list` but its tools weren't visible in this session's registry — likely needs a fresh Claude Code session to pick up). Once available, prefer its `get_best_practices` and `search_documentation` tools over recalled knowledge for anything Angular-API-shaped, and its `onpush_zoneless_migration` tool if any future component needs auditing for zoneless-readiness. Experimental tools (`build`, `devserver.*`, `e2e`, `test`) require `--experimental-tool`/`-E` flags and aren't assumed available.

---

## Assumptions & Ambiguity Resolutions

(These get copied into the System Design Document's "Note on Ambiguity" section — see Task 21.)

1. **Single dealership scope.** Vehicles carry a `dealershipId` field for future multi-site extension, but there is no dealership switcher UI in this build.
2. **Aging threshold** is fixed at **>90 days** per the spec. Severity bands (`fresh` ≤30d, `watch` 31–90d, `aging` 91–180d, `critical` >180d) are a non-required UX layer on top, not a reinterpretation of the binary rule.
3. **"Status or proposed action"** is a constrained enum (`VehicleActionType`) plus a free-text note, with a full **history** persisted per vehicle (audit trail) — the most recent one is surfaced as "current status."
4. **VIN doubles as the `id`** json-server requires on every resource.
5. **No real authentication.** A trivial `CurrentUserService` simulates one logged-in manager.
6. **"Real-time"** means "reflects latest state immediately after each load/mutation," not literal server push — documented as a production extension, not implemented.
7. **Angular pinned to 22.0.6** (the latest stable major as of 2026-07-09), with `@ngrx/signals` dropped in favor of a plain `signal()`/`@Service()` store specifically because `@ngrx/signals` doesn't yet support Angular 22 (see "Angular 22 Revision" above) — re-verify `@ngrx/signals`'s peer range before ever reintroducing it.
8. **`json-server` pinned to stable `0.17.4`**, not the in-progress `1.0.0-beta.x` rewrite, for reproducibility in a graded submission.
9. **Zoneless + Vitest are used because they are Angular 22's actual defaults**, not because this plan opted into an experimental feature — confirmed against the CLI's own schematics.
10. **`NgOptimizedImage` against `picsum.photos` mock images** will emit a soft "unrecognized image loader" advisory in the console; this is expected and left as-is (a real deployment would point `imageUrl` at a CDN with a registered `NgOptimizedImage` loader, or configure a custom one).

---

## Project & File Structure

Two npm packages side by side:

```
keyloop-interview/
├── KeyloopCodingChallange.pdf
├── README.md
├── CLAUDE.md
├── docs/
│   ├── best-practices.md                    # user-provided Angular/TS style rules (read, not modified)
│   ├── SYSTEM_DESIGN.md                     # Part 1 deliverable (Task 21)
│   └── superpowers/plans/2026-07-09-intelligent-inventory-dashboard.md   # this file
├── mock-server/
│   ├── package.json
│   ├── seed.ts
│   ├── db.json
│   ├── middleware.js
│   └── proxy.conf.json                      # (referenced from app/, lives conceptually here)
└── app/                                     # `ng new app` (Angular 22, zoneless, vitest)
    ├── angular.json
    ├── package.json
    ├── proxy.conf.json
    ├── playwright.config.ts
    ├── e2e/
    │   └── inventory.spec.ts                # Task 20
    └── src/
        ├── main.ts
        ├── app/
        │   ├── app.config.ts
        │   ├── app.routes.ts
        │   ├── app.ts                        # root component (2025 file-naming style: no `.component.` infix)
        │   ├── core/
        │   │   ├── clock.service.ts                     # Task 5
        │   │   ├── clock.service.spec.ts
        │   │   ├── current-user.service.ts               # Task 18
        │   │   ├── current-user.service.spec.ts
        │   │   ├── logger.service.ts                     # Task 16
        │   │   ├── logger.service.spec.ts
        │   │   ├── global-error-handler.ts                # Task 17
        │   │   ├── global-error-handler.spec.ts
        │   │   ├── http-logging.interceptor.ts            # Task 16
        │   │   └── http-logging.interceptor.spec.ts
        │   └── features/inventory/
        │       ├── models/
        │       │   ├── vehicle.model.ts                  # Task 2
        │       │   ├── vehicle-action.model.ts            # Task 2
        │       │   └── vehicle-filter.model.ts            # Task 2
        │       ├── domain/
        │       │   ├── inventory-age.util.ts              # Task 6
        │       │   ├── inventory-age.util.spec.ts
        │       │   ├── vehicle-filter.util.ts              # Task 7
        │       │   ├── vehicle-filter.util.spec.ts
        │       │   ├── inventory-kpi.util.ts               # Task 8
        │       │   ├── inventory-kpi.util.spec.ts
        │       │   ├── vehicle-enrichment.util.ts          # Task 9
        │       │   └── vehicle-enrichment.util.spec.ts
        │       ├── data-access/
        │       │   ├── vehicle.service.ts                 # Task 10
        │       │   ├── vehicle.service.spec.ts
        │       │   ├── vehicle-action.service.ts           # Task 11
        │       │   ├── vehicle-action.service.spec.ts
        │       │   ├── vehicle.store.ts                    # Task 12
        │       │   └── vehicle.store.spec.ts
        │       ├── ui/
        │       │   ├── aging-badge/
        │       │   │   ├── aging-badge.ts                  # Task 13
        │       │   │   └── aging-badge.spec.ts
        │       │   ├── inventory-kpi-bar/
        │       │   │   ├── inventory-kpi-bar.ts             # Task 14
        │       │   │   └── inventory-kpi-bar.spec.ts
        │       │   ├── vehicle-filter-bar/
        │       │   │   ├── vehicle-filter-bar.ts            # Task 15
        │       │   │   └── vehicle-filter-bar.spec.ts
        │       │   └── action-log-dialog/
        │       │       ├── action-log-dialog.ts             # Task 19
        │       │       └── action-log-dialog.spec.ts
        │       └── feature/
        │           ├── inventory-dashboard/
        │           │   ├── inventory-dashboard.ts           # Task 15
        │           │   └── inventory-dashboard.spec.ts
        │           └── vehicle-detail/
        │               ├── vehicle-detail.ts                # Task 19
        │               └── vehicle-detail.spec.ts
        └── styles.scss
```

> Note on file naming: `docs/best-practices.md` and the `angular-developer` skill's 2025 file-name style guide drop the `.component.ts`/`.service.ts` type-suffix-in-filename convention for some file types (class names still carry no `Component` suffix per the skill's naming note) — this plan uses the plain `.ts` form for components (`aging-badge.ts`, not `aging-badge.component.ts`) to match, while service/util/model files keep their descriptive suffix since that's a content descriptor, not a redundant type annotation.

---

## Task Dependency Graph & Parallelization Guide

The 23 tasks below are numbered as a default linear execution order, but most of them are **not** actually sequential dependencies on each other — they're sequential only because they have to be written down in some order. Task 1 (scaffolding) is the one hard prerequisite for everything else. After it, the remaining tasks split into independent tracks; each task's own **Interfaces: Consumes** line names its real prerequisites precisely, so treat the table below as a map, not a substitute for reading that line.

**Independent tracks (all can start immediately after Task 1; order within a track matters, order *across* tracks doesn't):**

| Track | Tasks (internal order) | Real dependency |
|---|---|---|
| Models | 2 | Task 1 only |
| Mock data | 3 → 4 | Task 1's `mock-server/` scaffold only — no dependency on the Models track |
| Clock & aging | 5, 6 (either order — 6 needs neither) → 13 (needs 6) | Task 1 only |
| Logging | 16 (needs 5, so runs after the Clock & aging track's Task 5) | Clock & aging track |
| Identity | 18 | Task 1 only |
| System Design Doc | 21 | Task 1 only — the architecture is already decided by this plan, so drafting can start on day one and just gets filled in with real specifics as other tracks finish |

**Convergence tasks (wait on more than one track — these are the actual sequential bottlenecks):**

- Task 7 (filtering) needs the **Models** track (2) + **Clock & aging** track (6).
- Task 8 (KPI) needs Task 7. Task 9 (enrichment) needs 6 + 7.
- Task 10/11 (HTTP services) need the **Models** track (2) only — can run parallel to 7/8/9.
- Task 12 (`VehicleStore`) — the biggest convergence point — needs 5, 7, 8, 9, 10, 11.
- Task 14 (KPI bar) needs 8.
- Task 15 (filter bar + dashboard) needs 12, 13, 14.
- Task 17 (bootstrap/routes) needs 15, 16.
- Task 19 (dialog + detail) needs 12, 13, 18, and Task 17's routes file (to add `/inventory/:vin`).
- Task 20 (e2e) needs 17 and 19 both wired and running end-to-end.
- Task 22 (README) and Task 23 (final checklist) need everything else done first.

**Resuming after an interrupted session (context/token limit hit between tasks):** don't re-read this whole file to reconstruct state. Run `git log --oneline` — each task ends in its own commit (Step "Commit" in every task), so the last plan-related commit tells you which task finished last. Open that task's **Files** list to confirm it's actually on disk, then open the *next* task's **Interfaces: Consumes** line to confirm every name it lists already exists (grep for the export) before writing new code. That's sufficient to resume correctly without re-deriving the dependency graph above. **If the interruption happened mid-task instead**, see "Commit Strategy: Red/Green Checkpoints" below — the same `git log` approach still works, just at finer granularity.

**Dispatching multiple subagents in parallel (`superpowers:dispatching-parallel-agents`):** once Task 1 is committed, Tasks {3,4}, {5,6,13}, {16}, {18}, and {21} can each go to a separate agent immediately — none of them touches a file another parallel task touches, and none blocks on another's output. Don't start a convergence task (12, 15, 17, 19, 20, 22, 23) until every track it depends on is actually committed.

---

## Commit Strategy: Red/Green Checkpoints

Every task below follows the same shape: write a failing test → verify it fails → write the implementation → verify it passes → commit. As originally written, only the *last* step commits — meaning a task can be interrupted after the failing test is written (red) but before the implementation exists, and there's no commit to show for it. A resuming session (or agent) would have to open the actual files and diff them against the task's code blocks to figure out "did I write this test, and does it currently pass or fail?" — exactly the re-reading this plan is trying to avoid.

**The fix: commit twice per test/implement cycle, not once.**

1. After the step that says "run the test(s) to verify they fail" (typically Step 2, but re-numbered in tasks with extra setup steps) — **stop and commit the test file(s) alone**, before writing any implementation. Use a plain descriptive sentence ending in the literal marker `(red)` — e.g. "Add failing spec for ClockService (red)". This step isn't written out individually in every task below (it would roughly double the length of this document for a mechanical repetition of the same instruction); apply it as a standing rule at that point in every task's sequence.
2. The task's existing final "Commit" step (after the implementation makes the test pass) is the **green** commit and needs no change — its message already describes the feature, which is correct for the green state.
3. **Tasks with more than one test/implement cycle** (e.g. Task 16 has `LoggerService` then the interceptor; Task 19 has `ActionLogDialog` then `VehicleDetail`) get a red commit before *each* implementation, not just once for the whole task — treat every "write the failing test(s)" step in a task as its own red checkpoint, independent of how many other cycles that same task contains.

**Neither the red nor the green commit message uses a conventional-commit type prefix** (`test:`, `feat:`, `chore:`, etc.) — per this repo's `CLAUDE.md` "Git commit conventions." An earlier draft of this section suggested a `test: ...` prefix for red commits, which directly contradicted that rule; corrected here (2026-07-10) after a code review caught the inconsistency. The `(red)` marker is what distinguishes a red commit — not a prefix tag.

**Why this is enough to resume without re-reading code:** after any interruption, `git log --oneline` shows either a commit ending in `(red)` (meaning: the test exists and is currently failing — pick up at "write the implementation") or a plain feature-description commit with no `(red)` marker (meaning: that cycle is green — pick up at the next step or next task). Cross-check with one test run (`npx ng test --include=...`, named in the task) rather than reading any implementation source. `git status` on top of that catches the rarer case of an edit in progress that was never even run.

---

## Task Breakdown

### Task 1: Scaffold the two packages on Angular 22

**Files:**
- Create: `mock-server/package.json`
- Create: `app/` (via `ng new`)
- Modify: `app/src/app/app.html`, `app/src/app/app.ts`, `app/src/app/app.spec.ts` (remove the `ng new` scaffold placeholder — see Step 5)

**Interfaces:** none (scaffolding only).

- [ ] **Step 1: Re-confirm pinned versions are still current**

```bash
npm view @angular/core version
npm view @angular/cli version
npm view @angular/material version
npm view json-server@0.17.4 version
npm view @ngrx/signals peerDependencies --json   # sanity-check it STILL doesn't cover Angular 22 before assuming this plan's store design is still needed
```
Expected: `@angular/core`/`@angular/cli` resolve to `22.0.6`/`22.0.5` or newer compatible patches. If `@ngrx/signals` now declares `@angular/core: ^22.0.0` support, that's a **plan-changing discovery** — stop and reconsider Task 12 before proceeding (re-adopting it might be preferable at that point; don't silently keep the hand-rolled store out of inertia).

- [ ] **Step 2: Scaffold the Angular app (invoke the `angular-new-app` skill for this step if running in an agentic session)**

```bash
cd /Users/vuongdothanhhuy/Documents/GitHub/keyloop-interview
npx -y @angular/cli@22.0.6 new app --directory app --style=scss --routing=true --ssr=false --zoneless=true --test-runner=vitest --interactive=false
```
> **Verified during Task 1 execution (2026-07-10) against the real `@angular/cli@22.0.6` binary:** `--skip-confirmation` is not a valid flag for `ng new` (`Error: Unknown argument: skip-confirmation`) — use `--interactive=false`, which has identical intent and was confirmed via `ng new --help`. (`ng add` commands elsewhere in this plan do still accept `--skip-confirmation`; only `ng new` differs.)

Expected: `app/` created with Angular 22.0.6, Vitest configured as the `test` architect target (`@angular/build:unit-test` builder), standalone bootstrap, `provideBrowserGlobalErrorListeners()` already present in the generated `app.config.ts`. **Zoneless confirmation is different from what was assumed pre-execution:** the generated `app.config.ts` does **not** contain an explicit `provideZonelessChangeDetection()` call — when `--zoneless=true`, the schematic template simply omits the zone-provider block entirely (confirmed directly from `@schematics/angular`'s `application/files/standalone-files/src/app/app.config.ts.template`), since zoneless is the inherent runtime default now, not an opt-in provider. Confirm zoneless via the *absence* of `zone.js` in `node_modules` and the *absence* of a `polyfills` array in `angular.json`'s build options, not via a literal provider call in this file. (`provideZonelessChangeDetection()` is still a real, exported function in `@angular/core@22.0.6` — Task 17 calls it explicitly later, which is valid; `ng new` just doesn't add that call itself.)

- [ ] **Step 3: Add Angular Material (non-form chrome only — see "Angular 22 Revision" point 6)**

```bash
cd app
npx ng add @angular/material@22.0.4 --skip-confirmation --theme=magenta-violet
```
> **Verified during Task 1 execution (2026-07-10):** Material 22's `ng-add` schematic dropped M2 theme names and the `--typography`/`--animations` flags entirely — it's M3-only now. `--theme` only accepts 4 named palette pairs: `azure-blue` (default), `rose-red`, `magenta-violet`, `cyan-orange`. `indigo-pink` doesn't exist and crashes the schematic (`Cannot read properties of undefined (reading 'primary')`). `magenta-violet` was chosen as the closest aesthetic analog to the original indigo-pink intent and confirmed with the user. **No animations provider (`provideAnimationsAsync()`) is added by this command anymore** — there's no flag for it in this schematic version; see the corrected note in Task 17, which adds it explicitly in `app.config.ts` regardless.

Expected: `package.json` lists `@angular/material`/`@angular/cdk` at `^22.0.4`; `src/styles.scss` rewritten with the `mat.theme()` M3 mixin.

- [ ] **Step 4: Install `@angular/animations` explicitly**

```bash
cd app
npm install @angular/animations@22.0.6
```
> **Added after real execution (2026-07-10):** Task 17's `app.config.ts` calls `provideAnimationsAsync()`, which dynamically imports `@angular/animations/browser` at bundle time. `@angular/animations` is only an *optional* peer dependency of `@angular/platform-browser` — neither `ng new` nor `ng add @angular/material` installs it as a real dependency — so without this step, `ng serve` works fine (its dev bundler doesn't hit the missing-module error) but `ng build` (production) fails outright with `Could not resolve "@angular/animations/browser"`. This was originally discovered at Task 17 and fixed there as a follow-up commit; installing it here instead means it's never missing in the first place.

Expected: `app/package.json` lists `@angular/animations` as a `dependencies` entry (not just implied via peer deps), pinned consistently with the other `@angular/*` packages.

- [ ] **Step 5: Remove the `ng new` scaffold placeholder from the app shell**

Replace `app/src/app/app.html`'s entire generated content (the "This content is only a placeholder" boilerplate — Angular logo SVG, marketing pill links, and a `<h1>Hello, {{ title() }}</h1>`) with just:
```html
<router-outlet />
```
Also remove the now-unused `title` signal from `app/src/app/app.ts` (it becomes `export class App {}`), and update `app/src/app/app.spec.ts`'s `'should render title'` test to instead assert `fixture.nativeElement.querySelector('router-outlet')` is truthy.

> **Added after real execution (2026-07-10):** this step didn't exist in the original plan, and the omission went undetected through 19 tasks — no unit/component test ever renders the routed root shell in a browser context, so nothing caught that every real page (`/inventory`, `/inventory/:vin`) was rendering the full default scaffold (including a stray top-level `<h1>`) above the actual feature content. It was only discovered once Task 20's Playwright suite exercised a real browser against the real running app and hit a strict-mode violation from two `<h1>` elements on the same page. Doing this cleanup here, immediately after scaffolding, means it's never present in a production build at all rather than being caught 19 tasks later.

- [ ] **Step 6: Scaffold the mock-server package**

```bash
mkdir -p /Users/vuongdothanhhuy/Documents/GitHub/keyloop-interview/mock-server
cd /Users/vuongdothanhhuy/Documents/GitHub/keyloop-interview/mock-server
npm init -y
npm install json-server@0.17.4
npm install --save-dev @faker-js/faker@10.5.0 typescript@5.9 tsx@4
```

- [ ] **Step 7: Add ESLint (`angular-eslint`) and Prettier**

```bash
cd /Users/vuongdothanhhuy/Documents/GitHub/keyloop-interview/app
npx ng add @angular-eslint/schematics@22 --skip-confirmation
npm install --save-dev prettier
```
Expected: `.eslintrc.json` (or flat `eslint.config.js`, whichever `angular-eslint`'s schematic generates for this version) and an `eslint`/`lint` architect target added to `angular.json`. Add a minimal `.prettierrc.json` (e.g. `{ "singleQuote": true }`) so `npx eslint src --max-warnings=0` (Task 23's final checklist) and any Prettier-vs-ESLint formatting rule conflicts are resolved consistently from the start, not discovered at Task 23.

- [ ] **Step 8: Install Playwright (used in Task 20)**

```bash
cd /Users/vuongdothanhhuy/Documents/GitHub/keyloop-interview/app
npm install --save-dev @playwright/test@1.61.1
npx playwright install chromium
```

- [ ] **Step 9: Install the Vitest coverage provider (used by `npm test -- --coverage`, Task 23)**

```bash
cd /Users/vuongdothanhhuy/Documents/GitHub/keyloop-interview/app
npm install --save-dev @vitest/coverage-v8
```
> **Added after real execution (2026-07-10):** `npm test -- --coverage` (referenced in both this plan and the README from the start) failed outright with "Code coverage requires either @vitest/coverage-v8 or @vitest/coverage-istanbul to be installed" — neither `ng new` nor any earlier step installs a coverage provider. This wasn't caught until Task 23's final verification pass. Installing it here means every task's own test runs could have used `--coverage` from the start if wanted.

- [ ] **Step 10: Commit**

```bash
git add app mock-server
git commit -m "Scaffold Angular 22 app and json-server mock-server package"
```

---

### Task 2: Domain models

**Files:**
- Create: `app/src/app/features/inventory/models/vehicle.model.ts`
- Create: `app/src/app/features/inventory/models/vehicle-action.model.ts`
- Create: `app/src/app/features/inventory/models/vehicle-filter.model.ts`

**Interfaces:**
- Produces: `Vehicle`, `VehicleStatus`, `VehicleAction`, `VehicleActionType`, `NewVehicleAction`, `VehicleActionDraft`, `VehicleFilter` — every later task imports these exact names/shapes.

- [ ] **Step 1: Write `vehicle.model.ts`**

```typescript
// app/src/app/features/inventory/models/vehicle.model.ts
export type VehicleStatus = 'in_stock' | 'reserved' | 'sold' | 'in_transit';

export type BodyType = 'Sedan' | 'SUV' | 'Truck' | 'Hatchback' | 'Coupe' | 'Van';

export type FuelType = 'Petrol' | 'Diesel' | 'Hybrid' | 'Electric';

export interface Vehicle {
  id: string; // == vin; json-server requires an `id` field on every resource
  vin: string;
  make: string;
  model: string;
  trim: string;
  year: number;
  color: string;
  bodyType: BodyType;
  fuelType: FuelType;
  mileage: number;
  price: number;
  dealershipId: string;
  intakeDate: string; // ISO date (yyyy-MM-dd), date the vehicle entered inventory
  status: VehicleStatus;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
}
```

- [ ] **Step 2: Write `vehicle-action.model.ts`**

```typescript
// app/src/app/features/inventory/models/vehicle-action.model.ts
export type VehicleActionType =
  | 'price_reduction_planned'
  | 'marketing_push'
  | 'transfer_requested'
  | 'wholesale_auction'
  | 'manager_review';

export const VEHICLE_ACTION_LABELS: Record<VehicleActionType, string> = {
  price_reduction_planned: 'Price Reduction Planned',
  marketing_push: 'Marketing Push',
  transfer_requested: 'Transfer to Another Site',
  wholesale_auction: 'Wholesale / Auction',
  manager_review: 'Manager Review',
};

export interface VehicleAction {
  id: string;
  vehicleId: string; // == Vehicle.id / vin
  actionType: VehicleActionType;
  note: string;
  loggedBy: string;
  createdAt: string; // ISO datetime
}

// What the UI (ActionLogDialog) produces — no id, no createdAt. VehicleStore.logAction()
// stamps `createdAt` via ClockService before handing off to VehicleActionService, because
// json-server auto-generates `id` on POST but does NOT stamp `createdAt`, and the whole
// app relies on that field for latestAction/history ordering.
export type NewVehicleAction = Omit<VehicleAction, 'id' | 'createdAt'>;

// What VehicleActionService.logAction() actually sends over HTTP — a fully-formed action
// missing only the server-assigned `id`.
export type VehicleActionDraft = Omit<VehicleAction, 'id'>;
```

- [ ] **Step 3: Write `vehicle-filter.model.ts`**

```typescript
// app/src/app/features/inventory/models/vehicle-filter.model.ts
import { VehicleStatus } from './vehicle.model';

export interface VehicleFilter {
  search: string;
  make: string | null;
  model: string | null;
  status: VehicleStatus | null;
  agingOnly: boolean;
}

export const EMPTY_VEHICLE_FILTER: VehicleFilter = {
  search: '',
  make: null,
  model: null,
  status: null,
  agingOnly: false,
};
```

- [ ] **Step 4: Verify it compiles**

Run: `cd app && npx tsc --noEmit -p tsconfig.json`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/src/app/features/inventory/models
git commit -m "feat: add inventory domain models"
```

---

### Task 3: Mock data seed generator (`mock-server/seed.ts`) + generated `db.json`

**Files:**
- Create: `mock-server/seed.ts`
- Create: `mock-server/db.json` (generated output, committed to the repo)

**Interfaces:**
- Produces: `mock-server/db.json` with top-level keys `vehicles: Vehicle[]` and `vehicleActions: VehicleAction[]`.

- [ ] **Step 1: Write the seed script**

```typescript
// mock-server/seed.ts
import { faker } from '@faker-js/faker';
import { writeFileSync } from 'node:fs';

faker.seed(42); // deterministic across regenerations

const DEALERSHIP_ID = 'DEALER-001';
const TODAY = new Date('2026-07-09T00:00:00.000Z'); // fixed "as-of" for reproducible seed data
const IMAGE_WIDTH = 400;
const IMAGE_HEIGHT = 300;

const MAKES_MODELS: Record<string, string[]> = {
  Toyota: ['Corolla', 'RAV4', 'Camry', 'Hilux'],
  Ford: ['Focus', 'Kuga', 'Fiesta', 'Ranger'],
  Volkswagen: ['Golf', 'Tiguan', 'Passat', 'T-Roc'],
  BMW: ['3 Series', 'X1', 'X3', '5 Series'],
  Hyundai: ['Tucson', 'i30', 'Kona'],
};

const BODY_TYPES = ['Sedan', 'SUV', 'Truck', 'Hatchback', 'Coupe', 'Van'] as const;
const FUEL_TYPES = ['Petrol', 'Diesel', 'Hybrid', 'Electric'] as const;
const STATUSES = ['in_stock', 'in_stock', 'in_stock', 'reserved', 'sold'] as const; // weighted toward in_stock
const ACTION_TYPES = [
  'price_reduction_planned',
  'marketing_push',
  'transfer_requested',
  'wholesale_auction',
  'manager_review',
] as const;

function randomVin(): string {
  const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789'; // VINs exclude I, O, Q
  return Array.from({ length: 17 }, () => faker.helpers.arrayElement(chars.split(''))).join('');
}

function daysAgo(days: number): string {
  const d = new Date(TODAY);
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

// Weighted age distribution so ~28% of stock is aging (>90 days), including
// deliberate boundary cases at exactly 90 and 91 days for manual QA.
function sampleAgeDays(index: number): number {
  if (index === 0) return 90; // boundary: NOT aging
  if (index === 1) return 91; // boundary: aging
  const bucket = faker.number.float({ min: 0, max: 1 });
  if (bucket < 0.55) return faker.number.int({ min: 0, max: 90 });
  if (bucket < 0.8) return faker.number.int({ min: 91, max: 180 });
  return faker.number.int({ min: 181, max: 400 });
}

const vehicles = Array.from({ length: 130 }, (_, i) => {
  const make = faker.helpers.arrayElement(Object.keys(MAKES_MODELS));
  const model = faker.helpers.arrayElement(MAKES_MODELS[make]);
  const vin = randomVin();
  return {
    id: vin,
    vin,
    make,
    model,
    trim: faker.helpers.arrayElement(['Base', 'Sport', 'Luxury', 'SE', 'GT']),
    year: faker.number.int({ min: 2021, max: 2026 }),
    color: faker.vehicle.color(),
    bodyType: faker.helpers.arrayElement(BODY_TYPES),
    fuelType: faker.helpers.arrayElement(FUEL_TYPES),
    mileage: faker.number.int({ min: 5, max: 25000 }),
    price: faker.number.int({ min: 12000, max: 65000 }),
    dealershipId: DEALERSHIP_ID,
    intakeDate: daysAgo(sampleAgeDays(i)),
    status: faker.helpers.arrayElement(STATUSES),
    imageUrl: `https://picsum.photos/seed/${vin}/${IMAGE_WIDTH}/${IMAGE_HEIGHT}`,
    imageWidth: IMAGE_WIDTH,
    imageHeight: IMAGE_HEIGHT,
  };
});

// A handful of aging vehicles get 1-3 historical actions logged already.
const vehicleActions = vehicles
  .filter((v) => {
    const ageDays = Math.floor((TODAY.getTime() - new Date(v.intakeDate).getTime()) / 86_400_000);
    return ageDays > 90;
  })
  .filter(() => faker.number.float({ min: 0, max: 1 }) < 0.6)
  .flatMap((v) => {
    const count = faker.number.int({ min: 1, max: 3 });
    return Array.from({ length: count }, (_, i) => ({
      id: faker.string.uuid(),
      vehicleId: v.id,
      actionType: faker.helpers.arrayElement(ACTION_TYPES),
      note: faker.lorem.sentence(),
      loggedBy: 'Alex Manager',
      createdAt: new Date(
        new Date(v.intakeDate).getTime() + (i + 1) * 5 * 86_400_000,
      ).toISOString(),
    }));
  });

writeFileSync(
  new URL('./db.json', import.meta.url),
  JSON.stringify({ vehicles, vehicleActions }, null, 2),
);

console.log(`Seeded ${vehicles.length} vehicles and ${vehicleActions.length} actions.`);
```

- [ ] **Step 2: Add the run script and generate the data**

Edit `mock-server/package.json`, add to `"scripts"`:
```json
{
  "scripts": {
    "seed": "tsx seed.ts",
    "serve": "json-server --watch db.json --port 3001 --middlewares middleware.js"
  }
}
```

Run: `cd mock-server && npm run seed`
Expected output: `Seeded 130 vehicles and <N> actions.` and `mock-server/db.json` is created.

- [ ] **Step 3: Sanity-check the boundary cases landed correctly**

Run:
```bash
node -e "
const db = require('./db.json');
console.log('v90 intakeDate', db.vehicles[0].intakeDate, '-> expect NOT aging');
console.log('v91 intakeDate', db.vehicles[1].intakeDate, '-> expect aging');
"
```
Expected: two ISO dates roughly 90 and 91 days before `2026-07-09`.

- [ ] **Step 4: Commit**

```bash
git add mock-server/seed.ts mock-server/db.json mock-server/package.json
git commit -m "feat: add deterministic faker-based mock inventory data"
```

---

### Task 4: json-server latency/error-injection middleware

**Files:**
- Create: `mock-server/middleware.js`

**Interfaces:**
- Consumes: nothing (Express-style middleware signature `(req, res, next)`).
- Produces: side-effecting middleware wired into `json-server --middlewares middleware.js` (Task 3's `serve` script).

- [ ] **Step 1: Write the middleware**

```javascript
// mock-server/middleware.js
// Simulates realistic network conditions so the frontend's loading/error/retry
// paths have something real to exercise against, instead of instant mock responses.
const MIN_DELAY_MS = 150;
const MAX_DELAY_MS = 500;
// ~3% of GETs return a transient 503 by default. Playwright's webServer (Task 20) sets
// ERROR_RATE=0 so injected 503s don't flake the e2e suite — the store's error-handling path
// is already covered deterministically by VehicleStore's unit tests (Task 12).
const ERROR_RATE = process.env['ERROR_RATE'] !== undefined ? Number(process.env['ERROR_RATE']) : 0.03;

module.exports = (req, res, next) => {
  const delay = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
  setTimeout(() => {
    if (req.method === 'GET' && Math.random() < ERROR_RATE) {
      res.status(503).json({ error: 'Service temporarily unavailable' });
      return;
    }
    next();
  }, delay);
};
```

- [ ] **Step 2: Manually verify it's wired up**

Run: `cd mock-server && npm run serve` (leave running), then in another shell:
```bash
time curl -s http://localhost:3001/vehicles | head -c 200
```
Expected: response takes ≥150ms and returns JSON starting with `[{"id":...`.

- [ ] **Step 3: Commit**

```bash
git add mock-server/middleware.js
git commit -m "feat: add latency/error-injection middleware to mock server"
```

---

### Task 5: `ClockService` — the single source of "now"

**Files:**
- Create: `app/src/app/core/clock.service.ts`
- Test: `app/src/app/core/clock.service.spec.ts`

**Interfaces:**
- Produces: `ClockService` with method `now(): Date`. Every later business-logic function that needs "the current time" takes it as an explicit `asOf: Date` parameter sourced from this service — nothing calls `new Date()` directly outside this file (this is also a direct requirement of `docs/best-practices.md`: "Do not assume globals like (`new Date()`) are available").

- [ ] **Step 1: Write the failing test**

```typescript
// app/src/app/core/clock.service.spec.ts
import { ClockService } from './clock.service';

describe('ClockService', () => {
  it('returns a Date close to the real current time', () => {
    const clock = new ClockService();
    const before = Date.now();
    const now = clock.now();
    const after = Date.now();
    expect(now.getTime()).toBeGreaterThanOrEqual(before);
    expect(now.getTime()).toBeLessThanOrEqual(after);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app && npx ng test --include="**/clock.service.spec.ts"`
Expected: FAIL — `Cannot find module './clock.service'`.

- [ ] **Step 3: Write the implementation**

```typescript
// app/src/app/core/clock.service.ts
import { Service } from '@angular/core';

@Service()
export class ClockService {
  now(): Date {
    return new Date();
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd app && npx ng test --include="**/clock.service.spec.ts"`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add app/src/app/core/clock.service.ts app/src/app/core/clock.service.spec.ts
git commit -m "feat: add ClockService as the single injectable source of 'now'"
```

---

### Task 6: Aging calculation (`inventory-age.util.ts`) — the core business logic

**Files:**
- Create: `app/src/app/features/inventory/domain/inventory-age.util.ts`
- Test: `app/src/app/features/inventory/domain/inventory-age.util.spec.ts`

**Interfaces:**
- Consumes: nothing (pure functions, no Angular DI).
- Produces: `AGING_THRESHOLD_DAYS`, `getInventoryAgeDays(intakeDate: string | Date, asOf: Date): number`, `isAgingStock(ageDays: number): boolean`, `AgingSeverity` type, `getAgingSeverity(ageDays: number): AgingSeverity`. Task 9 imports all of these.

- [ ] **Step 1: Write the failing tests**

```typescript
// app/src/app/features/inventory/domain/inventory-age.util.spec.ts
import {
  AGING_THRESHOLD_DAYS,
  getAgingSeverity,
  getInventoryAgeDays,
  isAgingStock,
} from './inventory-age.util';

describe('getInventoryAgeDays', () => {
  const asOf = new Date('2026-07-09T00:00:00.000Z');

  it('returns 0 for a vehicle that arrived today', () => {
    expect(getInventoryAgeDays('2026-07-09', asOf)).toBe(0);
  });

  it('returns 90 for a vehicle that arrived exactly 90 days ago', () => {
    expect(getInventoryAgeDays('2026-04-10', asOf)).toBe(90);
  });

  it('returns 91 for a vehicle that arrived exactly 91 days ago', () => {
    expect(getInventoryAgeDays('2026-04-09', asOf)).toBe(91);
  });

  it('clamps a future intake date to 0 instead of going negative', () => {
    expect(getInventoryAgeDays('2026-07-15', asOf)).toBe(0);
  });

  it('accepts a Date object as well as an ISO string', () => {
    expect(getInventoryAgeDays(new Date('2026-06-09T00:00:00.000Z'), asOf)).toBe(30);
  });
});

describe('isAgingStock', () => {
  it('is false at exactly the 90-day threshold', () => {
    expect(isAgingStock(AGING_THRESHOLD_DAYS)).toBe(false);
  });

  it('is true one day past the threshold', () => {
    expect(isAgingStock(AGING_THRESHOLD_DAYS + 1)).toBe(true);
  });

  it('is false for a brand-new vehicle', () => {
    expect(isAgingStock(0)).toBe(false);
  });
});

describe('getAgingSeverity', () => {
  it.each([
    [0, 'fresh'],
    [30, 'fresh'],
    [31, 'watch'],
    [90, 'watch'],
    [91, 'aging'],
    [180, 'aging'],
    [181, 'critical'],
    [400, 'critical'],
  ])('classifies %i days as %s', (ageDays, expected) => {
    expect(getAgingSeverity(ageDays)).toBe(expected);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd app && npx ng test --include="**/inventory-age.util.spec.ts"`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```typescript
// app/src/app/features/inventory/domain/inventory-age.util.ts
export const AGING_THRESHOLD_DAYS = 90;

export type AgingSeverity = 'fresh' | 'watch' | 'aging' | 'critical';

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Number of whole days between `intakeDate` and `asOf`, clamped to >= 0. */
export function getInventoryAgeDays(intakeDate: string | Date, asOf: Date): number {
  const intake = typeof intakeDate === 'string' ? new Date(intakeDate) : intakeDate;
  const msPerDay = 1000 * 60 * 60 * 24;
  const diffDays = Math.floor(
    (startOfDay(asOf).getTime() - startOfDay(intake).getTime()) / msPerDay,
  );
  return Math.max(diffDays, 0);
}

/** Spec-mandated rule: strictly more than 90 days in inventory. */
export function isAgingStock(ageDays: number, thresholdDays = AGING_THRESHOLD_DAYS): boolean {
  return ageDays > thresholdDays;
}

/** UX-only severity banding layered on top of the binary aging rule. */
export function getAgingSeverity(ageDays: number): AgingSeverity {
  if (ageDays <= 30) return 'fresh';
  if (ageDays <= 90) return 'watch';
  if (ageDays <= 180) return 'aging';
  return 'critical';
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd app && npx ng test --include="**/inventory-age.util.spec.ts"`
Expected: PASS (16 tests — 5 + 3 + 8, the last group expanded from `it.each`).

- [ ] **Step 5: Commit**

```bash
git add app/src/app/features/inventory/domain/inventory-age.util.ts app/src/app/features/inventory/domain/inventory-age.util.spec.ts
git commit -m "feat: add aging-stock calculation as pure, deterministic business logic"
```

---

### Task 7: Filtering logic (`vehicle-filter.util.ts`)

**Files:**
- Create: `app/src/app/features/inventory/domain/vehicle-filter.util.ts`
- Test: `app/src/app/features/inventory/domain/vehicle-filter.util.spec.ts`

**Interfaces:**
- Consumes: `Vehicle`, `VehicleStatus` (Task 2), `VehicleFilter`, `EMPTY_VEHICLE_FILTER` (Task 2), `AgingSeverity` (Task 6).
- Produces: `VehicleWithAge` type, `matchesFilter(vehicle: VehicleWithAge, filter: VehicleFilter): boolean`, `filterVehicles(vehicles: VehicleWithAge[], filter: VehicleFilter): VehicleWithAge[]`.

- [ ] **Step 1: Write the failing tests**

```typescript
// app/src/app/features/inventory/domain/vehicle-filter.util.spec.ts
import { EMPTY_VEHICLE_FILTER } from '../models/vehicle-filter.model';
import { filterVehicles, matchesFilter, VehicleWithAge } from './vehicle-filter.util';

function makeVehicle(overrides: Partial<VehicleWithAge>): VehicleWithAge {
  return {
    id: 'VIN1',
    vin: 'VIN1',
    make: 'Toyota',
    model: 'Corolla',
    trim: 'Base',
    year: 2024,
    color: 'Blue',
    bodyType: 'Sedan',
    fuelType: 'Petrol',
    mileage: 1000,
    price: 20000,
    dealershipId: 'DEALER-001',
    intakeDate: '2026-01-01',
    status: 'in_stock',
    imageUrl: '',
    imageWidth: 400,
    imageHeight: 300,
    ageDays: 45,
    severity: 'fresh',
    isAging: false,
    ...overrides,
  };
}

describe('matchesFilter', () => {
  it('matches everything against the empty filter', () => {
    expect(matchesFilter(makeVehicle({}), EMPTY_VEHICLE_FILTER)).toBe(true);
  });

  it('filters by make (case-insensitive)', () => {
    const v = makeVehicle({ make: 'Toyota' });
    expect(matchesFilter(v, { ...EMPTY_VEHICLE_FILTER, make: 'toyota' })).toBe(true);
    expect(matchesFilter(v, { ...EMPTY_VEHICLE_FILTER, make: 'Ford' })).toBe(false);
  });

  it('filters by model (case-insensitive)', () => {
    const v = makeVehicle({ model: 'Corolla' });
    expect(matchesFilter(v, { ...EMPTY_VEHICLE_FILTER, model: 'Corolla' })).toBe(true);
    expect(matchesFilter(v, { ...EMPTY_VEHICLE_FILTER, model: 'corolla' })).toBe(true);
    expect(matchesFilter(v, { ...EMPTY_VEHICLE_FILTER, model: 'RAV4' })).toBe(false);
  });

  it('filters by status', () => {
    const v = makeVehicle({ status: 'reserved' });
    expect(matchesFilter(v, { ...EMPTY_VEHICLE_FILTER, status: 'reserved' })).toBe(true);
    expect(matchesFilter(v, { ...EMPTY_VEHICLE_FILTER, status: 'in_stock' })).toBe(false);
  });

  it('filters to aging-only when agingOnly is set', () => {
    const fresh = makeVehicle({ isAging: false });
    const aging = makeVehicle({ isAging: true });
    const filter = { ...EMPTY_VEHICLE_FILTER, agingOnly: true };
    expect(matchesFilter(fresh, filter)).toBe(false);
    expect(matchesFilter(aging, filter)).toBe(true);
  });

  it('free-text search matches make, model, or VIN, case-insensitively', () => {
    const v = makeVehicle({ make: 'Toyota', model: 'Corolla', vin: 'ABC123' });
    expect(matchesFilter(v, { ...EMPTY_VEHICLE_FILTER, search: 'corolla' })).toBe(true);
    expect(matchesFilter(v, { ...EMPTY_VEHICLE_FILTER, search: 'abc123' })).toBe(true);
    expect(matchesFilter(v, { ...EMPTY_VEHICLE_FILTER, search: 'nissan' })).toBe(false);
  });

  it('combines multiple active filter fields with AND semantics', () => {
    const v = makeVehicle({ make: 'Toyota', model: 'Corolla', isAging: true });
    const passingFilter = { ...EMPTY_VEHICLE_FILTER, make: 'Toyota', agingOnly: true };
    const failingFilter = { ...EMPTY_VEHICLE_FILTER, make: 'Toyota', model: 'RAV4' };
    expect(matchesFilter(v, passingFilter)).toBe(true);
    expect(matchesFilter(v, failingFilter)).toBe(false);
  });

  it('rejects a search match on a non-aging vehicle when agingOnly is also set', () => {
    const v = makeVehicle({ make: 'Toyota', isAging: false });
    expect(matchesFilter(v, { ...EMPTY_VEHICLE_FILTER, search: 'toyota', agingOnly: true })).toBe(false);
  });

  it('rejects a make match when status also fails to match', () => {
    const v = makeVehicle({ make: 'Ford', status: 'reserved' });
    expect(matchesFilter(v, { ...EMPTY_VEHICLE_FILTER, make: 'Ford', status: 'in_stock' })).toBe(false);
  });
});

describe('filterVehicles', () => {
  it('returns an empty array when nothing matches', () => {
    const vehicles = [makeVehicle({ make: 'Toyota' }), makeVehicle({ make: 'Ford' })];
    expect(filterVehicles(vehicles, { ...EMPTY_VEHICLE_FILTER, make: 'BMW' })).toEqual([]);
  });

  it('preserves input order for matching vehicles', () => {
    const vehicles = [
      makeVehicle({ id: 'A', make: 'Toyota' }),
      makeVehicle({ id: 'B', make: 'Toyota' }),
    ];
    const result = filterVehicles(vehicles, { ...EMPTY_VEHICLE_FILTER, make: 'Toyota' });
    expect(result.map((v) => v.id)).toEqual(['A', 'B']);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd app && npx ng test --include="**/vehicle-filter.util.spec.ts"`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```typescript
// app/src/app/features/inventory/domain/vehicle-filter.util.ts
import { Vehicle } from '../models/vehicle.model';
import { VehicleFilter } from '../models/vehicle-filter.model';
import { AgingSeverity } from './inventory-age.util';
import { VehicleAction } from '../models/vehicle-action.model';

export interface VehicleWithAge extends Vehicle {
  ageDays: number;
  severity: AgingSeverity;
  isAging: boolean;
  latestAction?: VehicleAction;
}

export function matchesFilter(vehicle: VehicleWithAge, filter: VehicleFilter): boolean {
  if (filter.make && vehicle.make.toLowerCase() !== filter.make.toLowerCase()) return false;
  if (filter.model && vehicle.model.toLowerCase() !== filter.model.toLowerCase()) return false;
  if (filter.status && vehicle.status !== filter.status) return false;
  if (filter.agingOnly && !vehicle.isAging) return false;

  if (filter.search.trim()) {
    const needle = filter.search.trim().toLowerCase();
    const haystack = `${vehicle.make} ${vehicle.model} ${vehicle.vin}`.toLowerCase();
    if (!haystack.includes(needle)) return false;
  }

  return true;
}

export function filterVehicles(
  vehicles: VehicleWithAge[],
  filter: VehicleFilter,
): VehicleWithAge[] {
  return vehicles.filter((v) => matchesFilter(v, filter));
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd app && npx ng test --include="**/vehicle-filter.util.spec.ts"`
Expected: PASS (11 tests — 9 originally, plus 2 added after a code-review pass found the `model` filter's given test never actually proved its case-insensitive behavior, and that only one AND-semantics combination was covered).

- [ ] **Step 5: Commit**

```bash
git add app/src/app/features/inventory/domain/vehicle-filter.util.ts app/src/app/features/inventory/domain/vehicle-filter.util.spec.ts
git commit -m "feat: add vehicle filtering as pure business logic"
```

---

### Task 8: KPI aggregation (`inventory-kpi.util.ts`)

**Files:**
- Create: `app/src/app/features/inventory/domain/inventory-kpi.util.ts`
- Test: `app/src/app/features/inventory/domain/inventory-kpi.util.spec.ts`

**Interfaces:**
- Consumes: `VehicleWithAge` (Task 7).
- Produces: `InventoryKpis` interface, `computeInventoryKpis(vehicles: VehicleWithAge[]): InventoryKpis`.

- [ ] **Step 1: Write the failing tests**

```typescript
// app/src/app/features/inventory/domain/inventory-kpi.util.spec.ts
import { VehicleWithAge } from './vehicle-filter.util';
import { computeInventoryKpis } from './inventory-kpi.util';

function makeVehicle(ageDays: number, isAging: boolean): VehicleWithAge {
  return {
    id: `v-${ageDays}-${Math.random()}`,
    vin: 'VIN',
    make: 'Toyota',
    model: 'Corolla',
    trim: 'Base',
    year: 2024,
    color: 'Blue',
    bodyType: 'Sedan',
    fuelType: 'Petrol',
    mileage: 1000,
    price: 20000,
    dealershipId: 'DEALER-001',
    intakeDate: '2026-01-01',
    status: 'in_stock',
    imageUrl: '',
    imageWidth: 400,
    imageHeight: 300,
    ageDays,
    severity: 'fresh',
    isAging,
  };
}

describe('computeInventoryKpis', () => {
  it('returns all-zero KPIs for an empty inventory', () => {
    expect(computeInventoryKpis([])).toEqual({
      totalVehicles: 0,
      agingCount: 0,
      agingPercentage: 0,
      averageAgeDays: 0,
    });
  });

  it('computes totals, aging count/percentage, and average age', () => {
    const vehicles = [
      makeVehicle(10, false),
      makeVehicle(50, false),
      makeVehicle(100, true),
      makeVehicle(200, true),
    ];
    const kpis = computeInventoryKpis(vehicles);
    expect(kpis.totalVehicles).toBe(4);
    expect(kpis.agingCount).toBe(2);
    expect(kpis.agingPercentage).toBe(50);
    expect(kpis.averageAgeDays).toBe(90); // (10+50+100+200)/4
  });

  it('rounds agingPercentage to one decimal place', () => {
    const vehicles = [makeVehicle(10, false), makeVehicle(100, true), makeVehicle(10, false)];
    expect(computeInventoryKpis(vehicles).agingPercentage).toBeCloseTo(33.3, 1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd app && npx ng test --include="**/inventory-kpi.util.spec.ts"`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```typescript
// app/src/app/features/inventory/domain/inventory-kpi.util.ts
import { VehicleWithAge } from './vehicle-filter.util';

export interface InventoryKpis {
  totalVehicles: number;
  agingCount: number;
  agingPercentage: number; // 0-100, rounded to 1 decimal
  averageAgeDays: number;
}

export function computeInventoryKpis(vehicles: VehicleWithAge[]): InventoryKpis {
  const totalVehicles = vehicles.length;
  if (totalVehicles === 0) {
    return { totalVehicles: 0, agingCount: 0, agingPercentage: 0, averageAgeDays: 0 };
  }

  const agingCount = vehicles.filter((v) => v.isAging).length;
  const totalAge = vehicles.reduce((sum, v) => sum + v.ageDays, 0);

  return {
    totalVehicles,
    agingCount,
    agingPercentage: Math.round((agingCount / totalVehicles) * 1000) / 10,
    averageAgeDays: Math.round(totalAge / totalVehicles),
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd app && npx ng test --include="**/inventory-kpi.util.spec.ts"`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add app/src/app/features/inventory/domain/inventory-kpi.util.ts app/src/app/features/inventory/domain/inventory-kpi.util.spec.ts
git commit -m "feat: add inventory KPI aggregation as pure business logic"
```

---

### Task 9: Vehicle enrichment (`vehicle-enrichment.util.ts`)

**Files:**
- Create: `app/src/app/features/inventory/domain/vehicle-enrichment.util.ts`
- Test: `app/src/app/features/inventory/domain/vehicle-enrichment.util.spec.ts`

**Interfaces:**
- Consumes: `Vehicle`, `VehicleAction` (Task 2), `getInventoryAgeDays`, `isAgingStock`, `getAgingSeverity` (Task 6), `VehicleWithAge` (Task 7).
- Produces: `enrichVehicles(vehicles: Vehicle[], actions: VehicleAction[], asOf: Date): VehicleWithAge[]`. Task 12's store calls this directly.

- [ ] **Step 1: Write the failing tests**

```typescript
// app/src/app/features/inventory/domain/vehicle-enrichment.util.spec.ts
import { Vehicle } from '../models/vehicle.model';
import { VehicleAction } from '../models/vehicle-action.model';
import { enrichVehicles } from './vehicle-enrichment.util';

function makeVehicle(overrides: Partial<Vehicle>): Vehicle {
  return {
    id: 'VIN1',
    vin: 'VIN1',
    make: 'Toyota',
    model: 'Corolla',
    trim: 'Base',
    year: 2024,
    color: 'Blue',
    bodyType: 'Sedan',
    fuelType: 'Petrol',
    mileage: 1000,
    price: 20000,
    dealershipId: 'DEALER-001',
    intakeDate: '2026-01-01',
    status: 'in_stock',
    imageUrl: '',
    imageWidth: 400,
    imageHeight: 300,
    ...overrides,
  };
}

describe('enrichVehicles', () => {
  const asOf = new Date('2026-07-09T00:00:00.000Z');

  it('attaches ageDays, severity, and isAging to each vehicle', () => {
    const vehicles = [makeVehicle({ id: 'V1', intakeDate: '2026-04-01' })]; // 99 days -> aging
    const [enriched] = enrichVehicles(vehicles, [], asOf);
    expect(enriched.ageDays).toBe(99);
    expect(enriched.isAging).toBe(true);
    expect(enriched.severity).toBe('aging');
  });

  it('attaches the most recent action as latestAction, ordered by createdAt', () => {
    const vehicles = [makeVehicle({ id: 'V1' })];
    const actions: VehicleAction[] = [
      {
        id: 'a1',
        vehicleId: 'V1',
        actionType: 'manager_review',
        note: 'older',
        loggedBy: 'Alex',
        createdAt: '2026-06-01T00:00:00.000Z',
      },
      {
        id: 'a2',
        vehicleId: 'V1',
        actionType: 'price_reduction_planned',
        note: 'newer',
        loggedBy: 'Alex',
        createdAt: '2026-06-15T00:00:00.000Z',
      },
    ];
    const [enriched] = enrichVehicles(vehicles, actions, asOf);
    expect(enriched.latestAction?.id).toBe('a2');
  });

  it('leaves latestAction undefined when there are no actions for that vehicle', () => {
    const vehicles = [makeVehicle({ id: 'V1' })];
    const actions: VehicleAction[] = [
      {
        id: 'a1',
        vehicleId: 'OTHER-VIN',
        actionType: 'manager_review',
        note: 'not this vehicle',
        loggedBy: 'Alex',
        createdAt: '2026-06-01T00:00:00.000Z',
      },
    ];
    const [enriched] = enrichVehicles(vehicles, actions, asOf);
    expect(enriched.latestAction).toBeUndefined();
  });

  it('breaks createdAt ties deterministically by id (higher id wins)', () => {
    // Same createdAt is possible when ClockService is mocked to a fixed value, as in tests
    // and in rapid-fire logging within the same millisecond.
    const vehicles = [makeVehicle({ id: 'V1' })];
    const tiedCreatedAt = '2026-06-01T00:00:00.000Z';
    const actions: VehicleAction[] = [
      { id: '5', vehicleId: 'V1', actionType: 'manager_review', note: 'first', loggedBy: 'Alex', createdAt: tiedCreatedAt },
      { id: '12', vehicleId: 'V1', actionType: 'price_reduction_planned', note: 'second', loggedBy: 'Alex', createdAt: tiedCreatedAt },
    ];
    const [enriched] = enrichVehicles(vehicles, actions, asOf);
    expect(enriched.latestAction?.id).toBe('12');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd app && npx ng test --include="**/vehicle-enrichment.util.spec.ts"`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```typescript
// app/src/app/features/inventory/domain/vehicle-enrichment.util.ts
import { Vehicle } from '../models/vehicle.model';
import { VehicleAction } from '../models/vehicle-action.model';
import { getAgingSeverity, getInventoryAgeDays, isAgingStock } from './inventory-age.util';
import { VehicleWithAge } from './vehicle-filter.util';

function latestActionFor(vehicleId: string, actions: VehicleAction[]): VehicleAction | undefined {
  return actions
    .filter((a) => a.vehicleId === vehicleId)
    .sort((a, b) => {
      const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (diff !== 0) return diff;
      // Tie-break deterministically: json-server assigns monotonically increasing string ids,
      // so a numeric-aware id comparison surfaces the actually-latest action instead of relying
      // on input-order stability when two actions share a createdAt.
      return b.id.localeCompare(a.id, undefined, { numeric: true });
    })[0];
}

export function enrichVehicles(
  vehicles: Vehicle[],
  actions: VehicleAction[],
  asOf: Date,
): VehicleWithAge[] {
  return vehicles.map((vehicle) => {
    const ageDays = getInventoryAgeDays(vehicle.intakeDate, asOf);
    return {
      ...vehicle,
      ageDays,
      isAging: isAgingStock(ageDays),
      severity: getAgingSeverity(ageDays),
      latestAction: latestActionFor(vehicle.id, actions),
    };
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd app && npx ng test --include="**/vehicle-enrichment.util.spec.ts"`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add app/src/app/features/inventory/domain/vehicle-enrichment.util.ts app/src/app/features/inventory/domain/vehicle-enrichment.util.spec.ts
git commit -m "feat: add vehicle enrichment pipeline (raw data -> UI-ready data)"
```

---

### Task 10: `VehicleService` (HTTP boundary for vehicles)

**Files:**
- Create: `app/src/app/features/inventory/data-access/vehicle.service.ts`
- Test: `app/src/app/features/inventory/data-access/vehicle.service.spec.ts`

**Interfaces:**
- Consumes: `Vehicle` (Task 2), Angular `HttpClient`.
- Produces: `VehicleService.getVehicles(): Observable<Vehicle[]>`. Task 12's store calls this.

- [ ] **Step 1: Write the failing test**

```typescript
// app/src/app/features/inventory/data-access/vehicle.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { VehicleService } from './vehicle.service';
import { Vehicle } from '../models/vehicle.model';

describe('VehicleService', () => {
  let service: VehicleService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(VehicleService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('GETs /api/vehicles and returns the vehicle list', () => {
    const mockVehicles: Vehicle[] = [
      {
        id: 'V1',
        vin: 'V1',
        make: 'Toyota',
        model: 'Corolla',
        trim: 'Base',
        year: 2024,
        color: 'Blue',
        bodyType: 'Sedan',
        fuelType: 'Petrol',
        mileage: 1000,
        price: 20000,
        dealershipId: 'DEALER-001',
        intakeDate: '2026-01-01',
        status: 'in_stock',
        imageUrl: '',
        imageWidth: 400,
        imageHeight: 300,
      },
    ];

    let result: Vehicle[] | undefined;
    service.getVehicles().subscribe((v) => (result = v));

    const req = httpMock.expectOne('/api/vehicles');
    expect(req.request.method).toBe('GET');
    req.flush(mockVehicles);

    expect(result).toEqual(mockVehicles);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app && npx ng test --include="**/vehicle.service.spec.ts"`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```typescript
// app/src/app/features/inventory/data-access/vehicle.service.ts
import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Vehicle } from '../models/vehicle.model';

@Service()
export class VehicleService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/vehicles';

  getVehicles(): Observable<Vehicle[]> {
    return this.http.get<Vehicle[]>(this.baseUrl);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd app && npx ng test --include="**/vehicle.service.spec.ts"`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add app/src/app/features/inventory/data-access/vehicle.service.ts app/src/app/features/inventory/data-access/vehicle.service.spec.ts
git commit -m "feat: add VehicleService HTTP boundary"
```

---

### Task 11: `VehicleActionService` (HTTP boundary for logging/reading actions)

**Files:**
- Create: `app/src/app/features/inventory/data-access/vehicle-action.service.ts`
- Test: `app/src/app/features/inventory/data-access/vehicle-action.service.spec.ts`

**Interfaces:**
- Consumes: `VehicleAction`, `VehicleActionDraft` (Task 2), Angular `HttpClient`.
- Produces: `VehicleActionService.getAllActions(): Observable<VehicleAction[]>`, `VehicleActionService.logAction(input: VehicleActionDraft): Observable<VehicleAction>`. Task 12's store builds the draft (stamping `createdAt` via `ClockService`) and calls both.

- [ ] **Step 1: Write the failing tests**

```typescript
// app/src/app/features/inventory/data-access/vehicle-action.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { VehicleActionService } from './vehicle-action.service';
import { VehicleAction, VehicleActionDraft } from '../models/vehicle-action.model';

describe('VehicleActionService', () => {
  let service: VehicleActionService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(VehicleActionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('GETs /api/vehicleActions and returns all actions', () => {
    const mockActions: VehicleAction[] = [
      {
        id: 'a1',
        vehicleId: 'V1',
        actionType: 'manager_review',
        note: 'note',
        loggedBy: 'Alex',
        createdAt: '2026-06-01T00:00:00.000Z',
      },
    ];

    let result: VehicleAction[] | undefined;
    service.getAllActions().subscribe((a) => (result = a));

    const req = httpMock.expectOne('/api/vehicleActions');
    expect(req.request.method).toBe('GET');
    req.flush(mockActions);

    expect(result).toEqual(mockActions);
  });

  it('POSTs a new action to /api/vehicleActions', () => {
    const input: VehicleActionDraft = {
      vehicleId: 'V1',
      actionType: 'price_reduction_planned',
      note: 'Reduce by $500',
      loggedBy: 'Alex Manager',
      createdAt: '2026-07-09T00:00:00.000Z', // stamped client-side by VehicleStore, not by json-server
    };
    const created: VehicleAction = { ...input, id: 'a99' };

    let result: VehicleAction | undefined;
    service.logAction(input).subscribe((a) => (result = a));

    const req = httpMock.expectOne('/api/vehicleActions');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(input);
    req.flush(created);

    expect(result).toEqual(created);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd app && npx ng test --include="**/vehicle-action.service.spec.ts"`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```typescript
// app/src/app/features/inventory/data-access/vehicle-action.service.ts
import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { VehicleAction, VehicleActionDraft } from '../models/vehicle-action.model';

@Service()
export class VehicleActionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/vehicleActions';

  getAllActions(): Observable<VehicleAction[]> {
    return this.http.get<VehicleAction[]>(this.baseUrl);
  }

  logAction(input: VehicleActionDraft): Observable<VehicleAction> {
    return this.http.post<VehicleAction>(this.baseUrl, input);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd app && npx ng test --include="**/vehicle-action.service.spec.ts"`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add app/src/app/features/inventory/data-access/vehicle-action.service.ts app/src/app/features/inventory/data-access/vehicle-action.service.spec.ts
git commit -m "feat: add VehicleActionService HTTP boundary"
```

---

### Task 12: `VehicleStore` — plain `@Service()` + signals (no external state library)

**Files:**
- Create: `app/src/app/features/inventory/data-access/vehicle.store.ts`
- Test: `app/src/app/features/inventory/data-access/vehicle.store.spec.ts`

**Interfaces:**
- Consumes: `VehicleService` (Task 10), `VehicleActionService` (Task 11), `ClockService` (Task 5), `enrichVehicles` (Task 9), `filterVehicles` (Task 7), `computeInventoryKpis` (Task 8), `EMPTY_VEHICLE_FILTER` (Task 2).
- Produces: `VehicleStore` (injectable via `inject(VehicleStore)`) exposing readonly signals `vehicles`, `actions`, `filter`, `loading`, `error`, computed signals `enrichedVehicles`, `filteredVehicles`, `agingVehicles`, `kpis`, `availableMakes` (distinct, sorted makes across all vehicles), `availableModels` (distinct, sorted models — scoped to the currently-selected make if one is set, so the model dropdown narrows once a make is picked); methods `load()`, `updateFilter(partial: Partial<VehicleFilter>)`, `logAction(input: NewVehicleAction)`. Every feature component (Tasks 14, 15, 19) injects this store — no component talks to `VehicleService`/`VehicleActionService` directly. `availableMakes`/`availableModels` back the make/model dropdowns added to `VehicleFilterBar` in Task 15, closing the requirement (a) gap where make/model filtering was only supported in the domain layer, not exposed in the UI.

> **Why not `@ngrx/signals`:** see "Angular 22 Revision" point 1 above — its peer range doesn't cover Angular 22 as of this plan's writing. Re-check before reintroducing it.

> **Updated after real execution (2026-07-10) — three real bugs were found in this file by independent code review after the version below was first written, and are already fixed in the code shown in this task (not left as a follow-up):**
> 1. **`logAction()`'s failure rollback used to reset the whole `actions` array to a stale pre-call snapshot** instead of removing only its own optimistic entry — meaning one failed action-log could silently destroy a *different*, already-successfully-saved action if two `logAction()` calls overlapped. Fixed: the error handler now does `s.actions.filter((a) => a.id !== optimisticId)` against the *current* state at error time.
> 2. **`load()`'s success handler used to wholesale-replace `actions` with the server's list**, which could erase a concurrent `logAction()`'s optimistic entry before its own response arrived to replace it (this app calls `store.load()` on every route mount, and the mock server has 150–500ms of injected latency, so this was genuinely reachable, not just a contrived edge case). Fixed: the merge now preserves any still-`optimistic-`-prefixed entries.
> 3. **`optimisticId` used to be derived from `clock.now().getTime()` alone** (millisecond resolution) — two `logAction()` calls within the same millisecond, or under a frozen/mocked clock, would collide. Fixed: a monotonic `optimisticIdCounter` is appended.
>
> A fourth, unrelated fix landed in `updateFilter()` (from a Task 15 review, not Task 12's own review): selecting a `make` could leave an already-selected `model` invalid for the new make, silently diverging the UI dropdown from the applied filter. `updateFilter()` now clears `model` when it no longer belongs to the newly-selected make.

- [ ] **Step 1: Write the failing tests**

```typescript
// app/src/app/features/inventory/data-access/vehicle.store.spec.ts
import { TestBed } from '@angular/core/testing';
import { Observable, of, Subject, throwError } from 'rxjs';
import { VehicleStore } from './vehicle.store';
import { VehicleService } from './vehicle.service';
import { VehicleActionService } from './vehicle-action.service';
import { ClockService } from '../../../core/clock.service';
import { Vehicle } from '../models/vehicle.model';
import { NewVehicleAction, VehicleAction } from '../models/vehicle-action.model';

const FIXED_NOW = new Date('2026-07-09T00:00:00.000Z');

function vehicle(overrides: Partial<Vehicle>): Vehicle {
  return {
    id: 'V1',
    vin: 'V1',
    make: 'Toyota',
    model: 'Corolla',
    trim: 'Base',
    year: 2024,
    color: 'Blue',
    bodyType: 'Sedan',
    fuelType: 'Petrol',
    mileage: 1000,
    price: 20000,
    dealershipId: 'DEALER-001',
    intakeDate: '2026-01-01', // ~190 days -> aging
    status: 'in_stock',
    imageUrl: '',
    imageWidth: 400,
    imageHeight: 300,
    ...overrides,
  };
}

describe('VehicleStore', () => {
  function setup(overrides?: {
    getVehicles?: () => ReturnType<VehicleService['getVehicles']>;
    getAllActions?: () => ReturnType<VehicleActionService['getAllActions']>;
    logAction?: () => ReturnType<VehicleActionService['logAction']>;
    now?: () => Date;
  }) {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: VehicleService,
          useValue: { getVehicles: overrides?.getVehicles ?? (() => of([vehicle({})])) },
        },
        {
          provide: VehicleActionService,
          useValue: {
            getAllActions: overrides?.getAllActions ?? (() => of([])),
            logAction:
              overrides?.logAction ??
              (() =>
                of({
                  id: 'a1',
                  vehicleId: 'V1',
                  actionType: 'price_reduction_planned',
                  note: 'note',
                  loggedBy: 'Alex',
                  createdAt: FIXED_NOW.toISOString(),
                } satisfies VehicleAction)),
          },
        },
        { provide: ClockService, useValue: { now: overrides?.now ?? (() => FIXED_NOW) } },
      ],
    });
    return TestBed.inject(VehicleStore);
  }

  it('starts with an empty, non-loading state', () => {
    const store = setup();
    expect(store.vehicles()).toEqual([]);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('load() populates vehicles/actions and enriches them using the injected clock', () => {
    const store = setup();
    store.load();
    expect(store.loading()).toBe(false);
    expect(store.enrichedVehicles().length).toBe(1);
    expect(store.enrichedVehicles()[0].isAging).toBe(true); // Jan 1 -> Jul 9 is >90 days
  });

  it('load() surfaces an error and stops loading on HTTP failure', () => {
    const store = setup({ getVehicles: () => throwError(() => new Error('network down')) });
    store.load();
    expect(store.loading()).toBe(false);
    expect(store.error()).toBe('network down');
    expect(store.vehicles()).toEqual([]);
  });

  it('updateFilter() narrows filteredVehicles via the pure filter function', () => {
    const store = setup({
      getVehicles: () => of([vehicle({ id: 'V1', make: 'Toyota' }), vehicle({ id: 'V2', make: 'Ford' })]),
    });
    store.load();
    store.updateFilter({ make: 'Ford' });
    expect(store.filteredVehicles().map((v) => v.id)).toEqual(['V2']);
  });

  it('updateFilter() clears a model selection that is no longer valid for a newly-selected make', () => {
    const store = setup({
      getVehicles: () =>
        of([
          vehicle({ id: 'V1', make: 'Toyota', model: 'Corolla' }),
          vehicle({ id: 'V2', make: 'Ford', model: 'Focus' }),
        ]),
    });
    store.load();
    store.updateFilter({ model: 'Corolla' });
    expect(store.filter().model).toBe('Corolla');

    store.updateFilter({ make: 'Ford' });
    expect(store.filter().make).toBe('Ford');
    expect(store.filter().model).toBeNull(); // 'Corolla' isn't a Ford model — stale selection cleared
  });

  it('updateFilter() keeps a model selection that is still valid for the new make', () => {
    const store = setup({
      getVehicles: () =>
        of([
          vehicle({ id: 'V1', make: 'Toyota', model: 'Corolla' }),
          vehicle({ id: 'V2', make: 'Toyota', model: 'RAV4' }),
        ]),
    });
    store.load();
    store.updateFilter({ make: 'Toyota', model: 'Corolla' });
    store.updateFilter({ make: 'Toyota' }); // re-selecting the same make shouldn't clear a valid model
    expect(store.filter().model).toBe('Corolla');
  });

  it('agingVehicles() only contains vehicles past the 90-day threshold', () => {
    const store = setup({
      getVehicles: () =>
        of([
          vehicle({ id: 'FRESH', intakeDate: '2026-07-01' }), // 8 days
          vehicle({ id: 'OLD', intakeDate: '2026-01-01' }), // ~190 days
        ]),
    });
    store.load();
    expect(store.agingVehicles().map((v) => v.id)).toEqual(['OLD']);
  });

  it('kpis() reflects computeInventoryKpis over the enriched vehicles', () => {
    const store = setup();
    store.load();
    expect(store.kpis().totalVehicles).toBe(1);
  });

  it('availableMakes() returns distinct, sorted makes across all vehicles', () => {
    const store = setup({
      getVehicles: () =>
        of([vehicle({ id: 'V1', make: 'Toyota' }), vehicle({ id: 'V2', make: 'Ford' }), vehicle({ id: 'V3', make: 'Ford' })]),
    });
    store.load();
    expect(store.availableMakes()).toEqual(['Ford', 'Toyota']);
  });

  it('availableModels() narrows to the selected make once one is chosen', () => {
    const store = setup({
      getVehicles: () =>
        of([
          vehicle({ id: 'V1', make: 'Toyota', model: 'Corolla' }),
          vehicle({ id: 'V2', make: 'Toyota', model: 'RAV4' }),
          vehicle({ id: 'V3', make: 'Ford', model: 'Focus' }),
        ]),
    });
    store.load();
    expect(store.availableModels()).toEqual(['Corolla', 'Focus', 'RAV4']);
    store.updateFilter({ make: 'Toyota' });
    expect(store.availableModels()).toEqual(['Corolla', 'RAV4']);
  });

  it('logAction() optimistically appends the new action so latestAction updates immediately', () => {
    const store = setup();
    store.load();
    const input: NewVehicleAction = {
      vehicleId: 'V1',
      actionType: 'price_reduction_planned',
      note: 'note',
      loggedBy: 'Alex',
    };
    store.logAction(input);
    expect(store.enrichedVehicles()[0].latestAction?.actionType).toBe('price_reduction_planned');
  });

  it('logAction() rolls back and surfaces an error if the HTTP call fails', () => {
    const store = setup({ logAction: () => throwError(() => new Error('save failed')) });
    store.load();
    const before = store.actions();
    store.logAction({
      vehicleId: 'V1',
      actionType: 'price_reduction_planned',
      note: 'note',
      loggedBy: 'Alex',
    });
    expect(store.error()).toBe('save failed');
    expect(store.actions()).toEqual(before); // rolled back, no phantom action left behind
  });

  it('logAction() rollback only removes its own optimistic entry, not a different concurrent action that already succeeded', () => {
    const subjects: Subject<VehicleAction>[] = [];
    let tick = 0;
    const store = setup({
      logAction: (): Observable<VehicleAction> => {
        const subject = new Subject<VehicleAction>();
        subjects.push(subject);
        return subject.asObservable();
      },
      // Each logAction() call reads clock.now() twice (optimisticId, then createdAt).
      // Advancing on every read gives the two concurrent calls distinct optimisticIds,
      // matching real-world behavior where clock.now() moves forward between calls.
      now: () => new Date(FIXED_NOW.getTime() + tick++),
    });
    store.load();

    store.logAction({ vehicleId: 'V1', actionType: 'manager_review', note: 'will fail', loggedBy: 'Alex' });
    store.logAction({ vehicleId: 'V1', actionType: 'price_reduction_planned', note: 'will succeed', loggedBy: 'Alex' });
    expect(store.actions().length).toBe(2);

    // The second call resolves successfully first.
    subjects[1].next({
      id: 'real-b',
      vehicleId: 'V1',
      actionType: 'price_reduction_planned',
      note: 'will succeed',
      loggedBy: 'Alex',
      createdAt: FIXED_NOW.toISOString(),
    });
    subjects[1].complete();

    // The first call then fails.
    subjects[0].error(new Error('save failed'));

    expect(store.error()).toBe('save failed');
    expect(store.actions().some((a) => a.id === 'real-b')).toBe(true); // survives the other call's rollback
    expect(store.actions().length).toBe(1); // only the failed call's own optimistic entry was removed
  });

  it('load() resolving mid-logAction() does not erase the pending optimistic entry', () => {
    const actionsSubject = new Subject<VehicleAction[]>();
    const logActionSubject = new Subject<VehicleAction>();
    const store = setup({
      getAllActions: () => actionsSubject.asObservable(),
      logAction: () => logActionSubject.asObservable(),
    });

    store.load(); // in flight: getAllActions() hasn't resolved yet

    store.logAction({
      vehicleId: 'V1',
      actionType: 'price_reduction_planned',
      note: 'note',
      loggedBy: 'Alex',
    });
    expect(store.actions().length).toBe(1);
    const optimisticId = store.actions()[0].id;
    expect(optimisticId.startsWith('optimistic-')).toBe(true);

    // load()'s own HTTP response now arrives, with a real actions list that does NOT
    // include the not-yet-persisted optimistic entry.
    actionsSubject.next([]);
    actionsSubject.complete();

    // The optimistic entry must survive load()'s commit.
    expect(store.actions().some((a) => a.id === optimisticId)).toBe(true);
    expect(store.actions().length).toBe(1);

    // logAction()'s own HTTP response then arrives and should replace the optimistic
    // entry with the persisted one, not silently no-op because it's already gone.
    const saved: VehicleAction = {
      id: 'real-1',
      vehicleId: 'V1',
      actionType: 'price_reduction_planned',
      note: 'note',
      loggedBy: 'Alex',
      createdAt: FIXED_NOW.toISOString(),
    };
    logActionSubject.next(saved);
    logActionSubject.complete();

    expect(store.actions().length).toBe(1);
    expect(store.actions()[0].id).toBe('real-1');
  });

  it('two logAction() calls within the same clock instant get distinct optimistic ids', () => {
    const store = setup({
      logAction: () => new Subject<VehicleAction>().asObservable(), // left pending on purpose
      now: () => FIXED_NOW, // frozen clock: both calls read the exact same instant
    });
    store.load();

    store.logAction({ vehicleId: 'V1', actionType: 'manager_review', note: 'first', loggedBy: 'Alex' });
    store.logAction({ vehicleId: 'V1', actionType: 'price_reduction_planned', note: 'second', loggedBy: 'Alex' });

    expect(store.actions().length).toBe(2);
    const ids = store.actions().map((a) => a.id);
    expect(new Set(ids).size).toBe(2); // must be distinct even though the clock didn't advance
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd app && npx ng test --include="**/vehicle.store.spec.ts"`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```typescript
// app/src/app/features/inventory/data-access/vehicle.store.ts
import { Service, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ClockService } from '../../../core/clock.service';
import { NewVehicleAction, VehicleAction, VehicleActionDraft } from '../models/vehicle-action.model';
import { EMPTY_VEHICLE_FILTER, VehicleFilter } from '../models/vehicle-filter.model';
import { Vehicle } from '../models/vehicle.model';
import { enrichVehicles } from '../domain/vehicle-enrichment.util';
import { filterVehicles } from '../domain/vehicle-filter.util';
import { computeInventoryKpis } from '../domain/inventory-kpi.util';
import { VehicleService } from './vehicle.service';
import { VehicleActionService } from './vehicle-action.service';

interface VehicleState {
  vehicles: Vehicle[];
  actions: VehicleAction[];
  filter: VehicleFilter;
  loading: boolean;
  error: string | null;
}

const initialState: VehicleState = {
  vehicles: [],
  actions: [],
  filter: EMPTY_VEHICLE_FILTER,
  loading: false,
  error: null,
};

@Service()
export class VehicleStore {
  private readonly vehicleService = inject(VehicleService);
  private readonly actionService = inject(VehicleActionService);
  private readonly clock = inject(ClockService);

  private readonly state = signal<VehicleState>(initialState);
  // Bumped on every load() call; a response only commits to state if it's still the most
  // recent request in flight, guarding against out-of-order resolution when load() is
  // called again before a prior call's HTTP responses have arrived.
  private latestRequestId = 0;
  // Guarantees optimisticId uniqueness even when clock.now() returns the same instant
  // for two logAction() calls issued within the same millisecond (or under a fake/frozen
  // clock in tests) — timestamp alone is not a reliable uniqueness source.
  private optimisticIdCounter = 0;

  readonly vehicles = computed(() => this.state().vehicles);
  readonly actions = computed(() => this.state().actions);
  readonly filter = computed(() => this.state().filter);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);

  readonly enrichedVehicles = computed(() =>
    enrichVehicles(this.state().vehicles, this.state().actions, this.clock.now()),
  );
  readonly filteredVehicles = computed(() =>
    filterVehicles(this.enrichedVehicles(), this.state().filter),
  );
  readonly agingVehicles = computed(() => this.enrichedVehicles().filter((v) => v.isAging));
  readonly kpis = computed(() => computeInventoryKpis(this.enrichedVehicles()));

  readonly availableMakes = computed(() =>
    Array.from(new Set(this.state().vehicles.map((v) => v.make))).sort(),
  );
  readonly availableModels = computed(() => {
    const make = this.state().filter.make;
    const source = make ? this.state().vehicles.filter((v) => v.make === make) : this.state().vehicles;
    return Array.from(new Set(source.map((v) => v.model))).sort();
  });

  load(): void {
    const requestId = ++this.latestRequestId;
    this.state.update((s) => ({ ...s, loading: true, error: null }));

    forkJoin({
      vehicles: this.vehicleService.getVehicles(),
      actions: this.actionService.getAllActions(),
    }).subscribe({
      next: ({ vehicles, actions }) => {
        if (requestId !== this.latestRequestId) return; // superseded by a newer load()
        this.state.update((s) => ({
          ...s,
          vehicles,
          // Preserve any locally-pending optimistic action(s) a concurrent logAction() appended
          // while this load() was in flight — otherwise a load() resolving mid-logAction() would
          // silently erase the optimistic entry before the real HTTP response arrives to replace it.
          actions: [...actions, ...s.actions.filter((a) => a.id.startsWith('optimistic-'))],
          loading: false,
        }));
      },
      error: (err: Error) => {
        if (requestId !== this.latestRequestId) return;
        this.state.update((s) => ({ ...s, loading: false, error: err.message }));
      },
    });
  }

  updateFilter(partial: Partial<VehicleFilter>): void {
    this.state.update((s) => {
      const filter = { ...s.filter, ...partial };
      // Changing make can narrow the model dropdown (see availableModels above) out from
      // under a currently-selected model — clear a model that's no longer valid for the new
      // make, otherwise the UI's dropdown and the applied filter silently diverge.
      if ('make' in partial && filter.make && filter.model) {
        const modelsForMake = new Set(
          s.vehicles.filter((v) => v.make === filter.make).map((v) => v.model),
        );
        if (!modelsForMake.has(filter.model)) {
          filter.model = null;
        }
      }
      return { ...s, filter };
    });
  }

  logAction(input: NewVehicleAction): void {
    const optimisticId = `optimistic-${this.clock.now().getTime()}-${this.optimisticIdCounter++}`;
    // Stamp createdAt here, client-side: json-server auto-generates `id` on POST but
    // does NOT stamp `createdAt`, and enrichVehicles()/latestActionFor() rely on that
    // field for ordering. The same createdAt is used for the optimistic entry and the
    // draft actually sent over HTTP, so ordering never depends on the server round-trip.
    const draft: VehicleActionDraft = { ...input, createdAt: this.clock.now().toISOString() };
    const optimisticAction: VehicleAction = { ...draft, id: optimisticId };

    this.state.update((s) => ({ ...s, actions: [...s.actions, optimisticAction], error: null }));

    this.actionService.logAction(draft).subscribe({
      next: (saved) =>
        this.state.update((s) => ({
          ...s,
          actions: s.actions.map((a) => (a.id === optimisticId ? saved : a)),
        })),
      error: (err: Error) =>
        this.state.update((s) => ({
          ...s,
          actions: s.actions.filter((a) => a.id !== optimisticId),
          error: err.message,
        })),
    });
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd app && npx ng test --include="**/vehicle.store.spec.ts"`
Expected: PASS (15 tests).

- [ ] **Step 5: Commit**

```bash
git add app/src/app/features/inventory/data-access/vehicle.store.ts app/src/app/features/inventory/data-access/vehicle.store.spec.ts
git commit -m "feat: add VehicleStore (plain signals + @Service) wiring HTTP + business logic"
```

---

### Task 13: `AgingBadge` presentational component

**Files:**
- Create: `app/src/app/features/inventory/ui/aging-badge/aging-badge.ts`
- Test: `app/src/app/features/inventory/ui/aging-badge/aging-badge.spec.ts`

**Interfaces:**
- Consumes: `AgingSeverity` (Task 6).
- Produces: `AgingBadge` component with `input.required<AgingSeverity>('severity')` and `input.required<number>('ageDays')`. Used by Tasks 15 and 19's templates as `<app-aging-badge [severity]="v.severity" [ageDays]="v.ageDays" />`.

- [ ] **Step 1: Write the failing test**

```typescript
// app/src/app/features/inventory/ui/aging-badge/aging-badge.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { AgingBadge } from './aging-badge';

describe('AgingBadge', () => {
  let fixture: ComponentFixture<AgingBadge>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AgingBadge],
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(AgingBadge);
  });

  it('renders the "Critical" label and applies the critical CSS class for severity=critical', async () => {
    fixture.componentRef.setInput('severity', 'critical');
    fixture.componentRef.setInput('ageDays', 200);
    await fixture.whenStable();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Critical');
    expect(el.textContent).toContain('200');
    expect(el.querySelector('.severity-critical')).toBeTruthy();
  });

  it('renders the "Fresh" label for severity=fresh', async () => {
    fixture.componentRef.setInput('severity', 'fresh');
    fixture.componentRef.setInput('ageDays', 5);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Fresh');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app && npx ng test --include="**/aging-badge.spec.ts"`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```typescript
// app/src/app/features/inventory/ui/aging-badge/aging-badge.ts
import { Component, computed, input } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { AgingSeverity } from '../../domain/inventory-age.util';

const LABELS: Record<AgingSeverity, string> = {
  fresh: 'Fresh',
  watch: 'Watch',
  aging: 'Aging',
  critical: 'Critical',
};

@Component({
  selector: 'app-aging-badge',
  imports: [MatChipsModule],
  template: `
    <mat-chip [class]="'severity-' + severity()" [highlighted]="severity() !== 'fresh'">
      {{ label() }} · {{ ageDays() }}d
    </mat-chip>
  `,
})
export class AgingBadge {
  readonly severity = input.required<AgingSeverity>();
  readonly ageDays = input.required<number>();
  readonly label = computed(() => LABELS[this.severity()]);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd app && npx ng test --include="**/aging-badge.spec.ts"`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add app/src/app/features/inventory/ui/aging-badge
git commit -m "feat: add AgingBadge presentational component"
```

---

### Task 14: `InventoryKpiBar` presentational component

**Files:**
- Create: `app/src/app/features/inventory/ui/inventory-kpi-bar/inventory-kpi-bar.ts`
- Test: `app/src/app/features/inventory/ui/inventory-kpi-bar/inventory-kpi-bar.spec.ts`

**Interfaces:**
- Consumes: `InventoryKpis` (Task 8).
- Produces: `InventoryKpiBar` component with `input.required<InventoryKpis>('kpis')`. Used by Task 15's dashboard template.

- [ ] **Step 1: Write the failing test**

```typescript
// app/src/app/features/inventory/ui/inventory-kpi-bar/inventory-kpi-bar.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { InventoryKpiBar } from './inventory-kpi-bar';

describe('InventoryKpiBar', () => {
  let fixture: ComponentFixture<InventoryKpiBar>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [InventoryKpiBar],
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(InventoryKpiBar);
    fixture.componentRef.setInput('kpis', {
      totalVehicles: 130,
      agingCount: 36,
      agingPercentage: 27.7,
      averageAgeDays: 74,
    });
    await fixture.whenStable();
  });

  it('displays the total vehicle count', () => {
    expect(fixture.nativeElement.textContent).toContain('130');
  });

  it('displays the aging count and percentage together', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('36');
    expect(text).toContain('27.7');
  });

  it('displays the average age in days', () => {
    expect(fixture.nativeElement.textContent).toContain('74');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app && npx ng test --include="**/inventory-kpi-bar.spec.ts"`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```typescript
// app/src/app/features/inventory/ui/inventory-kpi-bar/inventory-kpi-bar.ts
import { Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { InventoryKpis } from '../../domain/inventory-kpi.util';

@Component({
  selector: 'app-inventory-kpi-bar',
  imports: [MatCardModule],
  template: `
    <div class="kpi-bar">
      <mat-card class="kpi-card">
        <span class="kpi-value">{{ kpis().totalVehicles }}</span>
        <span class="kpi-label">Total Vehicles</span>
      </mat-card>
      <mat-card class="kpi-card kpi-card--aging">
        <span class="kpi-value">{{ kpis().agingCount }}</span>
        <span class="kpi-label">Aging Stock ({{ kpis().agingPercentage }}%)</span>
      </mat-card>
      <mat-card class="kpi-card">
        <span class="kpi-value">{{ kpis().averageAgeDays }}</span>
        <span class="kpi-label">Avg. Days in Stock</span>
      </mat-card>
    </div>
  `,
  styles: `
    .kpi-bar {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .kpi-card {
      display: flex;
      flex-direction: column;
      padding: 1rem 1.5rem;
      min-width: 160px;
    }
    .kpi-card--aging {
      border-left: 4px solid #d32f2f;
    }
    .kpi-value {
      font-size: 2rem;
      font-weight: 600;
    }
    .kpi-label {
      color: rgba(0, 0, 0, 0.6);
      font-size: 0.85rem;
    }
  `,
})
export class InventoryKpiBar {
  readonly kpis = input.required<InventoryKpis>();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd app && npx ng test --include="**/inventory-kpi-bar.spec.ts"`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add app/src/app/features/inventory/ui/inventory-kpi-bar
git commit -m "feat: add InventoryKpiBar presentational component"
```

---

### Task 15: `VehicleFilterBar` + `InventoryDashboard` (the main list screen, with `NgOptimizedImage` thumbnails)

**Files:**
- Create: `app/src/app/features/inventory/ui/vehicle-filter-bar/vehicle-filter-bar.ts`
- Test: `app/src/app/features/inventory/ui/vehicle-filter-bar/vehicle-filter-bar.spec.ts`
- Create: `app/src/app/features/inventory/feature/inventory-dashboard/inventory-dashboard.ts`
- Test: `app/src/app/features/inventory/feature/inventory-dashboard/inventory-dashboard.spec.ts`

**Interfaces:**
- Consumes: `VehicleFilter`, `EMPTY_VEHICLE_FILTER` (Task 2), `VehicleStore` (Task 12), `AgingBadge` (Task 13), `InventoryKpiBar` (Task 14), `NgOptimizedImage` (`@angular/common`).
- Produces: `VehicleFilterBar` with `input.required<VehicleFilter>('filter')`, `input.required<string[]>('makes')`, `input.required<string[]>('models')`, and `output<Partial<VehicleFilter>>('filterChange')`; `InventoryDashboard` (routed at `/inventory`) composing the KPI bar, filter bar, and a table with vehicle thumbnails, with a row action that navigates to `/inventory/:vin`.

> Requirement (a) asks for filtering "by make, model, age" explicitly. `matchesFilter`/`VehicleFilter` (Task 2/7) already support exact `make`/`model` matching, but the UI previously only exposed free-text search + an aging-only toggle — the make/model dropdowns below close that gap. "Age" filtering is the aging-only toggle here plus the dedicated aging-stock display (Task 13/14).

- [ ] **Step 1: Write the failing test for the filter bar**

```typescript
// app/src/app/features/inventory/ui/vehicle-filter-bar/vehicle-filter-bar.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { By } from '@angular/platform-browser';
import { EMPTY_VEHICLE_FILTER } from '../../models/vehicle-filter.model';
import { VehicleFilterBar } from './vehicle-filter-bar';

describe('VehicleFilterBar', () => {
  let fixture: ComponentFixture<VehicleFilterBar>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [VehicleFilterBar],
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(VehicleFilterBar);
    fixture.componentRef.setInput('filter', EMPTY_VEHICLE_FILTER);
    fixture.componentRef.setInput('makes', ['Ford', 'Toyota']);
    fixture.componentRef.setInput('models', ['Corolla', 'Focus']);
    await fixture.whenStable();
  });

  it('emits a partial filter update when the search box changes', async () => {
    const emitted: Partial<typeof EMPTY_VEHICLE_FILTER>[] = [];
    fixture.componentInstance.filterChange.subscribe((v) => emitted.push(v));

    const input = fixture.debugElement.query(By.css('input[data-testid="search-input"]'))
      .nativeElement as HTMLInputElement;
    input.value = 'corolla';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(emitted).toEqual([{ search: 'corolla' }]);
  });

  it('emits agingOnly=true when the aging-only toggle is checked', async () => {
    const emitted: Partial<typeof EMPTY_VEHICLE_FILTER>[] = [];
    fixture.componentInstance.filterChange.subscribe((v) => emitted.push(v));

    // MatSlideToggle binds its click handler to the internal `<button class="mdc-switch">`,
    // not the `<mat-slide-toggle>` host — a native .click() on the host can't reach a
    // descendant's listener (bubbling only goes up), so the click must target the actual
    // interactive control, same as a real user click would land on. Corrected during Task 15
    // execution (2026-07-10) after this literal query failed against the real
    // @angular/material@22.0.4 DOM structure.
    const toggle = fixture.debugElement.query(By.css('[data-testid="aging-only-toggle"] button'))
      .nativeElement as HTMLButtonElement;
    toggle.click();
    await fixture.whenStable();

    expect(emitted).toContainEqual({ agingOnly: true });
  });

  it('emits a make filter when a make is selected, and null when cleared', async () => {
    const emitted: Partial<typeof EMPTY_VEHICLE_FILTER>[] = [];
    fixture.componentInstance.filterChange.subscribe((v) => emitted.push(v));

    const select = fixture.debugElement.query(By.css('select[data-testid="make-select"]'))
      .nativeElement as HTMLSelectElement;
    select.value = 'Ford';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(emitted).toContainEqual({ make: 'Ford' });

    select.value = '';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(emitted).toContainEqual({ make: null });
  });

  it('emits a model filter when a model is selected', async () => {
    const emitted: Partial<typeof EMPTY_VEHICLE_FILTER>[] = [];
    fixture.componentInstance.filterChange.subscribe((v) => emitted.push(v));

    const select = fixture.debugElement.query(By.css('select[data-testid="model-select"]'))
      .nativeElement as HTMLSelectElement;
    select.value = 'Corolla';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(emitted).toContainEqual({ model: 'Corolla' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app && npx ng test --include="**/vehicle-filter-bar.spec.ts"`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the filter bar implementation**

```typescript
// app/src/app/features/inventory/ui/vehicle-filter-bar/vehicle-filter-bar.ts
import { Component, input, output } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { VehicleFilter } from '../../models/vehicle-filter.model';

@Component({
  selector: 'app-vehicle-filter-bar',
  imports: [MatFormFieldModule, MatInputModule, MatSlideToggleModule],
  template: `
    <div class="filter-bar">
      <mat-form-field appearance="outline">
        <mat-label>Search make, model, VIN</mat-label>
        <input
          matInput
          data-testid="search-input"
          [value]="filter().search"
          (input)="filterChange.emit({ search: $any($event.target).value })"
        />
      </mat-form-field>

      <label>
        Make
        <select
          data-testid="make-select"
          [value]="filter().make ?? ''"
          (change)="filterChange.emit({ make: $any($event.target).value || null })"
        >
          <option value="">All makes</option>
          @for (make of makes(); track make) {
            <option [value]="make">{{ make }}</option>
          }
        </select>
      </label>

      <label>
        Model
        <select
          data-testid="model-select"
          [value]="filter().model ?? ''"
          (change)="filterChange.emit({ model: $any($event.target).value || null })"
        >
          <option value="">All models</option>
          @for (model of models(); track model) {
            <option [value]="model">{{ model }}</option>
          }
        </select>
      </label>

      <mat-slide-toggle
        data-testid="aging-only-toggle"
        [checked]="filter().agingOnly"
        (change)="filterChange.emit({ agingOnly: $event.checked })"
      >
        Aging stock only (&gt;90 days)
      </mat-slide-toggle>
    </div>
  `,
  styles: `
    .filter-bar {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      margin-bottom: 1rem;
    }
  `,
})
export class VehicleFilterBar {
  readonly filter = input.required<VehicleFilter>();
  readonly makes = input.required<string[]>();
  readonly models = input.required<string[]>();
  readonly filterChange = output<Partial<VehicleFilter>>();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd app && npx ng test --include="**/vehicle-filter-bar.spec.ts"`
Expected: PASS (4 tests).

- [ ] **Step 5: Write the failing test for the dashboard component**

```typescript
// app/src/app/features/inventory/feature/inventory-dashboard/inventory-dashboard.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { InventoryDashboard } from './inventory-dashboard';
import { VehicleStore } from '../../data-access/vehicle.store';

describe('InventoryDashboard', () => {
  let fixture: ComponentFixture<InventoryDashboard>;
  const loadSpy = vi.fn();
  const updateFilterSpy = vi.fn();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [InventoryDashboard],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        {
          provide: VehicleStore,
          useValue: {
            load: loadSpy,
            updateFilter: updateFilterSpy,
            loading: signal(false),
            error: signal(null),
            filter: signal({ search: '', make: null, model: null, status: null, agingOnly: false }),
            filteredVehicles: signal([
              {
                id: 'V1', vin: 'V1', make: 'Toyota', model: 'Corolla', trim: 'Base', year: 2024,
                color: 'Blue', bodyType: 'Sedan', fuelType: 'Petrol', mileage: 1000, price: 20000,
                dealershipId: 'DEALER-001', intakeDate: '2026-01-01', status: 'in_stock',
                imageUrl: 'https://picsum.photos/seed/V1/400/300', imageWidth: 400, imageHeight: 300,
                ageDays: 190, severity: 'critical', isAging: true,
              },
            ]),
            kpis: signal({ totalVehicles: 1, agingCount: 1, agingPercentage: 100, averageAgeDays: 190 }),
            availableMakes: signal(['Toyota']),
            availableModels: signal(['Corolla']),
          },
        },
      ],
    });
    fixture = TestBed.createComponent(InventoryDashboard);
  });

  it('calls store.load() on init', async () => {
    await fixture.whenStable();
    expect(loadSpy).toHaveBeenCalled();
  });

  it('renders one row per filtered vehicle', async () => {
    await fixture.whenStable();
    const rows = fixture.nativeElement.querySelectorAll('[data-testid="vehicle-row"]');
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('Corolla');
  });

  it('forwards filter-bar changes to store.updateFilter', async () => {
    await fixture.whenStable();
    fixture.componentInstance.onFilterChange({ agingOnly: true });
    expect(updateFilterSpy).toHaveBeenCalledWith({ agingOnly: true });
  });

  it('gives the photo and actions columns an accessible (non-visual) label', async () => {
    await fixture.whenStable();
    const headerCells = fixture.nativeElement.querySelectorAll('th');
    expect(headerCells[0].textContent?.trim()).toBe('Photo');
    expect(headerCells[headerCells.length - 1].textContent?.trim()).toBe('Actions');
  });

  it('gives the loading spinner an accessible label', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [InventoryDashboard],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        {
          provide: VehicleStore,
          useValue: {
            load: vi.fn(),
            updateFilter: vi.fn(),
            loading: signal(true),
            error: signal(null),
            filter: signal({ search: '', make: null, model: null, status: null, agingOnly: false }),
            filteredVehicles: signal([]),
            kpis: signal({ totalVehicles: 0, agingCount: 0, agingPercentage: 0, averageAgeDays: 0 }),
            availableMakes: signal([]),
            availableModels: signal([]),
          },
        },
      ],
    });
    const loadingFixture = TestBed.createComponent(InventoryDashboard);
    await loadingFixture.whenStable();

    const spinner = loadingFixture.nativeElement.querySelector('mat-spinner');
    expect(spinner?.getAttribute('aria-label')).toBe('Loading inventory');
    expect(spinner?.getAttribute('role')).toBe('status');
  });
});
```

> **Added after real execution (2026-07-10):** the two accessibility tests above (`gives the photo and actions columns...`, `gives the loading spinner...`) were added following the accessibility review noted in Step 7 — they weren't in this task's original test list. The second test needs `TestBed.resetTestingModule()` before reconfiguring, since `beforeEach` already instantiated the component once for the other tests in this `describe` block.

- [ ] **Step 6: Run test to verify it fails**

Run: `cd app && npx ng test --include="**/inventory-dashboard.spec.ts"`
Expected: FAIL — module not found.

- [ ] **Step 7: Write the dashboard implementation**

> **Updated after real execution (2026-07-10):** an accessibility review (`docs/best-practices.md` states AXE/WCAG AA compliance as a hard requirement) found the original version below had empty `<th></th>` cells for the thumbnail/actions columns (no accessible name for a screen reader) and a `<mat-spinner>` with no `aria-label`. The version shown here already has both fixed — visually-hidden `<span>` column labels and `aria-label`/`role="status"` on the spinner — via a `.visually-hidden` CSS clip technique (not `display:none`, which would also remove the text from the accessibility tree).

```typescript
// app/src/app/features/inventory/feature/inventory-dashboard/inventory-dashboard.ts
import { Component, OnInit, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AgingBadge } from '../../ui/aging-badge/aging-badge';
import { InventoryKpiBar } from '../../ui/inventory-kpi-bar/inventory-kpi-bar';
import { VehicleFilterBar } from '../../ui/vehicle-filter-bar/vehicle-filter-bar';
import { VehicleStore } from '../../data-access/vehicle.store';
import { VehicleFilter } from '../../models/vehicle-filter.model';

@Component({
  selector: 'app-inventory-dashboard',
  imports: [
    RouterLink,
    NgOptimizedImage,
    MatButtonModule,
    MatProgressSpinnerModule,
    AgingBadge,
    InventoryKpiBar,
    VehicleFilterBar,
  ],
  template: `
    <app-inventory-kpi-bar [kpis]="store.kpis()" />
    <app-vehicle-filter-bar
      [filter]="store.filter()"
      [makes]="store.availableMakes()"
      [models]="store.availableModels()"
      (filterChange)="onFilterChange($event)"
    />

    @if (store.loading()) {
      <mat-spinner diameter="32" aria-label="Loading inventory" role="status" />
    } @else if (store.error(); as error) {
      <p class="error" role="alert">Couldn't load inventory: {{ error }}</p>
    } @else if (store.filteredVehicles().length === 0) {
      <p>No vehicles match the current filters.</p>
    } @else {
      <table>
        <thead>
          <tr>
            <th><span class="visually-hidden">Photo</span></th>
            <th>VIN</th>
            <th>Make</th>
            <th>Model</th>
            <th>Age</th>
            <th>Status</th>
            <th><span class="visually-hidden">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          @for (vehicle of store.filteredVehicles(); track vehicle.id) {
            <tr data-testid="vehicle-row">
              <td>
                <img
                  [ngSrc]="vehicle.imageUrl"
                  [width]="vehicle.imageWidth"
                  [height]="vehicle.imageHeight"
                  class="thumb"
                  alt="{{ vehicle.year }} {{ vehicle.make }} {{ vehicle.model }}"
                />
              </td>
              <td>{{ vehicle.vin }}</td>
              <td>{{ vehicle.make }}</td>
              <td>{{ vehicle.model }}</td>
              <td><app-aging-badge [severity]="vehicle.severity" [ageDays]="vehicle.ageDays" /></td>
              <td>{{ vehicle.status }}</td>
              <td>
                <a mat-button [routerLink]="['/inventory', vehicle.vin]">View / Log Action</a>
              </td>
            </tr>
          }
        </tbody>
      </table>
    }
  `,
  styles: `
    .thumb {
      width: 64px;
      height: auto;
      border-radius: 4px;
    }
    .visually-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `,
})
export class InventoryDashboard implements OnInit {
  protected readonly store = inject(VehicleStore);

  ngOnInit(): void {
    this.store.load();
  }

  onFilterChange(partial: Partial<VehicleFilter>): void {
    this.store.updateFilter(partial);
  }
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `cd app && npx ng test --include="**/inventory-dashboard.spec.ts"`
Expected: PASS (5 tests — the original 3 plus 2 accessibility tests added after the review above: one asserting the visually-hidden column labels, one asserting the spinner's `aria-label`/`role`).

- [ ] **Step 9: Commit**

```bash
git add app/src/app/features/inventory/ui/vehicle-filter-bar app/src/app/features/inventory/feature/inventory-dashboard
git commit -m "feat: add VehicleFilterBar and InventoryDashboard (with NgOptimizedImage thumbnails)"
```

---

### Task 16: `LoggerService` + HTTP logging interceptor

**Files:**
- Create: `app/src/app/core/logger.service.ts`
- Test: `app/src/app/core/logger.service.spec.ts`
- Create: `app/src/app/core/http-logging.interceptor.ts`
- Test: `app/src/app/core/http-logging.interceptor.spec.ts`

**Interfaces:**
- Consumes: `ClockService` (Task 5).
- Produces: `LoggerService` with `.info/.warn/.error(message: string, context?: Record<string, unknown>)`; `httpLoggingInterceptor: HttpInterceptorFn` registered in `app.config.ts` (Task 17).

- [ ] **Step 1: Write the failing test for `LoggerService`**

```typescript
// app/src/app/core/logger.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { LoggerService } from './logger.service';
import { ClockService } from './clock.service';

describe('LoggerService', () => {
  it('prefixes log messages with an ISO timestamp and level', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: ClockService, useValue: { now: () => new Date('2026-07-09T00:00:00.000Z') } }],
    });
    const logger = TestBed.inject(LoggerService);
    const spy = vi.spyOn(console, 'info').mockImplementation(() => undefined);

    logger.info('vehicles loaded', { count: 130 });

    expect(spy).toHaveBeenCalledWith('[2026-07-09T00:00:00.000Z] [INFO] vehicles loaded', { count: 130 });
    spy.mockRestore();
  });

  it('logs warnings via console.warn with the WARN level tag', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: ClockService, useValue: { now: () => new Date('2026-07-09T00:00:00.000Z') } }],
    });
    const logger = TestBed.inject(LoggerService);
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    logger.warn('retrying request', { attempt: 2 });

    expect(spy).toHaveBeenCalledWith('[2026-07-09T00:00:00.000Z] [WARN] retrying request', { attempt: 2 });
    spy.mockRestore();
  });

  it('logs errors via console.error with the ERROR level tag', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: ClockService, useValue: { now: () => new Date('2026-07-09T00:00:00.000Z') } }],
    });
    const logger = TestBed.inject(LoggerService);
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    logger.error('request failed', { status: 503 });

    expect(spy).toHaveBeenCalledWith('[2026-07-09T00:00:00.000Z] [ERROR] request failed', { status: 503 });
    spy.mockRestore();
  });

  it('omits the context argument entirely when none is provided', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: ClockService, useValue: { now: () => new Date('2026-07-09T00:00:00.000Z') } }],
    });
    const logger = TestBed.inject(LoggerService);
    const spy = vi.spyOn(console, 'info').mockImplementation(() => undefined);

    logger.info('no context here');

    expect(spy).toHaveBeenCalledWith('[2026-07-09T00:00:00.000Z] [INFO] no context here');
    spy.mockRestore();
  });
});
```

> **Added after real execution (2026-07-10):** the three tests above (`warn`/`error`/no-context) weren't in the originally-given test list — a code-review pass found `.info()` was the only method actually exercised, leaving `.warn()`/`.error()` and the context-omitted path untested despite the implementation correctly handling all of them.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app && npx ng test --include="**/logger.service.spec.ts"`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `LoggerService`**

```typescript
// app/src/app/core/logger.service.ts
import { Service, inject } from '@angular/core';
import { ClockService } from './clock.service';

type LogLevel = 'INFO' | 'WARN' | 'ERROR';

@Service()
export class LoggerService {
  private readonly clock = inject(ClockService);

  info(message: string, context?: Record<string, unknown>): void {
    this.write('INFO', message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.write('WARN', message, context);
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.write('ERROR', message, context);
  }

  private write(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    const line = `[${this.clock.now().toISOString()}] [${level}] ${message}`;
    const method = level === 'ERROR' ? 'error' : level === 'WARN' ? 'warn' : 'info';
    if (context !== undefined) {
      console[method](line, context);
    } else {
      console[method](line);
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd app && npx ng test --include="**/logger.service.spec.ts"`
Expected: PASS (4 tests — the original 1 plus 3 added after the review noted above).

- [ ] **Step 5: Write the failing test for the HTTP logging interceptor**

```typescript
// app/src/app/core/http-logging.interceptor.spec.ts
import { HttpErrorResponse, HttpRequest, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { httpLoggingInterceptor } from './http-logging.interceptor';
import { LoggerService } from './logger.service';

describe('httpLoggingInterceptor', () => {
  it('logs the method, url, and status once the request completes', () =>
    new Promise<void>((resolve) => {
      const infoSpy = vi.fn();
      TestBed.configureTestingModule({
        providers: [{ provide: LoggerService, useValue: { info: infoSpy, error: vi.fn() } }],
      });

      const req = new HttpRequest('GET', '/api/vehicles');
      const next = () => of(new HttpResponse({ status: 200 }));

      TestBed.runInInjectionContext(() => {
        httpLoggingInterceptor(req, next).subscribe(() => {
          expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining('GET /api/vehicles -> 200'));
          resolve();
        });
      });
    }));

  it('logs the method, url, and error status when the request fails, and still propagates the error', () =>
    new Promise<void>((resolve) => {
      const errorSpy = vi.fn();
      TestBed.configureTestingModule({
        providers: [{ provide: LoggerService, useValue: { info: vi.fn(), error: errorSpy } }],
      });

      const req = new HttpRequest('GET', '/api/vehicles');
      const failure = new HttpErrorResponse({ status: 503, statusText: 'Service Unavailable' });
      const next = () => throwError(() => failure);

      TestBed.runInInjectionContext(() => {
        httpLoggingInterceptor(req, next).subscribe({
          error: (err) => {
            expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('GET /api/vehicles -> 503'));
            expect(err).toBe(failure); // the interceptor must not swallow the error
            resolve();
          },
        });
      });
    }));
});
```

> **Added after real execution (2026-07-10):** the second test above (the error/`catchError` path) wasn't in the originally-given test list — the given test only exercised the success path, leaving the interceptor's `catchError` branch (which correctly logs and re-throws) completely untested despite being real, working code.

- [ ] **Step 6: Run test to verify it fails**

Run: `cd app && npx ng test --include="**/http-logging.interceptor.spec.ts"`
Expected: FAIL — module not found.

- [ ] **Step 7: Write the interceptor**

```typescript
// app/src/app/core/http-logging.interceptor.ts
import { HttpErrorResponse, HttpEvent, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, tap, throwError } from 'rxjs';
import { LoggerService } from './logger.service';

export const httpLoggingInterceptor: HttpInterceptorFn = (req, next) => {
  const logger = inject(LoggerService);
  const start = performance.now();

  return next(req).pipe(
    tap((event: HttpEvent<unknown>) => {
      if (event instanceof HttpResponse) {
        const durationMs = Math.round(performance.now() - start);
        logger.info(`${req.method} ${req.urlWithParams} -> ${event.status} (${durationMs}ms)`);
      }
    }),
    catchError((err: HttpErrorResponse) => {
      const durationMs = Math.round(performance.now() - start);
      logger.error(`${req.method} ${req.urlWithParams} -> ${err.status} (${durationMs}ms)`);
      return throwError(() => err);
    }),
  );
};
```

- [ ] **Step 8: Run test to verify it passes**

Run: `cd app && npx ng test --include="**/http-logging.interceptor.spec.ts"`
Expected: PASS (2 tests — the original 1 plus the error-path test added after the review noted above).

- [ ] **Step 9: Commit**

```bash
git add app/src/app/core/logger.service.ts app/src/app/core/logger.service.spec.ts app/src/app/core/http-logging.interceptor.ts app/src/app/core/http-logging.interceptor.spec.ts
git commit -m "feat: add structured LoggerService and HTTP logging interceptor"
```

---

### Task 17: Global error handler + app bootstrap wiring

**Files:**
- Create: `app/src/app/core/global-error-handler.ts`
- Test: `app/src/app/core/global-error-handler.spec.ts`
- Modify: `app/src/app/app.config.ts`
- Modify: `app/src/app/app.routes.ts`
- Create: `app/proxy.conf.json`
- Modify: `app/angular.json`

**Interfaces:**
- Consumes: `LoggerService` (Task 16), `httpLoggingInterceptor` (Task 16), `InventoryDashboard` (Task 15).
- Produces: app-wide providers (zoneless change detection, browser global error listeners, custom `ErrorHandler`, `HttpClient` with interceptor, router), route `/inventory`, redirect `''` -> `/inventory`. The `/inventory/:vin` route is added in Task 19, once `VehicleDetail` exists — registering a `loadComponent()` route against a module that doesn't exist yet would fail `tsc`/`ng build` at this task.

- [ ] **Step 1: Write the failing test**

```typescript
// app/src/app/core/global-error-handler.spec.ts
import { TestBed } from '@angular/core/testing';
import { AppErrorHandler } from './global-error-handler';
import { LoggerService } from './logger.service';

describe('AppErrorHandler', () => {
  it('logs uncaught errors via LoggerService instead of letting them vanish', () => {
    const errorSpy = vi.fn();
    TestBed.configureTestingModule({
      providers: [AppErrorHandler, { provide: LoggerService, useValue: { error: errorSpy } }],
    });
    const handler = TestBed.inject(AppErrorHandler);

    handler.handleError(new Error('boom'));

    expect(errorSpy).toHaveBeenCalledWith('Uncaught error: boom', { stack: expect.any(String) });
  });
});
```

`inject(LoggerService)` in a field initializer only works inside an active injection context — `new AppErrorHandler()` outside `TestBed` throws. Going through `TestBed.inject()` gives `AppErrorHandler` a real injection context backed by a spy `LoggerService`.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app && npx ng test --include="**/global-error-handler.spec.ts"`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```typescript
// app/src/app/core/global-error-handler.ts
import { ErrorHandler, Injectable, inject } from '@angular/core';
import { LoggerService } from './logger.service';

// NOT a @Service(): this is provided manually under the ErrorHandler token
// (see app.config.ts), not auto-provided as itself.
@Injectable()
export class AppErrorHandler implements ErrorHandler {
  private readonly logger = inject(LoggerService);

  handleError(error: Error): void {
    this.logger.error(`Uncaught error: ${error.message}`, { stack: error.stack ?? '' });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd app && npx ng test --include="**/global-error-handler.spec.ts"`
Expected: PASS (1 test).

- [ ] **Step 5: Wire providers and routes**

By this point `app.config.ts` and `app.routes.ts` already exist and have been through two prior modifications (`ng new` in Task 1 Step 2, `ng add @angular/material` in Task 1 Step 3). The blocks below show the **complete intended final contents** of both files, not a diff — reconcile them with whatever the CLI already generated rather than appending blindly.
>
> **Corrected during Task 1 execution:** neither prior step adds `provideAnimationsAsync()` — Material 22's `ng-add` schematic has no `--animations` flag/step at all (confirmed against the actual installed schematic; see Task 1 Step 3's note), and `ng new --zoneless=true` only omits the zone-provider block, it never adds a zoneless-specific one either (see Task 1 Step 2's note). Both `provideZonelessChangeDetection()` and `provideAnimationsAsync()` in the `app.config.ts` block below are being added here, for the first time, by this task — not reconciling against something the CLI already inserted.

```typescript
// app/src/app/app.config.ts
import {
  ApplicationConfig,
  ErrorHandler,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app.routes';
import { httpLoggingInterceptor } from './core/http-logging.interceptor';
import { AppErrorHandler } from './core/global-error-handler';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([httpLoggingInterceptor])),
    provideAnimationsAsync(),
    { provide: ErrorHandler, useClass: AppErrorHandler },
  ],
};
```

```typescript
// app/src/app/app.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'inventory', pathMatch: 'full' },
  {
    path: 'inventory',
    loadComponent: () =>
      import('./features/inventory/feature/inventory-dashboard/inventory-dashboard').then(
        (m) => m.InventoryDashboard,
      ),
  },
  // 'inventory/:vin' is added in Task 19 once VehicleDetail exists.
];
```

```json
// app/proxy.conf.json
{
  "/api": {
    "target": "http://localhost:3001",
    "pathRewrite": { "^/api": "" },
    "changeOrigin": true,
    "logLevel": "debug"
  }
}
```

Edit `app/angular.json`, under `projects.app.architect.serve.options`, add:
```json
{
  "proxyConfig": "proxy.conf.json"
}
```

- [ ] **Step 6: Manually verify the whole chain end to end**

```bash
cd mock-server && npm run serve &
cd app && npm start
```
Open `http://localhost:4200/inventory`. Expected: the vehicle table renders real seeded data (with thumbnails) proxied through `/api/vehicles`; the browser console shows `[INFO] GET /api/vehicles -> 200 (...ms)` log lines.

- [ ] **Step 7: Commit**

```bash
git add app/src/app/core/global-error-handler.ts app/src/app/core/global-error-handler.spec.ts app/src/app/app.config.ts app/src/app/app.routes.ts app/proxy.conf.json app/angular.json
git commit -m "feat: wire routing, HTTP interceptor, zoneless config, and global error handler"
```

---

### Task 18: `CurrentUserService` (mock manager identity for the RBAC signal)

**Files:**
- Create: `app/src/app/core/current-user.service.ts`
- Test: `app/src/app/core/current-user.service.spec.ts`

**Interfaces:**
- Produces: `CurrentUserService` with `readonly currentUser: Signal<{ name: string; role: 'manager' }>`. Task 19's `ActionLogDialog` reads `currentUser().name` to populate `NewVehicleAction.loggedBy`.

- [ ] **Step 1: Write the failing test**

```typescript
// app/src/app/core/current-user.service.spec.ts
import { CurrentUserService } from './current-user.service';

describe('CurrentUserService', () => {
  it('exposes a mocked manager identity (no real auth in this build)', () => {
    const service = new CurrentUserService();
    expect(service.currentUser()).toEqual({ name: 'Alex Manager', role: 'manager' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app && npx ng test --include="**/current-user.service.spec.ts"`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```typescript
// app/src/app/core/current-user.service.ts
import { Service, Signal, signal } from '@angular/core';

export interface CurrentUser {
  name: string;
  role: 'manager';
}

/**
 * No real auth system is in scope for this challenge (see System Design Document,
 * "Assumptions" section). This stands in for what would be a real session/IAM lookup,
 * and exists specifically to make the "allow a manager to log an action" requirement's
 * role boundary visible in the code rather than silently ignored.
 */
@Service()
export class CurrentUserService {
  // Typed as the read-only `Signal`, not the inferred `WritableSignal` — consumers must
  // not be able to mutate the mocked identity, matching VehicleStore's pattern of never
  // exposing a writable signal publicly. (Corrected 2026-07-10: the original code sample
  // here left this as the inferred WritableSignal despite this file's own "Produces" line
  // declaring `Signal<...>` — a real, if easily-fixed, type-safety gap caught by review.)
  readonly currentUser: Signal<CurrentUser> = signal<CurrentUser>({
    name: 'Alex Manager',
    role: 'manager',
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd app && npx ng test --include="**/current-user.service.spec.ts"`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add app/src/app/core/current-user.service.ts app/src/app/core/current-user.service.spec.ts
git commit -m "feat: add mocked CurrentUserService to surface the manager-only RBAC boundary"
```

---

### Task 19: `ActionLogDialog` (Signal Forms) + `VehicleDetail` (with `NgOptimizedImage`)

**Files:**
- Create: `app/src/app/features/inventory/ui/action-log-dialog/action-log-dialog.ts`
- Test: `app/src/app/features/inventory/ui/action-log-dialog/action-log-dialog.spec.ts`
- Create: `app/src/app/features/inventory/feature/vehicle-detail/vehicle-detail.ts`
- Test: `app/src/app/features/inventory/feature/vehicle-detail/vehicle-detail.spec.ts`

**Interfaces:**
- Consumes: `VEHICLE_ACTION_LABELS`, `VehicleActionType`, `NewVehicleAction` (Task 2), `VehicleStore` (Task 12), `CurrentUserService` (Task 18), `AgingBadge` (Task 13), Angular Material `MatDialog`, `@angular/forms/signals` (`form`, `FormField`, `required`, `submit`).
- Produces: `ActionLogDialog` (opened via `MatDialog.open`, closes with a `NewVehicleAction | undefined` through `afterClosed()`); `VehicleDetail` routed at `/inventory/:vin`, showing vehicle info + photo, full action history (newest-first), and a "Log Action" button.

> Per "Angular 22 Revision" point 6: this dialog uses **native** `<select>`/`<textarea>` bound via Signal Forms' `[formField]`, not Material form controls — the skill's own Signal Forms examples only demonstrate native elements, and Material's CVA-compatibility with `[formField]` isn't confirmed. Material is still used for the dialog chrome (`MatDialogModule`, `MatButtonModule`).
>
> Verified directly against `@angular/forms@22.0.6`'s published `fesm2022/signals.mjs`: `[formField]`'s host-validation error message explicitly lists `<input>`, `<select>`, and `<textarea>` as supported native form controls, and `FieldState` exposes both `valid()` and `invalid()` (confirmed against `angular.dev`'s Signal Forms docs, version 22) — so `<select [formField]>` and `actionForm().invalid()` below are both real, documented API, not hallucinated syntax.

- [ ] **Step 1: Write the failing test for the dialog**

```typescript
// app/src/app/features/inventory/ui/action-log-dialog/action-log-dialog.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ActionLogDialog } from './action-log-dialog';

describe('ActionLogDialog', () => {
  let fixture: ComponentFixture<ActionLogDialog>;
  const closeSpy = vi.fn();

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [ActionLogDialog],
      providers: [
        provideZonelessChangeDetection(),
        { provide: MatDialogRef, useValue: { close: closeSpy } },
        { provide: MAT_DIALOG_DATA, useValue: { vehicleId: 'V1', loggedBy: 'Alex Manager' } },
      ],
    });
    fixture = TestBed.createComponent(ActionLogDialog);
    await fixture.whenStable();
  });

  it('does not close the dialog when submitting with no action type selected', async () => {
    await fixture.componentInstance.save();
    await fixture.whenStable();
    expect(closeSpy).not.toHaveBeenCalled();
  });

  it('closes the dialog with the composed NewVehicleAction once a valid action type and note are set', async () => {
    fixture.componentInstance.formModel.set({
      actionType: 'price_reduction_planned',
      note: 'Reduce $500',
    });
    await fixture.componentInstance.save();
    await fixture.whenStable();

    expect(closeSpy).toHaveBeenCalledWith({
      vehicleId: 'V1',
      actionType: 'price_reduction_planned',
      note: 'Reduce $500',
      loggedBy: 'Alex Manager',
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app && npx ng test --include="**/action-log-dialog.spec.ts"`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the dialog implementation**

```typescript
// app/src/app/features/inventory/ui/action-log-dialog/action-log-dialog.ts
import { Component, inject, signal } from '@angular/core';
import { form, FormField, required, submit } from '@angular/forms/signals';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { NewVehicleAction, VEHICLE_ACTION_LABELS, VehicleActionType } from '../../models/vehicle-action.model';

export interface ActionLogDialogData {
  vehicleId: string;
  loggedBy: string;
}

@Component({
  selector: 'app-action-log-dialog',
  imports: [FormField, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Log an Action</h2>
    <mat-dialog-content>
      <label>
        Action
        <select [formField]="actionForm.actionType">
          <option value="">Select an action…</option>
          @for (entry of actionOptions; track entry.value) {
            <option [value]="entry.value">{{ entry.label }}</option>
          }
        </select>
        @if (actionForm.actionType().touched() && actionForm.actionType().errors().length) {
          <span class="field-error">{{ actionForm.actionType().errors()[0].message }}</span>
        }
      </label>

      <label>
        Note
        <textarea [formField]="actionForm.note" rows="3"></textarea>
      </label>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cancel</button>
      <button mat-flat-button color="primary" [disabled]="actionForm().invalid()" (click)="save()">
        Save
      </button>
    </mat-dialog-actions>
  `,
})
export class ActionLogDialog {
  readonly dialogRef = inject(MatDialogRef<ActionLogDialog, NewVehicleAction>);
  private readonly data = inject<ActionLogDialogData>(MAT_DIALOG_DATA);

  readonly actionOptions = (Object.entries(VEHICLE_ACTION_LABELS) as [VehicleActionType, string][]).map(
    ([value, label]) => ({ value, label }),
  );

  // Signal Forms model: never null (per docs/best-practices.md / the signal-forms skill rule) —
  // '' is the "unset" sentinel, rejected by the required() validator below.
  // Not `protected`: the spec sets it directly to drive the form without simulating DOM events.
  readonly formModel = signal<{ actionType: VehicleActionType | ''; note: string }>({
    actionType: '',
    note: '',
  });

  protected readonly actionForm = form(this.formModel, (schemaPath) => {
    required(schemaPath.actionType, { message: 'Please select an action' });
  });

  // Verified during Task 19 execution against the real @angular/forms@22.0.6 types:
  // submit() resolves Promise<boolean> (whether the form was valid and submitted), not
  // Promise<void> as originally assumed here — a type-only correction, no behavior change.
  save(): Promise<boolean> {
    return submit(this.actionForm, async () => {
      const { actionType, note } = this.formModel();
      this.dialogRef.close({
        vehicleId: this.data.vehicleId,
        actionType: actionType as VehicleActionType,
        note,
        loggedBy: this.data.loggedBy,
      });
    });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd app && npx ng test --include="**/action-log-dialog.spec.ts"`
Expected: PASS (2 tests).

- [ ] **Step 5: Write the failing test for `VehicleDetail`**

```typescript
// app/src/app/features/inventory/feature/vehicle-detail/vehicle-detail.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { VehicleDetail } from './vehicle-detail';
import { VehicleStore } from '../../data-access/vehicle.store';
import { CurrentUserService } from '../../../../core/current-user.service';

describe('VehicleDetail', () => {
  let fixture: ComponentFixture<VehicleDetail>;
  const logActionSpy = vi.fn();

  const vehicle = {
    id: 'V1', vin: 'V1', make: 'Toyota', model: 'Corolla', trim: 'Base', year: 2024,
    color: 'Blue', bodyType: 'Sedan', fuelType: 'Petrol', mileage: 1000, price: 20000,
    dealershipId: 'DEALER-001', intakeDate: '2026-01-01', status: 'in_stock',
    imageUrl: 'https://picsum.photos/seed/V1/400/300', imageWidth: 400, imageHeight: 300,
    ageDays: 190, severity: 'critical', isAging: true,
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [VehicleDetail],
      providers: [
        provideZonelessChangeDetection(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'V1' } } } },
        {
          provide: VehicleStore,
          useValue: {
            load: vi.fn(),
            logAction: logActionSpy,
            enrichedVehicles: signal([vehicle]),
            actions: signal([
              { id: 'a1', vehicleId: 'V1', actionType: 'manager_review', note: 'first look', loggedBy: 'Alex Manager', createdAt: '2026-06-01T00:00:00.000Z' },
            ]),
          },
        },
        { provide: CurrentUserService, useValue: { currentUser: signal({ name: 'Alex Manager', role: 'manager' }) } },
        {
          provide: MatDialog,
          useValue: { open: () => ({ afterClosed: () => of({ vehicleId: 'V1', actionType: 'price_reduction_planned', note: 'n', loggedBy: 'Alex Manager' }) }) },
        },
      ],
    });
    fixture = TestBed.createComponent(VehicleDetail);
    await fixture.whenStable();
  });

  it('shows the vehicle make/model and full action history', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Corolla');
    expect(text).toContain('first look');
  });

  it('renders the vehicle photo via NgOptimizedImage', () => {
    const img = fixture.nativeElement.querySelector('img');
    expect(img?.getAttribute('ng-img')).not.toBeNull();
  });

  it('calls store.logAction with the dialog result when the dialog closes with a value', async () => {
    fixture.componentInstance.openLogActionDialog();
    await fixture.whenStable();
    expect(logActionSpy).toHaveBeenCalledWith({
      vehicleId: 'V1', actionType: 'price_reduction_planned', note: 'n', loggedBy: 'Alex Manager',
    });
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `cd app && npx ng test --include="**/vehicle-detail.spec.ts"`
Expected: FAIL — module not found.

- [ ] **Step 7: Write the `VehicleDetail` implementation**

```typescript
// app/src/app/features/inventory/feature/vehicle-detail/vehicle-detail.ts
import { Component, OnInit, computed, inject } from '@angular/core';
import { CurrencyPipe, DatePipe, NgOptimizedImage } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { AgingBadge } from '../../ui/aging-badge/aging-badge';
import { ActionLogDialog } from '../../ui/action-log-dialog/action-log-dialog';
import { VehicleStore } from '../../data-access/vehicle.store';
import { CurrentUserService } from '../../../../core/current-user.service';
import { VEHICLE_ACTION_LABELS } from '../../models/vehicle-action.model';

@Component({
  selector: 'app-vehicle-detail',
  imports: [NgOptimizedImage, CurrencyPipe, DatePipe, MatButtonModule, AgingBadge],
  template: `
    @if (vehicle(); as v) {
      <h1>{{ v.make }} {{ v.model }} ({{ v.year }})</h1>
      <img
        [ngSrc]="v.imageUrl"
        [width]="v.imageWidth"
        [height]="v.imageHeight"
        priority
        alt="{{ v.year }} {{ v.make }} {{ v.model }}"
      />
      <app-aging-badge [severity]="v.severity" [ageDays]="v.ageDays" />
      <p>VIN: {{ v.vin }} · Status: {{ v.status }} · Price: {{ v.price | currency }}</p>

      <button mat-flat-button color="primary" (click)="openLogActionDialog()">Log Action</button>

      <h2>Action History</h2>
      @if (history().length === 0) {
        <p>No actions logged yet.</p>
      } @else {
        <ul>
          @for (action of history(); track action.id) {
            <li>{{ action.createdAt | date: 'medium' }} — {{ actionLabels[action.actionType] }}: {{ action.note }}</li>
          }
        </ul>
      }
    } @else {
      <p>Vehicle not found.</p>
    }
  `,
})
export class VehicleDetail implements OnInit {
  protected readonly store = inject(VehicleStore);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly currentUser = inject(CurrentUserService);
  protected readonly actionLabels = VEHICLE_ACTION_LABELS;

  private readonly vin = this.route.snapshot.paramMap.get('vin')!;

  readonly vehicle = computed(() => this.store.enrichedVehicles().find((v) => v.vin === this.vin));
  readonly history = computed(() =>
    this.store
      .actions()
      .filter((a) => a.vehicleId === this.vin)
      .sort((a, b) => {
        const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        // Same tie-break as latestActionFor() (Task 9): id comparison when createdAt matches.
        return diff !== 0 ? diff : b.id.localeCompare(a.id, undefined, { numeric: true });
      }),
  );

  ngOnInit(): void {
    this.store.load();
  }

  openLogActionDialog(): void {
    this.dialog
      .open(ActionLogDialog, {
        data: { vehicleId: this.vin, loggedBy: this.currentUser.currentUser().name },
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) this.store.logAction(result);
      });
  }
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `cd app && npx ng test --include="**/vehicle-detail.spec.ts"`
Expected: PASS (3 tests).

- [ ] **Step 9: Commit**

```bash
git add app/src/app/features/inventory/ui/action-log-dialog app/src/app/features/inventory/feature/vehicle-detail
git commit -m "feat: add ActionLogDialog (Signal Forms) and VehicleDetail (NgOptimizedImage)"
```

---

### Task 20: Playwright critical-path e2e suite

**Files:**
- Create: `app/playwright.config.ts`
- Create: `app/e2e/inventory.spec.ts`

**Interfaces:**
- Consumes: the running app (`http://localhost:4200`) and mock server (`http://localhost:3001`) started per Task 17 Step 6.
- Produces: 3 e2e scenarios proving the unit-tested business logic is actually wired into the running UI.

- [ ] **Step 1: Write `playwright.config.ts`** (Playwright was already installed in Task 1 Step 8)

```typescript
// app/playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  webServer: [
    {
      command: 'npm --prefix ../mock-server run serve',
      url: 'http://localhost:3001/vehicles',
      reuseExistingServer: true,
      // Disable injected 503s for e2e: they're a real UX concern (see mock-server/middleware.js)
      // but a source of test flakiness here, not something this suite is meant to prove.
      env: { ERROR_RATE: '0' },
    },
    { command: 'npm start', url: 'http://localhost:4200', reuseExistingServer: true },
  ],
  use: { baseURL: 'http://localhost:4200' },
});
```

- [ ] **Step 2: Write the failing e2e spec**

```typescript
// app/e2e/inventory.spec.ts
import { expect, test } from '@playwright/test';

test('filters the inventory list to aging stock only', async ({ page }) => {
  await page.goto('/inventory');
  await expect(page.getByRole('table')).toBeVisible({ timeout: 10_000 });
  const initialRows = await page.locator('[data-testid="vehicle-row"]').count();

  await page.getByLabel(/Aging stock only/i).click();

  await expect(async () => {
    const agingRows = await page.locator('[data-testid="vehicle-row"]').count();
    expect(agingRows).toBeGreaterThan(0);
    expect(agingRows).toBeLessThan(initialRows);
  }).toPass();
});

test('navigates from the list into a vehicle detail page', async ({ page }) => {
  await page.goto('/inventory');
  await page.getByRole('link', { name: /View \/ Log Action/i }).first().click();
  await expect(page).toHaveURL(/\/inventory\/[A-Z0-9]+/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('logs a new action from the detail page and sees it appear in the history', async ({ page }) => {
  await page.goto('/inventory');
  await page.getByRole('link', { name: /View \/ Log Action/i }).first().click();
  await page.getByRole('button', { name: 'Log Action' }).click();

  // getByLabel('Action') is ambiguous here — verified during Task 20 execution (2026-07-10)
  // by actually running the suite, not assumed: getByLabel does substring, case-insensitive
  // matching by default, and the dialog's own accessible name (from aria-labelledby ->
  // <h2 mat-dialog-title>Log an Action</h2>) contains the substring "Action" too, so it's a
  // strict-mode violation (matches both the mat-dialog-container and the <select>). Passing
  // { exact: true } doesn't fix it either — it times out, because getByLabel derives the label
  // text from the wrapping <label>Action<select>...<option>s...</select></label>'s raw DOM
  // textContent, which includes the options' rendered text, not just "Action". The select's
  // true accessible name (confirmed via page.getByRole('dialog').ariaSnapshot()) is the clean
  // "Action", so anchoring on role + accessible name sidesteps the mismatch entirely.
  await page.getByRole('combobox', { name: 'Action', exact: true }).selectOption({
    label: 'Price Reduction Planned',
  });
  await page.getByLabel('Note').fill('Playwright e2e test note');
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page.getByText('Playwright e2e test note')).toBeVisible({ timeout: 10_000 });
});
```

- [ ] **Step 3: Run the suite against the real app**

Run: `cd app && npx playwright test`
Expected: 3 passed. (If `webServer` auto-start races on a cold machine, start `mock-server`'s `npm run serve` and `app`'s `npm start` manually first, then rerun.)

- [ ] **Step 4: Commit**

```bash
git add app/playwright.config.ts app/e2e app/package.json app/package-lock.json
git commit -m "test: add Playwright critical-path e2e suite over filter/detail/log-action"
```

---

### Task 21: System Design Document (Part 1 deliverable)

**Files:**
- Create: `docs/SYSTEM_DESIGN.md`

**Interfaces:** none (documentation).

- [ ] **Step 1: Write `docs/SYSTEM_DESIGN.md`**

Populate with the following required sections (content sourced from this plan):

1. **Architecture diagram** — a Mermaid `flowchart LR` with two subgraphs: `Browser (SPA)` containing `Angular 22 Standalone App -> VehicleStore (signals + @Service) -> HTTP Logging Interceptor`, and `Mock Backend (local Node.js)` containing `json-server -> db.json` plus the latency/error `Middleware`. One edge labeled `HTTP GET/POST /api/vehicles, /api/vehicleActions`.
2. **Component roles** — one paragraph each for: `InventoryDashboard`/`VehicleDetail` (composition roots), `VehicleStore` (single source of truth, plain signals, orchestrates services + pure functions — no external state library, see "Angular 22 Revision"), `VehicleService`/`VehicleActionService` (thin HTTP boundary), `ClockService` (single injectable time source), domain utils (`inventory-age`, `vehicle-filter`, `inventory-kpi`, `vehicle-enrichment` — the "core business logic"), `LoggerService`/`AppErrorHandler`/`httpLoggingInterceptor`/`provideBrowserGlobalErrorListeners()` (observability, two complementary error-catching layers), `CurrentUserService` (mocked RBAC boundary), `json-server` + `db.json` + `middleware.js` (mock persistence + realistic network conditions).
3. **Data flow** — GET flow (`ngOnInit` → `store.load()` → `VehicleService`/`VehicleActionService` → `enrichVehicles` → computed `filteredVehicles`/`kpis` → template) and POST flow (`ActionLogDialog` → Signal Forms `submit()` → `store.logAction()` optimistically appends → `VehicleActionService.logAction()` → reconciles on success or rolls back + surfaces `store.error()` on failure).
4. **Technology choices with justifications** — table: Angular 22.0.6 (verified latest stable; zoneless + Vitest are its actual defaults, not experimental opt-ins), plain `signal()`/`computed()` + `@Service()` for state (not `@ngrx/signals` — its peer range doesn't cover Angular 22, verified directly against the npm registry), Angular Material for non-form chrome, Signal Forms for the one real form (native elements, per the "Angular 22 Revision" reasoning), `json-server` 0.17.4 + `@faker-js/faker` (real HTTP boundary + persisted mutations vs. `in-memory-web-api`/MSW/fake interceptors), Vitest (Angular's own default, zoneless-first "Act, Wait, Assert" testing), Playwright (critical-path e2e proving wiring beyond unit tests), `NgOptimizedImage` for vehicle photos.
5. **Build for the Future** — the PDF's Part 2 requirement to address scalability, performance, reliability, and maintainability explicitly (observability gets its own dedicated item 6 next, per the PDF's specific "logging, metrics, tracing" phrasing — not repeated here):
   - *Scalability*: `Vehicle.dealershipId` is modeled now specifically so a multi-site dealership switcher is additive later, not a rewrite (see Assumption 1); domain functions are pure and stateless, so they parallelize/scale horizontally trivially if ever moved behind a real backend.
   - *Performance*: zoneless change detection + tree-shakeable `@Service()` singletons; lazy-loaded feature routes (`loadComponent()`); `NgOptimizedImage` for vehicle photos; `computed()` signals memoize derived state (`filteredVehicles`, `kpis`, `availableModels`) so nothing recomputes unless its actual inputs change.
   - *Reliability*: `VehicleStore.logAction()` updates optimistically and rolls back on HTTP failure rather than leaving the UI in an inconsistent state; the mock server's injected latency/503s (Task 4) exist specifically to force a real loading/error UX instead of an untested happy-path assumption; `VehicleStore.load()`'s request-id guard (Task 12) prevents an out-of-order stale response from clobbering newer state.
   - *Maintainability*: strict `domain/`/`data-access/`/`ui/`/`feature/` layering — business logic is pure, framework-free, and unit-tested directly (Tasks 6–9); one `VehicleStore` is the single source of truth so components never call `VehicleService`/`VehicleActionService` directly; `ClockService` removes hidden global-clock coupling from every date-based function, keeping business logic deterministic and testable.
6. **Observability strategy** — *Implemented*: `LoggerService` (leveled, timestamped via `ClockService`), `httpLoggingInterceptor` (per-request method/url/status/duration), `AppErrorHandler` (Angular-surfaced errors) + `provideBrowserGlobalErrorListeners()` (truly-uncaught window errors) as two complementary layers. *Documented as production roadmap, not built*: correlation-ID propagation into a real backend, OpenTelemetry-Web distributed tracing, RUM/APM integration, Core Web Vitals reporting.
7. **GenAI design-phase section** — describe: Claude Code (Sonnet 5) used to read the challenge PDF, draft this System Design Document and the implementation plan, and (per the user's own workflow) generate the implementation from the plan; independent second-opinion review requested from two other CLI agents (Antigravity/Gemini-backed, Codex/GPT-5.5-backed) to stress-test the original architecture; a subsequent revision pass driven by the user's own `docs/best-practices.md`, the official `angular-developer`/`angular-new-app` Claude Code skills (installed from `github.com/angular/skills`), and a project-scoped `angular-cli` MCP server. Name concrete decisions that changed as a result: dropping `@ngrx/signals` for a plain-signals `@Service()` store after discovering (by downloading the actual package, not guessing) that its peer range doesn't cover Angular 22; adopting Vitest + zoneless not because they were assumed fashionable but because inspecting the real `@schematics/angular` package showed they are Angular 22's literal defaults; converting the one real form to Signal Forms and deliberately keeping it on native HTML elements rather than Material form controls, for CVA-compatibility reasons; adding `NgOptimizedImage` thumbnails because the best-practices doc's image rule would otherwise have been vacuously satisfied (the old draft had an `imageUrl` field nothing ever rendered).
8. **Note on Ambiguity** — paste the 10 items from "Assumptions & Ambiguity Resolutions" above.

- [ ] **Step 2: Render and sanity-check the Mermaid diagram**

Paste the diagram into a Markdown previewer that supports Mermaid (e.g., GitHub's own renderer once pushed) to confirm it renders without syntax errors.

- [ ] **Step 3: Commit**

```bash
git add docs/SYSTEM_DESIGN.md
git commit -m "docs: add System Design Document"
```

---

### Task 22: README with build/run/test instructions and AI Collaboration Narrative

**Files:**
- Modify: `README.md`

**Interfaces:** none (documentation).

- [ ] **Step 1: Replace the placeholder README with the full submission README**

```markdown
# Keyloop Technical Assessment — Intelligent Inventory Dashboard (Scenario B)

## Overview
[1 paragraph: what this is, which scenario, frontend-only (Angular 22) + mocked backend (json-server).]

## Architecture
[Link to docs/SYSTEM_DESIGN.md; 2-3 sentence summary.]

## Prerequisites
- Node.js >= 20.19 (tested on <exact `node -v` output from the dev machine>)
- npm >= 10

## Getting Started

### 1. Install dependencies
\`\`\`bash
cd mock-server && npm install
cd ../app && npm install
\`\`\`

### 2. Seed the mock data (one-time, or whenever you want to reset it)
\`\`\`bash
cd mock-server && npm run seed
\`\`\`

### 3. Run the mock backend
\`\`\`bash
cd mock-server && npm run serve   # http://localhost:3001
\`\`\`

### 4. Run the app (in a second terminal)
\`\`\`bash
cd app && npm start   # http://localhost:4200/inventory
\`\`\`

## Running Tests

\`\`\`bash
cd app
npm test                    # Vitest via `ng test` — unit + component tests (business logic + UI)
npm test -- --coverage      # with coverage report
npx playwright test         # critical-path e2e suite (auto-starts both servers via `webServer`; if that races on a cold machine, start mock-server's `npm run serve` and app's `npm start` manually first, then rerun)
\`\`\`

## AI Collaboration Narrative

### Strategy
[Real narrative: used Claude Code as primary collaborator; had it read the challenge PDF and produce a detailed master plan *before* any code was written; broke the implementation into ~23 small TDD tasks, each with its own test-first cycle and commit. Provided a personal Angular/TypeScript best-practices document upfront and installed the official Angular Claude Code skills + an Angular CLI MCP server specifically so the AI's Angular-specific output would track the framework's actual current conventions rather than outdated training-data patterns.]

### Verification & Refinement Process
[Real narrative: every AI-authored diff was read before acceptance; requested independent architecture review from two other AI CLIs (Google Antigravity and OpenAI Codex) before implementation started; when asked to target the latest Angular major, had the AI verify claims against the real published npm packages (`@angular/core`, `@schematics/angular`) rather than trust its own recollection — this is how the `@ngrx/signals`/Angular-22 incompatibility and the Vitest/zoneless-by-default facts were actually confirmed, not assumed.]

### Rejected AI Suggestions (evidence of ownership, not blind acceptance)
- Considered `@ngrx/signals` for state management (a real second-opinion recommendation); rejected once its published peer-dependency range was confirmed not to cover the Angular version actually being targeted — a plain `signal()`/`computed()`/`@Service()` store was used instead.
- Considered binding the action-log form's Material `mat-select`/`mat-input` controls directly to Signal Forms; rejected in favor of native `<select>`/`<textarea>` elements since Signal Forms' `[formField]` compatibility with Material's CVA implementation wasn't confirmed, and the official Signal Forms examples only demonstrate native elements.
- Considered leaving observability aspirational-only; rejected in favor of implementing the achievable slice (structured logging, HTTP timing, two complementary error-catching layers) and explicitly labeling the rest (tracing, RUM/APM) as roadmap rather than blurring the line.

### Final Quality Assurance
[Real narrative: full test suite green, `ng build` production build succeeds, manually exercised the app in a browser for the golden path and edge cases (empty filter results, simulated 503 from the mock server's middleware, exact-90-day boundary vehicle), linted and formatted before each commit.]

## Assumptions
[Link to docs/SYSTEM_DESIGN.md#note-on-ambiguity, or paste the 10-item list directly.]
```

- [ ] **Step 2: Fill in the bracketed narrative sections with the real, specific account of what happened during implementation** (replace every `[...]` with actual prose once Tasks 1–21 have actually been executed).

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: write README with setup/test instructions and AI Collaboration Narrative"
```

---

### Task 23: Final submission checklist

**Files:** none — verification only.

- [ ] **Step 1: Run the full verification suite**

```bash
cd app
npx tsc --noEmit -p tsconfig.json
npx eslint src --max-warnings=0
npm test -- --coverage
npx playwright test
npx ng build --configuration production
```
Expected: all green.

- [ ] **Step 2: Cross-check every PDF deliverable is present**

- [ ] `docs/SYSTEM_DESIGN.md` exists and contains all 8 subsections from Task 21 (architecture diagram, component roles, data flow, tech justifications, **Build for the Future**, observability strategy, GenAI section, Note on Ambiguity) — "Build for the Future" is the PDF's own Part 2 requirement and must be individually checkable, not just implicit in other sections.
- [ ] `README.md` has build/run/test instructions, a dedicated "AI Collaboration Narrative" section, and describes the business-logic test suite.
- [ ] `app/src/app/features/inventory/domain/*.spec.ts` (Tasks 6–9) + `data-access/*.spec.ts` (Tasks 10–12) constitute "a suite of tests that validate the core business logic."
- [ ] All 3 Scenario B core requirements are demonstrably met: filterable inventory list (Task 15), aging-stock identification prominently displayed (Tasks 6, 9, 13, 14, 15), persisted actionable insights per aging vehicle (Tasks 11, 12, 19).
- [ ] Video submission — **explicitly out of scope for this plan; user records this themselves.**

- [ ] **Step 3: Commit anything outstanding, then stop — do not push or open a PR without being asked.**

---

## Self-Review Notes (per writing-plans skill)

- **Spec coverage:** Inventory Visualization → Task 15/7. Aging Stock Identification → Tasks 6/9/13/14. Actionable Insights → Tasks 11/12/19. System Design Document → Task 21. README + AI narrative + test suite → Task 22, Tasks 6–12. "Build for the Future" → Task 21's tech-justification/observability sections, zoneless + `@Service()` tree-shaking for performance, lazy-loaded routes, `NgOptimizedImage`.
- **`docs/best-practices.md` coverage:** no `standalone: true` / no explicit `OnPush` (all components) / `input()`+`output()` functions (Tasks 13–15, 19) / `computed()` for derived state (Tasks 12, 19) / `@Service()` over `@Injectable({providedIn:'root'})` (Tasks 5, 10, 11, 12, 16, 18) / Signal Forms for the one new form (Task 19) / no `ngClass`/`ngStyle` anywhere / native control flow throughout / `NgOptimizedImage` for vehicle photos (Tasks 15, 19) / `inject()` everywhere, never constructor injection / no assumed `new Date()` global (Task 5's `ClockService`) / `update()`/`set()` on signals, never `mutate` (Task 12).
- **Placeholder scan:** all code blocks are complete; the one flagged risk (Signal Forms + Material CVA compatibility) is called out explicitly with the mitigation taken (native elements), not silently glossed over.
- **Type consistency:** `Vehicle`/`VehicleAction`/`VehicleFilter`/`VehicleWithAge`/`InventoryKpis` names and shapes are identical from their Task 2/6/7/8/9 definitions through every later consumer (store, components, tests).

## Codex Review Pass (2026-07-09, second revision)

A full read-through by Codex CLI (`codex exec`, independent of the model that wrote this plan) surfaced 4 blockers, 6 should-fix issues, and 2 nice-to-haves, all now fixed in place above:

- **Blockers fixed:** `createdAt` is now stamped client-side via `ClockService` before POSTing (new `VehicleActionDraft` type, Tasks 2/11/12) rather than relying on json-server to supply it — it doesn't; the `/inventory/:vin` route moved from Task 17 to Task 19 so it's registered only once `VehicleDetail` exists (avoiding a `tsc`/`ng build` failure at Task 17); `AppErrorHandler`'s test now goes through `TestBed.inject()` instead of `new AppErrorHandler()`, since `inject()` in a field initializer requires an active DI context.
- **One flagged blocker turned out to be a false positive, verified rather than assumed:** Codex questioned whether `<select [formField]>` and `actionForm().invalid()` were real Signal Forms API. Checked directly against `@angular/forms@22.0.6`'s published `fesm2022/signals.mjs` and `angular.dev`'s docs (v22) — both are genuine, documented API (Task 19's note now records this).
- **Should-fix items:** `formModel` de-`protected`ed so its spec compiles; `VehicleFilterBar` gained explicit make/model `<select>` dropdowns (backed by new `VehicleStore.availableMakes()`/`availableModels()` computeds) since the domain layer supported make/model filtering but the UI never exposed it, leaving requirement (a) only partially demonstrated; `latestActionFor`/`VehicleDetail.history` gained a deterministic `id`-based tie-break for same-`createdAt` actions; `VehicleStore.load()` switched from nested `subscribe()` calls to `forkJoin` + a request-id guard against out-of-order responses; the mock server's 503-injection rate is now `ERROR_RATE`-env-gated and zeroed in Playwright's `webServer` config to remove a flake source; Task 1 gained an explicit ESLint (`angular-eslint`)/Prettier setup step, since Task 23's final checklist and the tech-stack line both assumed it existed.
- **Nice-to-haves:** Task 6's stated pass count corrected (16, not 11) after manually recounting every other task's stated `it()`/`it.each` count across the document — all others were already correct; README's Playwright description reworded to match `webServer` auto-start behavior; Task 17 now notes its `app.config.ts`/`app.routes.ts` blocks are the complete intended file contents to reconcile with prior CLI-generated modifications, not a diff to append blindly.

## PDF Compliance & Task-Structure Review (2026-07-10, third revision)

Re-read `KeyloopCodingChallange.pdf` in full and cross-checked every explicit requirement (both Scenario B's 3 core requirements and the PDF's general Part 1/Part 2/Deliverables/Evaluation sections) against this plan line-by-line, then separately audited whether the 23 tasks were actually structured for parallel execution and cold resumption, not just "small."

- **PDF requirement coverage: all present, one gap fixed.** Every Scenario B requirement, SDD subsection, and deliverable already had a 1:1 task mapping — except Part 2's explicit "Build For the Future: scalability, performance, reliability, maintainability, and observability" line, which only had observability as a named SDD section; the other four attributes were only mentioned once, in passing, in "Self-Review Notes." Since "foresight of architecture" is graded evaluation criterion #1, this needed to be a section a grader can actually point to, not an implicit claim. Fixed by adding an explicit **"Build for the Future"** item to Task 21 (SDD Step 1), mapping scalability → `dealershipId`'s multi-site extensibility, performance → zoneless/tree-shaking/lazy-routes/`NgOptimizedImage`/memoized computeds, reliability → optimistic-rollback + injected-latency/error middleware + `load()`'s request-id guard, maintainability → the `domain`/`data-access`/`ui`/`feature` layering — cross-referencing existing tasks rather than inventing new work. Task 23's checklist item updated from "6 subsections" to "8 subsections" to match.
- **Task granularity was already good** (1–4 files per task, TDD steps, one commit per task) **but the plan never documented which tasks are actually independent.** Traced the real dependency graph: after Task 1, tracks {3,4} (mock data), {5,6,13} (clock/aging/badge), {16} (logging), {18} (identity), and {21} (SDD) have zero dependency on each other or on the Models track (2) beyond Task 1 itself — the plan's strict Task-1-through-23 numbering obscured this. Added a **"Task Dependency Graph & Parallelization Guide"** section (before "Task Breakdown") naming the independent tracks, the actual convergence points (12, 15, 17, 19, 20 are the real sequential bottlenecks), explicit guidance for resuming a cold/interrupted session via `git log` + each task's own `Consumes` line instead of re-reading the whole plan, and which task groups are safe to hand to separate subagents via `superpowers:dispatching-parallel-agents`.
- **Everything else checked and found already correct:** scenario selection and exclusion of A/C/D, the frontend/mocked-backend split matching the PDF's own "a local JSON server" wording, the video deliverable correctly marked out of scope, and the AI Collaboration Narrative's "Rejected AI Suggestions" subsection (Task 22) already directly serves the "AI Engineering & Verification" evaluation dimension.

**Conclusion: green light to move from planning to execution**, pending the user's explicit go-ahead per the planning-phase rule.

**Follow-up (same pass):** the user asked what happens if a token/context limit is hit *mid-task* rather than between tasks — a real gap, since the plan's one-commit-per-task granularity leaves no trace of a test written but not yet implemented. Added a **"Commit Strategy: Red/Green Checkpoints"** section (before "Task Breakdown") requiring a commit after every task's "verify the test fails" step, not just after the final "verify it passes" step, so `git log` alone (no code re-reading) distinguishes "test written, not yet implemented" from "implemented and green" for any interrupted task.

## Task 1 Execution Corrections (2026-07-10)

Task 1 was executed for real (branch `implement-inventory-dashboard`, commit `ace52ea`). Three of this plan's pre-execution assumptions about the Angular 22.0.6 / Angular Material 22.0.4 CLI turned out to be wrong once run against the actual tooling, not the `@schematics/angular@22.0.5` schema snapshot this plan was originally verified against — corrected in place above (Task 1 Steps 2–3, Task 17 Step 5's note, "Angular 22 Revision" point 3):

- `ng new` does not accept `--skip-confirmation` (only `ng add` does) — use `--interactive=false`.
- Angular Material 22's `ng-add` schematic is M3-only: `indigo-pink` and the `--typography`/`--animations` flags no longer exist. Only 4 named palette pairs are valid (`azure-blue`, `rose-red`, `magenta-violet`, `cyan-orange`); `magenta-violet` was chosen as the closest analog to the original indigo-pink intent and confirmed with the user.
- Neither `ng new --zoneless=true` nor `ng add @angular/material` adds an explicit provider call for zoneless or animations — `app.config.ts` as freshly scaffolded has neither `provideZonelessChangeDetection()` nor `provideAnimationsAsync()`. Both are real, valid APIs; they're just added explicitly by Task 17, not auto-inserted earlier as this plan previously assumed.

No functional impact on later tasks: Task 17's `app.config.ts` code block already writes both provider calls explicitly regardless of what earlier steps generate. This section exists so the discrepancy is documented once, in the place future re-reads will find it, rather than resurfacing as a surprise. Also noted for awareness, not action: every `npm`/`ng` command printed an `EBADENGINE` warning (installed Node 25.2.1 vs. the toolchain's preferred `^22.22.3 || ^24.15.0 || >=26.0.0`) — nothing failed because of it, but it's a first place to check if something flaky turns up in a later task.

**Follow-up (2026-07-10, after all 23 tasks executed):** Task 1 above was retroactively amended with three steps that didn't exist in the originally-executed version, once later tasks discovered gaps that should have been caught at scaffolding time rather than several tasks later:
- **Step 4** (`@angular/animations` install) — the original Task 1 didn't install this; its absence wasn't discovered until Task 17's `ng build` failed in production (Task 17's own Execution Corrections/fix commit covers the discovery; installing it in Task 1 means a from-scratch re-run of this plan would never hit that failure).
- **Step 5** (removing the `ng new` scaffold placeholder from `app.html`/`app.ts`/`app.spec.ts`) — not discovered until Task 20's Playwright suite hit a two-`<h1>` strict-mode violation, 19 tasks later. No unit test had ever rendered the routed root shell to catch it sooner.
- **Step 9** (`@vitest/coverage-v8` install) — not discovered until Task 23's final verification pass ran `npm test -- --coverage` for the first time and it failed outright with a missing-provider error.

All three are now genuinely part of Task 1 (steps renumbered accordingly: what was Step 4 is now Step 6, old Step 5 is now Step 7, old Step 6 is now Step 8, old Step 7/Commit is now Step 10), so a from-scratch execution of this plan today would not reproduce any of these three gaps.
