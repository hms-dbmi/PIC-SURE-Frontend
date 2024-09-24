import { expect, test } from '@playwright/test';
import type { Branding } from '../../../src/lib/configuration';
import * as config from '../../../src/lib/assets/configuration.json' assert { type: 'json' };
//TypeScript is confused by the JSON import so I am fxing it here
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
const branding: Branding = JSON.parse(JSON.stringify((config as any).default));

test.describe('Help page', () => {
  branding?.help?.links?.forEach(({ title }) => {
    test(`Has expected link to ${title}`, async ({ page }) => {
      await page.goto('/help');

      await expect(page.locator('.main-content').getByText(title, { exact: true })).toBeVisible();
    });
  });
});
