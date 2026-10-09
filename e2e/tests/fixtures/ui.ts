import { Locator, Page } from '@playwright/test';

/** The table row containing the text, e.g. a song or a race. */
export function rowByText(page: Page, text: string): Locator {
  return page.locator('table tr', { hasText: text });
}

export async function dismissSuccessSnackBar(page: Page): Promise<void> {
  // .last(): a still-closing snackbar from a preceding action can briefly
  // overlap with a freshly opened one, so anchor on the most recent.
  const snackBarAction = page.locator('.mat-mdc-snack-bar-action button, button:has-text("OK")').last();
  await snackBarAction.waitFor({ state: 'visible', timeout: 10000 });
  await snackBarAction.click();
}
