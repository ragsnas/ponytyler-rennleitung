import { test, expect } from '@playwright/test';

/**
 * Exercises the backend's health check endpoint directly, and confirms the
 * Angular frontend's header shows no "backend unreachable" warning while
 * the backend is healthy (see ../../docker-compose.e2e.yml for ports).
 */

const BACKEND_URL = 'http://localhost:3010';

test('the backend health check returns 200 OK', async ({ request }) => {
  const response = await request.get(`${BACKEND_URL}/api/health`);
  expect(response.status()).toBe(200);
});

test('the frontend header shows no warning while the backend is healthy', async ({ page }) => {
  await page.goto('/');

  // The health check polls every minute and starts immediately on load, so
  // by the time the page has settled the first check has already resolved.
  await expect(page.locator('.backend-health-warning')).toHaveCount(0);
});
