import { expect } from '@playwright/test';
import { test, mockApiConfig } from '../custom-context';
import type { Branding } from '../../../src/lib/models/Configuration';
import brandingJson from '../../../src/lib/assets/configuration.json' with { type: 'json' };
const branding: Branding = JSON.parse(JSON.stringify(brandingJson));

test.describe('Help page', () => {
  branding?.help?.links?.forEach(({ title }) => {
    test(`Has expected link to ${title}`, async ({ page }) => {
      await mockApiConfig(page, {
        features: [{ name: 'OPEN', value: 'true' }],
      });

      await page.goto('/help');

      await expect(page.locator('.main-content').getByText(title, { exact: true })).toBeVisible();
    });
  });
});
