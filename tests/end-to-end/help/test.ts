import { expect } from '@playwright/test';
import { test, mockApiSuccess } from '../custom-context';
import type { Branding } from '../../../src/lib/models/Configuration';
import brandingJson from '../../../src/lib/assets/configuration.json' assert { type: 'json' };
const branding: Branding = JSON.parse(JSON.stringify(brandingJson));

test.describe('Help page', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/unauthenticated.json' });

  branding.help.links.forEach(({ title }) => {
    test(`Has expected link to ${title}`, async ({ page }) => {
      await mockApiSuccess(page, '*/**/api/config', {
        features: [{ name: 'OPEN', value: 'true' }],
        settings: [],
      });
      await page.goto('/help');

      await expect(page.locator('.main-content').getByText(title, { exact: true })).toBeVisible();
    });
  });
});
