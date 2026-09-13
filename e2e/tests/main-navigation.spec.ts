import { test, expect } from '@playwright/test';

const NAVIGATION_ENTRIES = [
  { menuLabel: 'Shows', path: '/show', heading: 'Shows' },
  { menuLabel: 'Songs', path: '/song', heading: 'Songs' },
  { menuLabel: 'Views', path: '/views', heading: 'Views' },
  { menuLabel: 'Users', path: '/users', heading: 'Users' },
  { menuLabel: 'Statistiken', path: '/stats', heading: 'Stats' },
];

test('all main navigation entries can be reached and show the correct title', async ({ page }) => {
  await page.goto('/');

  for (const entry of NAVIGATION_ENTRIES) {
    await page.getByRole('button', { name: 'icon-button with menu icon' }).click();
    await page.getByRole('menuitem', { name: entry.menuLabel }).click();

    await expect(page).toHaveURL(new RegExp(`${entry.path}$`));
    await expect(page.getByRole('heading', { name: entry.heading, exact: true })).toBeVisible();
  }
});
