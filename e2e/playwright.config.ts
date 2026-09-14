import { defineConfig, devices } from '@playwright/test';
import path from 'path';

export default defineConfig({
  testDir: './tests',
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

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: `cd ${path.join(__dirname, '..')} && docker-compose -f docker-compose.e2e.yml up --build --abort-on-container-exit`,
    url: 'http://localhost:4210',
    reuseExistingServer: !process.env.CI,
    timeout: 180 * 1000, // 3 minutes for services to start
  },
});
