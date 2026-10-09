# Two-tier e2e setup

Plan for splitting the Playwright e2e tests into two suites. Status as of 2026-10-09.

## Goal

| Suite | Folder | Purpose | When to run |
|---|---|---|---|
| **smoke** | `tests/smoke/` | Happy path: checks basic functionality | Day to day, after every change |
| **regression** | `tests/regression/` | Hardened scenarios: syncing, creating and editing songs via shows, races, state management, export | Before a production release |

"Before a release" means: before cutting and deploying a new production version, run `npm run test:all` (smoke first, then regression).

## Design decisions

- **Folders plus Playwright projects**, not `@smoke` tags. A folder makes the choice explicit, while a tag is easy to forget on a new test.
- **Suite selection via `E2E_SUITE`** (`smoke` | `regression` | `all`, default `smoke`), set by the npm scripts through `cross-env`. Playwright always pulls in a project's `dependencies`, so `--project` flags cannot express "regression without smoke, but smoke before regression in the combined run".
- **One shared docker stack** (`docker-compose.e2e.yml`), so there is a single environment to maintain.
- **No dependency on the live songlist.** The backend reads `SONGLIST_URL`; in the e2e stack it points at `songlist-stub` (`e2e/songlist-stub/`), a dependency-free Node server serving `songs.json`.
- **Re-runnable tests.** A spec must not leave data behind that breaks a re-run on a warm stack. Clean up what you create, or use unique names.

## Done

### Step 1: split the suites

- Moved specs: `health-check`, `main-navigation`, `create-show`, `backend-rest-api`, `mqtt-broker` → `tests/smoke/` (14 tests).
- Moved specs: `show-dashboard`, `songs`, `song-selectability` → `tests/regression/` (16 tests). `show-dashboard` is the full UI flow (merge, reorder, winners), so it counts as hardened rather than basic.
- `playwright.config.ts`: projects `smoke`, `regression`, `global-mutations` (runs last, for specs that change state every other spec sees). `all` orders them smoke → regression → global-mutations.
- `package.json` scripts: `test` (= smoke), `test:smoke`, `test:regression`, `test:all`, `test:ui` and `test:debug` (both all suites).
- `scripts/run-e2e-tests.sh [smoke|regression|all]` (default smoke), plus README and DOCKER.md updates.

### Step 2: songlist stub

- Added `e2e/songlist-stub/{server.js,songs.json}` and a `songlist-stub` service in `docker-compose.e2e.yml`, with `SONGLIST_URL` set on the backend.
- Cloud sync and selectability specs now assert fixed fixture songs ("Stub Listed Song", "Stub Unlisted Song"). Written test-first: they failed against the live site, then passed with the stub.
- New spec: a blocked song that is on the cloud list is re-enabled. It also covers `[PT]` name normalisation.

### Verification

- `npm run test:all` on a fresh stack: 30 passed.
- `npm run test:regression` run twice on the warm stack: 16 passed both times.

## Next steps

Write the regression specs one area at a time, test-first. Each new spec should first be shown to fail against a deliberately missing or broken behaviour.

### 3. Shared fixtures (`tests/fixtures/`)

- API seeding helpers (show, song, race) so regression tests set up state through REST and use the UI only for the thing under test.
- MQTT publisher helper (TCP port 3011).
- Unique-name helper to isolate tests from each other.
- Convert `show-dashboard.spec.ts` and `songs.spec.ts` away from `describe.serial` chains where practical.

### 4. Scenario matrix for `tests/regression/`

- **Song sync:** local file upload (empty, duplicate and malformed rows), cloud sync (new, removed and renamed songs; extend `songs.json`), selectability flips, duplicate detection and merge, merging songs already used in races.
- **Shows and races:** create, edit, reorder, merge two waiting races, delete a race that has a winner, the same song twice in one show, deleting a show that has races.
- **State machine:** every valid and invalid transition for show and race, double winner, winner on a cancelled race, tracker restart mid-race.
- **MQTT:** out-of-order, duplicate and garbage messages, reconnects, TCP and WebSocket listeners. Cover the full path MQTT publish → race state → UI and winner → export.
- **Export and import:** export after each scenario above, import into an empty DB (round-trip equality), import over existing data, corrupt file.

### 5. Hardening the regression project

- Retries (1–2 in CI) with traces on.
- `workers: 1` for the state-heavy specs, since they share the DB.
- Longer timeouts (120s+) where needed.
- Decide whether regression should always start from a fresh DB (`npm run docker:down` first, or a script wrapper).

### 6. Optional

- A single `@live` smoke test against the real `songlist.ponytyler.de`, off by default.
- CI wiring: smoke on every push, `test:all` on release branches or tags.

## Open questions

- Should `show-dashboard` keep its UI-driven setup, or move to API seeding once the fixtures exist (step 3)?
- Should `test:all` always tear the stack down first for a clean database?
