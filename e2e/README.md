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
1. Start all services via docker-compose (backend, frontend, postgres — the backend also hosts the embedded MQTT broker)
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
- `tests/main-navigation.spec.ts` - Happy path: all 5 main navigation entries (Shows, Songs, Views, Users, Statistiken) can be navigated to and each page shows its correct title

## Prerequisites

- Docker and Docker Compose must be installed
- Node.js 18+ must be installed locally (for Playwright)

## How It Works

1. Playwright's `webServer` configuration automatically starts docker-compose before running tests
2. The frontend connects to the backend API on `http://localhost:3000`
3. The backend connects to PostgreSQL and hosts the embedded MQTT broker on port 3001
4. Tests run against `http://localhost:4200` (the Angular frontend)
5. After tests complete, containers remain running for manual testing (to stop them manually: `docker-compose down`)

## Troubleshooting

### Tests timeout waiting for services
- Check that docker-compose services are healthy: `docker-compose ps`
- Check backend logs: `docker logs ponytyler-backend-dev`
- Check frontend logs: `docker logs ponytyler-frontend-dev`

### Browser not found
```bash
npx playwright install
```

### Tests fail with "cannot connect to localhost:4200"
- Ensure docker-compose services are running
- Check that ports 4200, 3000, 5432, 3001 are not in use on your local machine
- Wait a bit longer - services may still be starting up

### Check service status
```bash
# From the project root
docker-compose ps
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Clean up containers
```bash
# From the project root
docker-compose down -v  # -v removes volumes too
```
