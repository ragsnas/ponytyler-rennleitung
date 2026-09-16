# E2E Tests with Playwright

This directory contains end-to-end tests for the PonyTyler Rennleitung application.

## Setup

Install dependencies from the e2e directory:
```bash
cd e2e
npm install
```

## Running Tests

### Run all tests
```bash
npm test
```

This will:
1. Start the dedicated e2e stack via `docker-compose.e2e.yml` (backend, frontend, postgres — the backend also hosts the embedded MQTT broker)
2. Wait for all services to be healthy
3. Run all Playwright tests
4. Generate an HTML report in `playwright-report/`

### Run tests in UI mode (interactive)
```bash
npm run test:ui
```

This opens an interactive Playwright UI where you can watch tests run and debug them.

### Run tests in debug mode
```bash
npm run test:debug
```

This opens the Playwright inspector for step-by-step debugging.

## Test Files

- `tests/create-show.spec.ts` - Tests creating a new show through the UI
- `tests/main-navigation.spec.ts` - Happy path: all 6 main navigation entries (Shows, Songs, Views, Users, Statistiken, MQTT Broker) can be navigated to and each page shows its correct title
- `tests/backend-rest-api.spec.ts` - Exercises the backend REST API directly (show/song/race create, update, race winner, delete lifecycle), bypassing the frontend
- `tests/mqtt-broker.spec.ts` - Publishes a message directly to the backend's embedded MQTT broker (over plain TCP, port 3011) and verifies it shows up live on the "MQTT Broker" page

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
- No bind mounts — images are built fresh from the committed source, so the
  suite runs against exactly what's in the repo (add `--build` if you've
  changed code and containers are already up).
- Postgres data lives in `tmpfs`, so every run starts from an empty database.

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
