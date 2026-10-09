import { defineConfig, devices, PlaywrightTestConfig } from '@playwright/test';
import path from 'path';

/**
 * Two suites share one docker stack (see e2e/README.md):
 *
 *  - smoke:      tests/smoke      - happy path, quick check of basic functionality
 *  - regression: tests/regression - hardened scenarios, run before a production release
 *
 * E2E_SUITE picks what runs (set by the npm scripts); without it only the
 * smoke suite runs, so a bare `npx playwright test` stays the quick check.
 * "all" runs smoke first, then regression.
 *
 * The suite is chosen via an env var rather than `--project` because
 * Playwright always pulls in a project's `dependencies`: the regression run
 * must not drag smoke along, but the combined run must order them.
 */
const SUITES = ['smoke', 'regression', 'all'] as const;
type Suite = (typeof SUITES)[number];

const suite = (process.env.E2E_SUITE ?? 'smoke') as Suite;
if (!SUITES.includes(suite)) {
  throw new Error(`E2E_SUITE must be one of ${SUITES.join(', ')} (got "${suite}")`);
}

const runSmoke = suite === 'smoke' || suite === 'all';
const runRegression = suite === 'regression' || suite === 'all';

const projects: PlaywrightTestConfig['projects'] = [];

if (runSmoke) {
  projects.push({
    name: 'smoke',
    testDir: './tests/smoke',
    use: { ...devices['Desktop Chrome'] },
  });
}

if (runRegression) {
  projects.push(
    {
      name: 'regression',
      testDir: './tests/regression',
      testIgnore: /\.global\.spec\.ts$/,
      dependencies: runSmoke ? ['smoke'] : [],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      // Specs named *.global.spec.ts mutate state shared with every other spec
      // (e.g. flipping the selectable flag on all songs, replacing the stub's
      // cloud songlist) and run only after everything else.
      name: 'global-mutations',
      testDir: './tests/regression',
      testMatch: /\.global\.spec\.ts$/,
      dependencies: ['regression'],
      use: { ...devices['Desktop Chrome'] },
    },
  );
}

export default defineConfig({
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 60000, // 60 second per-test timeout
  use: {
    baseURL: 'http://localhost:4210',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects,

  webServer: {
    command: `cd ${path.join(__dirname, '..')} && docker-compose -f docker-compose.e2e.yml up --build --abort-on-container-exit`,
    url: 'http://localhost:4210',
    reuseExistingServer: !process.env.CI,
    timeout: 180 * 1000, // 3 minutes for services to start
  },
});
