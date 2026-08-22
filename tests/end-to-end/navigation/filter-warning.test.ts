import { expect } from '@playwright/test';

import { test, mockApiConfig, mockApiSuccess } from '../custom-context';
import { facetResultPath, facetsResponse, searchResultPath, searchResults } from '../mock-data';

test.describe('Filter warning navigation', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });

  test.beforeEach(async ({ page }) => {
    await mockApiConfig(page, {
      features: [{ name: 'DISCOVER', value: 'true' }],
    });
    await mockApiSuccess(page, searchResultPath, searchResults);
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, '*/**/picsure/hpds/open/v3/query/sync', {
      '\\_studies_consents\\': 100,
    });
  });

  test('warns before moving from Discover to Explore with an unconsented filter', async ({
    page,
  }) => {
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

    await page.goto('/discover');
    await page.locator('#nav-link-explorer').click();

    await expect(page).toHaveURL(/\/discover$/);
    const warning = page.getByTestId('sendfilter-warning');
    await expect(warning).toBeVisible();
    await expect(warning).toContainText(
      'You are not authorized to access the data in Explore based on your selected filters.',
    );
  });

  test('warns for a standalone genomic filter without consent', async ({ page }) => {
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

    await page.goto('/discover');
    await page.locator('#nav-link-explorer').click();

    await expect(page).toHaveURL(/\/discover$/);
    await expect(page.getByTestId('sendfilter-warning')).toBeVisible();
  });
});
