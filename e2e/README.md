# E2E Tests with Playwright

This directory contains end-to-end tests for the PonyTyler Rennleitung application.

## Setup

Install dependencies from the e2e directory:
```bash
cd e2e
npm install
```

## Two Suites

| Suite | Folder | Purpose | When to run |
|---|---|---|---|
| **smoke** | `tests/smoke/` | Happy path: checks basic functionality | Day to day, after every change |
| **regression** | `tests/regression/` | Hardened scenarios (song sync, shows, races, state management, export, ...) | Before a production release |

Both run against the same docker stack. The suite is selected through the
`E2E_SUITE` env var, which the npm scripts set for you (a bare
`npx playwright test` runs smoke only). `all` runs smoke first, then
regression.

## Running Tests

```bash
npm test                # = npm run test:smoke
npm run test:smoke      # happy path only
npm run test:regression # hardened suite only
npm run test:all        # smoke, then regression, on a fresh stack and database (run this before a release)
```

Each of these will:
1. Start the dedicated e2e stack via `docker-compose.e2e.yml` (backend, frontend, postgres, songlist stub — the backend also hosts the embedded MQTT broker), or reuse it if it is already up
2. Wait for all services to be healthy
3. Run the selected tests
4. Generate an HTML report in `playwright-report/`

Because a running stack is reused, its database keeps whatever earlier runs
left behind. For a clean regression run, tear it down first
(`npm run docker:down`).

### Run tests in UI mode (interactive)
```bash
npm run test:ui
```

This opens an interactive Playwright UI (all suites) where you can watch tests run and debug them.

### Run tests in debug mode
```bash
npm run test:debug
```

This opens the Playwright inspector for step-by-step debugging.

### Where does a new test go?

- Simple "does the basic thing work" check → `tests/smoke/`.
- Edge cases, error paths, multi-step scenarios, anything that mutates
  shared state → `tests/regression/`. Specs that change state every other
  spec sees (e.g. flipping `selectable` on all songs) must be matched by the
  `global-mutations` project in `playwright.config.ts`, which runs last.

### Shared fixtures (`tests/fixtures/`)

Regression specs import `test` and `expect` from `../fixtures` instead of
`@playwright/test`. Set state up through REST and use the UI only for the
thing under test.

- `api` - `createShow`, `createSong`, `createRace(show, { person1, song1, person2, song2 })`, `setWinner`, `adoptShow(id)` (for a show created through the UI). Names default to unique ones, and everything is deleted again after the test.
- `mqttPublisher` - publishes to the broker on TCP port 3011: `publishBikeStatus`, `publishBikeFinished`, `publishRaceStateChange`, `publishShowStateChange`, or `publish(topic, payload)` for anything else (a string payload is sent as is, e.g. garbage).
- `uniqueName(prefix)` - a name that is unique across tests, workers and re-runs. It contains no hyphens, because the song file sync mangles them.
- `exclusiveRaceState` - **request it in any test that sets a race to `RACING`/`RACED` or reads one back.** The backend keeps only one such race in the whole database and resets every other one to `LISTED`, so two such tests in parallel would undo each other. The fixture holds a lock across workers for the duration of the test.
- `rowByText` and `dismissSuccessSnackBar` - UI helpers shared by the specs.

`tests/regression/fixtures.spec.ts` tests the fixtures themselves.

Specs should not rely on each other: no `describe.serial` chains, each test seeds what it needs.

## Test Files

### `tests/smoke/`

- `health-check.spec.ts` - Verifies the backend's `/api/health` endpoint returns 200 OK, and that the frontend header shows no warning while the backend is healthy
- `main-navigation.spec.ts` - All 6 main navigation entries (Shows, Songs, Views, Users, Statistiken, MQTT Broker) can be navigated to and each page shows its correct title
- `create-show.spec.ts` - Tests creating a new show through the UI
- `backend-rest-api.spec.ts` - Exercises the backend REST API directly (show/song/race create, update, race winner, delete lifecycle), bypassing the frontend
- `mqtt-broker.spec.ts` - Publishes a message directly to the backend's embedded MQTT broker (over plain TCP, port 3011) and verifies it shows up live on the "MQTT Broker" page

### `tests/regression/`

- `show-dashboard.spec.ts` - Exercises the Show Dashboard page end to end: creating a show, adding a race, editing a race's songs and rider names, merging two races waiting for an opponent, reordering races, marking each bike (and both bikes) as the winner, and deleting (canceling) a race. Independent tests, seeded through the `api` fixture
- `fixtures.spec.ts` - Self-test of the shared fixtures (unique names, API seeding, race-state lock, MQTT publisher)
- `songs.spec.ts` - Exercises the Songs page end to end: adding a song directly, syncing songs from local files ("DJ Notebook" upload), finding/merging duplicate songs, and syncing songs from the cloud songlist (the stub, see below)
- `song-selectability.spec.ts` - Syncs songs' selectability against the cloud songlist. This flips the selectable flag on every song, so it runs in a separate `global-mutations` Playwright project after all other regression specs

## Prerequisites

- Docker and Docker Compose must be installed
- Node.js 18+ must be installed locally (for Playwright)

## The e2e Docker Stack

`docker-compose.e2e.yml` (project root) is a stack dedicated to this test
suite — separate from the `docker-compose.yml` used for local development:

- Different container names (`*-e2e`) and network, so it can run alongside
  the dev stack without clashing.
- Different host ports (frontend `4210`, backend `3010`/`3011`, postgres
  `5433`) for the same reason.
- No bind mounts for application code — images are built fresh from the
  committed source, so the suite runs against exactly what's in the repo
  (add `--build` if you've changed code and containers are already up).
  The one exception is the songlist stub's fixture folder, mounted read-only.
- Postgres data lives in `tmpfs`, so every run starts from an empty database.

### The songlist stub

The backend syncs songs from a cloud songlist (`SONGLIST_URL`, default
`https://songlist.ponytyler.de`). In the e2e stack `SONGLIST_URL` points at
`songlist-stub` (`e2e/songlist-stub/`), a dependency-free Node server that
serves the songs in `songs.json` in the same two formats as the real site
(HTML page at `/`, JSON at `/api/index.php`). The tests therefore never
depend on the live site being up or its content staying the same. To test
another cloud scenario, add songs to `songs.json` (status `listed` or
`unlisted`; only listed songs appear on the HTML page).

## How It Works

1. Playwright's `webServer` configuration automatically starts
   `docker-compose.e2e.yml` before running tests
2. The frontend proxies API calls to the backend service internally
3. The backend connects to PostgreSQL and hosts the embedded MQTT broker
4. Tests run against `http://localhost:4210` (the Angular frontend)
5. After tests complete, containers remain running for manual testing (to stop them manually: `npm run docker:down`)

## Troubleshooting

### Tests timeout waiting for services
- Check that the e2e services are healthy: `docker-compose -f ../docker-compose.e2e.yml ps`
- Check backend logs: `docker logs ponytyler-backend-e2e`
- Check frontend logs: `docker logs ponytyler-frontend-e2e`

### Browser not found
```bash
npx playwright install
```

### Tests fail with "cannot connect to localhost:4210"
- Ensure the e2e docker-compose services are running
- Check that ports 4210, 3010, 3011, 5433 are not in use on your local machine
- Wait a bit longer - services may still be starting up

### Check service status
```bash
# From the e2e directory
npm run docker:up      # start (foreground, --build)
docker-compose -f ../docker-compose.e2e.yml ps
docker-compose -f ../docker-compose.e2e.yml logs -f backend
docker-compose -f ../docker-compose.e2e.yml logs -f frontend
```

### Clean up containers
```bash
# From the e2e directory
npm run docker:down   # stops and removes containers + volumes
```
