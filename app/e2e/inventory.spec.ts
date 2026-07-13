// app/e2e/inventory.spec.ts
import { expect, test } from '@playwright/test';

test('filters the inventory list to aging stock only', async ({ page }) => {
  await page.goto('/inventory');
  await expect(page.getByRole('table')).toBeVisible({ timeout: 10_000 });
  const initialRows = await page.locator('[data-testid="vehicle-row"]').count();

  await page.getByLabel(/Aging stock only/i).click();

  await expect(async () => {
    const agingRows = await page.locator('[data-testid="vehicle-row"]').count();
    expect(agingRows).toBeGreaterThan(0);
    expect(agingRows).toBeLessThan(initialRows);
  }).toPass();
});

test('navigates from the list into a vehicle detail page', async ({ page }) => {
  await page.goto('/inventory');
  await page.getByRole('link', { name: /View \/ Log Action/i }).first().click();
  await expect(page).toHaveURL(/\/inventory\/[A-Z0-9]+/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('logs a new action from the detail page and sees it appear in the history', async ({ page }) => {
  await page.goto('/inventory');
  await page.getByRole('link', { name: /View \/ Log Action/i }).first().click();
  await page.getByRole('button', { name: 'Log Action' }).click();

  // getByLabel('Action') is ambiguous here — verified by running the suite, not assumed:
  // getByLabel does substring, case-insensitive matching by default, and the dialog's own
  // accessible name (from aria-labelledby -> <h2 mat-dialog-title>Log an Action</h2>) contains
  // the substring "Action" too, so it's a strict-mode violation (matches both the
  // mat-dialog-container and the <select>). Passing `{ exact: true }` doesn't fix it either —
  // it times out, because getByLabel derives the label text from raw DOM textContent of the
  // wrapping <label>Action<select>...<option>s...</select></label>, which includes the
  // options' rendered text, not just "Action". The select's true accessible-name (confirmed via
  // page.getByRole('dialog').ariaSnapshot()) is the clean "Action", so anchoring on role +
  // accessible name instead of label text sidesteps the mismatch entirely.
  await page.getByRole('combobox', { name: 'Action', exact: true }).selectOption({
    label: 'Price Reduction Planned',
  });
  await page.getByLabel('Note').fill('Playwright e2e test note');
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page.getByText('Playwright e2e test note')).toBeVisible({ timeout: 10_000 });
});
