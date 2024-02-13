import { expect, test } from '@playwright/test';
import { branding } from '../../../src/lib/configuration';

test.describe('Help page', () => {
  branding.help.links.forEach((link) => {
    test(`Has expected link to ${link.title}`, async ({ page }) => {
      await page.goto('/help');
      await expect(page.getByTestId('link:' + link.title)).toBeVisible();
    });
  });
});
