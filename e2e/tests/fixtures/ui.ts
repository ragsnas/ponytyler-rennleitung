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

/**
 * Opens the song sync page and "chooses" files on it. Only the file names
 * matter to the page (it never reads their content), so each file is a few
 * bytes, or empty.
 */
export async function chooseSyncFiles(page: Page, fileNames: string[], options: { empty?: boolean } = {}): Promise<void> {
  await page.goto('/song/sync', { waitUntil: 'networkidle' });
  await page.locator('input[type="file"]').setInputFiles(
    fileNames.map((name) => ({
      name,
      mimeType: 'audio/mpeg',
      buffer: Buffer.from(options.empty ? '' : 'fake-audio-data'),
    })),
  );
}

/** The sync page's list entry for a file ("New Songs/Files") or a selectable song missing from the files. */
export function syncListItem(page: Page, text: string): Locator {
  return page.locator('mat-list-item', { hasText: text });
}
