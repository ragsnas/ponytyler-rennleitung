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

### Step 3: shared fixtures

- `tests/fixtures/` (import `test`/`expect` from there): `api` (seed and clean up show, song, race, winner), `mqttPublisher` (TCP port 3011: bike status, finish, race and show state changes, raw payloads), `uniqueName`, `exclusiveRaceState`, plus the shared UI helpers `rowByText` and `dismissSuccessSnackBar`. Documented in `e2e/README.md`.
- `tests/regression/fixtures.spec.ts` tests the fixtures themselves (written first and watched fail). It caught two wrong assumptions about the backend: deleting a missing show returns 500, and the backend derives `LISTED` vs `WAITING_FOR_OPPONENT` itself.
- `songs.spec.ts` and `show-dashboard.spec.ts` no longer use `describe.serial`. Every test is independent and seeds through the API. The dashboard tests use the UI only for the action under test, which answers the open question about API seeding.
- **Global backend invariant found:** setting a race to an active state (`RACING`, `RACED`) resets every other such race in the whole DB to `LISTED` (`RaceService.resetOtherActiveRaces`). Parallel winner tests failed intermittently because of it (2 of 5 `all` runs). Tests that set or read such a race now request the `exclusiveRaceState` lock fixture. Every future winner/MQTT spec in step 4 must do the same.
- `uniqueName` has no hyphens: the song file sync mangles them in `<artist> - <name>.mp3`.
- `pickSong` retypes until the option shows up, to survive a rare autocomplete filter race.

### Step 4a: song sync scenario

- **Local file upload** (`song-file-sync.spec.ts`, 7 tests plus 5 known defects): several files in one go, a single clicked file, `[PT]`/`[PTHQ]`/extension stripping, split at the first " - ", existing songs (also with a tag) not offered again, empty files, selectable songs with no file listed (blocked ones not).
- **Block all missing** (`song-file-sync.global.spec.ts`): blocks every selectable song without a file.
- **Cloud sync** (`song-cloud-sync.global.spec.ts`, 8 tests): new songs (listed vs unlisted), second run, song listed twice, case/spacing/tag-insensitive matching, selectable flips for known songs, removed song stays until "Update Selecability", renamed song becomes a new one, empty list.
- **Selectability** (`song-selectability.global.spec.ts`): flipping back and forth with the autocomplete following, unlisted counts as blocked. The two older tests now use API seeding, the `selectable` table cell and the lock.
- **Duplicates and merge** (`song-duplicates.spec.ts`, 5 tests): threshold, merge blocks the duplicate and drops the pair, blocked songs not offered, races keep a merged song (their song ids and the dashboard rows are unchanged). Moved here from `songs.spec.ts`.
- **Infrastructure:** `*.global.spec.ts` selects the `global-mutations` project (it replaces the hard-coded file name). The stub got `PUT`/`DELETE /__admin/songs` on host port 8090, driven by the `songlist` fixture. New fixtures: `songlist`, `exclusiveSongs`, `distinctName`, `api.adoptSongsByArtist`.
- **Verified by mutation:** I broke eight behaviours on purpose (no lowercasing in the cloud match, no selectable flips, no dedupe within the cloud list, `updateSelectability` doing nothing, keeping the `[PTHQ]` tag, merge not blocking, threshold ignored, blocked songs listed as "missing"), rebuilt the stack and confirmed tests failed for each. That found four weak assertions (the row text `block` is always present because of the "Block Song" button, a map that hid duplicate titles, an artist-only lookup that could not see songs created under another artist), now fixed. Tests that pass at once on existing behaviour were not trusted until this was done.

#### Defects found (asserted as `test.fail`, in `song-file-sync.spec.ts`)

Each is a test of the sensible behaviour that is expected to fail. Playwright reports it when the defect is fixed, and the marker should then be removed.

- The same file chosen twice creates two identical songs.
- `AC-DC - Highway.mp3`: the split is at the first "-", so the artist becomes `AC` and the title `DC - Highway`.
- A file name without " - " (`Name.mp3`) creates a song with an **empty artist**.
- `<artist> - .mp3` creates a song with an **empty title**.
- A file name without extension (`<artist> - Title`) creates the garbled title `<artist> -`.

Behaviour I characterised but did not call a defect (worth a look):

- A file counts as an existing song when its name merely *starts with* `<artist> - <title>`, so `Base Extended.mp3` is silently swallowed when a song `Base` exists. This is what lets files with `[PT]` suffixes match.
- The cloud sync never blocks or removes a song that disappears from the cloud list, and a renamed cloud song becomes a second song; only "Update Selecability" blocks the old one.
- The duplicates page pairs every song with its nearest neighbour in the whole database (O(n²)), so unrelated tests' songs can show up as pairs.

### Fresh database for `test:all`

- `test:all` runs `docker:down` first (`down -v`), so a release run always starts from an empty database instead of reusing a warm stack. Verified with a marker show created before the run: gone afterwards, 45 passed on the fresh stack. `test`, `test:smoke` and `test:regression` still reuse a running stack for quick iteration.

### Verification

- `npm run test:all` on a fresh stack: 30 passed (after steps 1 and 2).
- After step 3, `test:all` on the warm stack: 45 passed, 7 runs in a row. The dashboard spec repeated 12 times in parallel: 120 passed.
- After step 4a, `test:all` on a fresh stack: 77 passed (the 5 known defects count as passed), 3 runs in a row.

## Next steps

Write the regression specs one area at a time, test-first. Each new spec should first be shown to fail against a deliberately missing or broken behaviour.

### 4. Scenario matrix for `tests/regression/`

- **Shows and races:** create, edit, reorder, merge two waiting races, delete a race that has a winner, the same song twice in one show, deleting a show that has races.
- **State machine:** every valid and invalid transition for show and race, double winner, winner on a cancelled race, tracker restart mid-race.
- **MQTT:** out-of-order, duplicate and garbage messages, reconnects, TCP and WebSocket listeners. Cover the full path MQTT publish → race state → UI and winner → export.
- **Export and import:** export after each scenario above, import into an empty DB (round-trip equality), import over existing data, corrupt file.

### 5. Hardening the regression project

- Retries (1–2 in CI) with traces on.
- `workers: 1` for the state-heavy specs, since they share the DB.
- Longer timeouts (120s+) where needed.

### 6. Optional

- A single `@live` smoke test against the real `songlist.ponytyler.de`, off by default.
- CI wiring: smoke on every push, `test:all` on release branches or tags.

