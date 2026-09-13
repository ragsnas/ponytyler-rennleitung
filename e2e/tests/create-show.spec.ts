import { test, expect } from '@playwright/test';

test.setTimeout(120000); // Increase timeout for slow docker startup

test('can create a new show', async ({ page }) => {
  // Navigate to the shows page
  await page.goto('/', { waitUntil: 'networkidle' });

  // Wait for page to settle
  await page.waitForTimeout(1500);

  // Click the "Add Show" button
  const addButton = page.locator('button:has-text("Add Show")');
  await addButton.waitFor({ state: 'visible', timeout: 10000 });
  await addButton.click();

  // Wait for the create show form to appear
  await page.waitForSelector('input[formControlName="name"]', { timeout: 10000 });

  // Generate a unique show name with timestamp
  const showName = `Test Show ${Date.now()}`;

  // Fill in the show name (required field)
  const nameInput = page.locator('input[formControlName="name"]');
  await nameInput.fill(showName);

  // Click the save button
  const saveButton = page.locator('button:has-text("Speichern")');
  await saveButton.waitFor({ state: 'visible', timeout: 10000 });
  await expect(saveButton).toBeEnabled();
  await saveButton.click();

  // A success snackbar appears; dismiss it via its "OK" action to trigger navigation
  const snackBarAction = page.locator('.mat-mdc-snack-bar-action button, button:has-text("OK")');
  await snackBarAction.waitFor({ state: 'visible', timeout: 10000 });
  await snackBarAction.click();

  // The app navigates to the newly created show's detail page
  await page.waitForURL(/\/show\/\d+$/, { timeout: 15000 });

  // Verify the show's name is displayed on its detail page
  await expect(page.getByText(showName)).toBeVisible({ timeout: 10000 });
});
