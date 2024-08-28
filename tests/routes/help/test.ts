import { expect, test } from '@playwright/test';
import { branding } from '../../../src/lib/configuration';

test.describe('Help page', () => {
  branding?.help?.links?.forEach(({ title }) => {
    test(`Has expected link to ${title}`, async ({ page }) => {
      await page.goto('/help');

      await expect(page.locator('.main-content').getByText(title, { exact: true })).toBeVisible();
    });
  });
});
