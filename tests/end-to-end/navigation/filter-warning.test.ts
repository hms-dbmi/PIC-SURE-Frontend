import { expect, type Page } from '@playwright/test';

import { test, mockApiConfig, mockApiSuccess } from '../custom-context';
import {
  countResultPath,
  deniedFilterTree,
  facetResultPath,
  facetsResponse,
  searchResultPath,
  searchResults,
} from '../mock-data';

async function seedDeniedFilter(page: Page) {
  await page.addInitScript((tree) => {
    sessionStorage.setItem('filterTree', JSON.stringify(tree));
  }, deniedFilterTree);
}

async function seedGenomicFilter(page: Page) {
  await page.addInitScript(() => {
    sessionStorage.setItem(
      'genomicFilters',
      JSON.stringify([
        {
          uuid: 'standalone-genomic-filter',
          id: 'genomic',
          filterType: 'genomic',
          displayType: 'any',
          variableName: 'Genomic Filter',
          description: 'Gene with variant: BRCA1',
          allowFiltering: true,
          dataset: '',
          Gene_with_variant: ['BRCA1'],
        },
      ]),
    );
  });
}

test.describe('Filter warning navigation', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });

  test.beforeEach(async ({ page }) => {
    await mockApiConfig(page, {
      features: [{ name: 'DISCOVER', value: 'true' }],
    });
    await mockApiSuccess(page, searchResultPath, searchResults);
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, '*/**/picsure/hpds/open/query/sync', {
      '\\_studies_consents\\': 100,
    });
  });

  test('warns before moving from Discover to Explore with an unconsented filter', async ({
    page,
  }) => {
    await seedDeniedFilter(page);

    await page.goto('/discover');
    await page.locator('#nav-link-explorer').click();

    await expect(page).toHaveURL(/\/discover$/);
    const warning = page.getByTestId('sendfilter-warning');
    await expect(warning).toBeVisible();
    await expect(warning).toContainText(
      'You are not authorized to access the data in Explore based on your selected filters.',
    );
  });

  test('warns after leaving Discover before moving to Explore with an unconsented filter', async ({
    page,
  }) => {
    await seedDeniedFilter(page);

    await page.goto('/discover');
    await page.locator('#nav-link-api').click();
    await expect(page).toHaveURL(/\/api$/);

    await page.locator('#nav-link-explorer').click();

    await expect(page).toHaveURL(/\/api$/);
    await expect(page.getByTestId('sendfilter-warning')).toBeVisible();
  });

  test('returns to Explore with a genomic filter without warning', async ({ page }) => {
    await seedGenomicFilter(page);
    await mockApiSuccess(page, countResultPath, 565);

    await page.goto('/api');
    await page.locator('#nav-link-explorer').click();

    await expect(page).toHaveURL(/\/explorer$/);
    await expect(page.getByTestId('sendfilter-warning')).toBeHidden();
  });

  [
    { seed: seedDeniedFilter, from: '/discover', to: 'explorer', back: 'Back to Discover' },
    { seed: seedGenomicFilter, from: '/explorer', to: 'discover', back: 'Back to Explore' },
  ].forEach(({ seed, from, to, back }) => {
    test(`does not leave the ${to} link highlighted after choosing ${back}`, async ({
      page,
      browserName,
    }) => {
      await seed(page);

      await page.goto(from);
      const link = page.locator(`#nav-link-${to}`);
      const unselectedBackground = await link.evaluate(
        (el) => getComputedStyle(el).backgroundColor,
      );
      await link.click();
      await page.getByRole('button', { name: back }).click();

      await expect(page.getByTestId('sendfilter-warning')).toBeHidden();
      // WebKit doesn't focus links on click, so the dialog has no link to return focus to.
      if (browserName !== 'webkit') await expect(link).toBeFocused();
      await page.mouse.move(0, 0);
      await expect(link).toHaveCSS('background-color', unselectedBackground);
    });
  });
});
