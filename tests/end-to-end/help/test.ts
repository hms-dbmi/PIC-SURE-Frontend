import { expect } from '@playwright/test';
import { test, mockApiConfig } from '../custom-context';
import type { Branding } from '../../../src/lib/models/Configuration';
import brandingJson from '../../../src/lib/assets/configuration.json' with { type: 'json' };
const branding: Branding = JSON.parse(JSON.stringify(brandingJson));

test.describe('Help page', () => {
  test('Has a link for each configured help link', async ({ page }) => {
    await mockApiConfig(page, {
      features: [{ name: 'OPEN', value: 'true' }],
    });

    await page.goto('/help');

    const links = branding?.help?.links ?? [];
    expect(links.length).toBeGreaterThan(0);
    for (const { title } of links) {
      await expect(page.locator('.main-content').getByText(title, { exact: true })).toBeVisible();
    }
  });
});
