import { expect, type Page } from '@playwright/test';

import { test, mockApiConfig, mockApiSuccess } from '../custom-context';
import {
  facetResultPath,
  facetsResponse,
  searchResultPath,
  searchResults,
} from '../../support/mock-data';

async function seedDeniedFilter(page: Page) {
  await page.addInitScript(() => {
    sessionStorage.setItem(
      'filterTree',
      JSON.stringify({
        uuid: 'root',
        operator: 'AND',
        children: [
          {
            uuid: 'denied-filter',
            id: '\\denied-study\\variable\\',
            filterType: 'Categorical',
            displayType: 'restrict',
            variableName: 'Denied variable',
            allowFiltering: true,
            dataset: 'denied-study',
            categoryValues: ['Yes'],
          },
        ],
      }),
    );
  });
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
    // The app may refresh the signed-in user; answer with nothing new so it keeps the stored one
    await mockApiSuccess(page, '*/**/psama/user/me?hasToken', {});
  });

  test('warns before moving from Discover to Explore with an unconsented filter', async ({
    page,
  }) => {
    await seedDeniedFilter(page);

    await page.goto('/discover');
    await page.locator('#app-nav-link-explorer').click();

    await expect(page).toHaveURL(/\/discover$/);
    const warning = page.getByTestId('explorer-filter-warning');
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
    await page.locator('#app-nav-link-api').click();
    await expect(page).toHaveURL(/\/api$/);

    await page.locator('#app-nav-link-explorer').click();

    await expect(page).toHaveURL(/\/api$/);
    await expect(page.getByTestId('explorer-filter-warning')).toBeVisible();
  });

  test('warns for a standalone genomic filter without consent', async ({ page }) => {
    await seedGenomicFilter(page);

    await page.goto('/discover');
    await page.locator('#app-nav-link-explorer').click();

    await expect(page).toHaveURL(/\/discover$/);
    await expect(page.getByTestId('explorer-filter-warning')).toBeVisible();
  });

  test('warns before moving from Explore to Discover with a SNP filter', async ({ page }) => {
    await mockApiSuccess(page, '*/**/picsure/hpds/query/sync', 100);
    await page.addInitScript(() => {
      sessionStorage.setItem(
        'genomicFilters',
        JSON.stringify([
          {
            uuid: 'snp-filter',
            id: 'snp-variant',
            filterType: 'snp',
            displayType: 'any',
            snpValues: [{ search: 'chr1,12345,A,G', constraint: '0/1' }],
            variableName: 'Variant Filter',
            description: 'chr1,12345,A,G: Heterozygous',
            allowFiltering: true,
            dataset: '',
          },
        ]),
      );
    });

    await page.goto('/explorer');
    await page.locator('#app-nav-link-discover').click();

    await expect(page).toHaveURL(/\/explorer$/);
    const warning = page.getByTestId('explorer-filter-warning');
    await expect(warning).toBeVisible();

    await page.getByRole('button', { name: 'Remove Invalid Filters' }).click();

    await expect(page).toHaveURL(/\/discover$/);
    await expect(warning).toBeHidden();
    expect(await page.evaluate(() => sessionStorage.getItem('genomicFilters'))).toBe('[]');
  });

  [
    { seed: seedDeniedFilter, from: '/discover', to: 'explorer', back: 'Back to Discover' },
    { seed: seedGenomicFilter, from: '/explorer', to: 'discover', back: 'Back to Explore' },
  ].forEach(({ seed, from, to, back }) => {
    test(`does not leave the ${to} link highlighted after choosing ${back}`, async ({ page }) => {
      await seed(page);

      await page.goto(from);
      const link = page.locator(`#app-nav-link-${to}`);
      const unselectedBackground = await link.evaluate(
        (el) => getComputedStyle(el).backgroundColor,
      );
      await link.click();
      await page.getByRole('button', { name: back }).click();

      await expect(page.getByTestId('explorer-filter-warning')).toBeHidden();
      // The dialog hands focus back to the link, but SvelteKit blurs it again when Back navigates.
      // Focus it from script as the dialog does, after the mouse click on Back.
      await link.focus();
      await page.mouse.move(0, 0);
      await expect(link).toHaveCSS('background-color', unselectedBackground);
    });
  });
});
