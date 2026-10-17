import { expect } from '@playwright/test';
import { test, mockApiSuccess, mockApiConfig } from '../custom-context';
import {
  facetResultPath,
  facetsResponse,
  searchResultPath,
  searchResults as mockData,
  conceptsDetailPath,
  detailResponseCat,
  crossCountSyncResponseInital,
  crossCountSyncResponsePlus3,
  hierarchyResponse,
} from '../mock-data';
import { getOption, nthFilterIcon, clickNthFilterIcon } from '../utils';

test.use({ storageState: 'tests/end-to-end/.auth/unauthenticated.json' });

const discoverFeatures = [
  { name: 'OPEN', value: 'true' },
  { name: 'DISCOVER', value: 'true' },
  { name: 'ENABLE_GENE_QUERY', value: 'true' },
  { name: 'ENABLE_HIERARCHY', value: 'true' },
  { name: 'ENABLE_SNP_QUERY', value: 'true' },
  // Required so useOpenAccess() routes counts through the open-access
  // sync endpoint (picsure/hpds/open/query/sync) instead of query/sync.
  { name: 'OPEN_EXPLORER', value: 'false' },
];

test.describe('Discover for unauthenticated users', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiConfig(page, { features: discoverFeatures });
    await mockApiSuccess(page, searchResultPath, mockData);
    await mockApiSuccess(page, facetResultPath, facetsResponse);
  });

  test('Has filters, and searchbar', async ({ page }) => {
    // Given
    await page.goto('/discover');

    // Then
    await expect(page.locator('#explorer-search-bar')).toBeVisible();
    await expect(page.locator('#explorer-facet-sidebar')).toBeVisible();
  });
  test('Discover can display ±3 ', async ({ page }) => {
    // Given
    await mockApiSuccess(
      page,
      `${conceptsDetailPath}/${detailResponseCat.dataset}`,
      detailResponseCat,
    );
    await mockApiSuccess(page, '*/**/picsure/search/2', crossCountSyncResponseInital);
    await mockApiSuccess(page, '*/**/picsure/hpds/open/query/sync', crossCountSyncResponsePlus3);
    await page.goto('/discover?search=somedata');

    // When
    await clickNthFilterIcon(page);
    const firstItem = await getOption(page);
    await firstItem.click();
    const addFilterButton = page.getByTestId('filter-add');
    await addFilterButton.click();
    const raw = crossCountSyncResponsePlus3['\\_studies_consents\\'];
    const match = raw.match(/^(\d[\d,]*)\s*±(\d+)$/);
    const numeric = parseInt((match?.[1] || '0').replace(/,/g, '')) || 0;
    const plusMinus = match?.[2] || '0';
    // Then
    await expect(page.locator('#results-panel')).toBeVisible();
    await expect(page.locator('#results-count')).toContainText(
      new RegExp(`^${numeric.toLocaleString()}\\s*±\\s*${plusMinus}\\s*$`),
    );
  });
  test('Search results with allowFiltering false are not filterable', async ({ page }) => {
    // Given
    await mockApiSuccess(page, '*/**/picsure/hpds/open/query/sync', '9999');
    await page.goto('/discover?search=somedata');

    // When
    const filterIcon = await nthFilterIcon(page, 6);

    // Then
    await expect(filterIcon).toBeVisible();
    await expect(filterIcon).toBeDisabled();
  });
  test('Search results with allowFiltering true are filterable', async ({ page }) => {
    // Given
    await mockApiSuccess(page, '*/**/picsure/hpds/open/query/sync', '9999');
    await page.goto('/discover?search=somedata');

    // When
    const filterIcon = await nthFilterIcon(page, 5);

    // Then
    await expect(filterIcon).toBeVisible();
    await expect(filterIcon).not.toBeDisabled();
  });
  test("Hierarchy component's radio buttons are not selectable when disableAddFilter is true", async ({
    page,
  }) => {
    // Given: a variable that doesn't allow filtering
    const rowIndex = mockData.content.findIndex((concept) => !concept.allowFiltering);
    await mockApiSuccess(
      page,
      `*/**/picsure/dictionary/concepts/hierarchy/${mockData.content[rowIndex].dataset}`,
      hierarchyResponse,
    );
    await page.goto('/discover?search=somedata');
    const row = page.locator(`#explorer-table-row-${rowIndex}`);
    const hierarchyButton = row.locator('td').last().locator('button').nth(2);
    await hierarchyButton.click();
    // Then
    const radios = page.getByTestId('explorer-hierarchy').getByRole('radio');
    await expect(radios).toHaveCount(hierarchyResponse.length);
    for (let i = 0; i < hierarchyResponse.length; i++) {
      await expect(radios.nth(i)).toBeDisabled();
    }
  });
  test('Results panel hides the variant explorer button even with a genomic filter', async ({
    page,
  }) => {
    // Given
    await mockApiConfig(page, {
      features: [...discoverFeatures, { name: 'VARIANT_EXPLORER', value: 'true' }],
    });
    // Discover can't add a genomic filter and blocks in-app navigation that carries one,
    // but a full load still restores one from sessionStorage.
    await page.addInitScript(() => {
      sessionStorage.setItem(
        'genomicFilters',
        JSON.stringify([
          {
            uuid: 'carried-genomic-filter',
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
    await mockApiSuccess(page, '*/**/picsure/hpds/open/query/sync', {
      '\\_studies_consents\\': '1477888±3',
    });

    await page.goto('/discover');
    await expect(page.locator('body.started')).toBeAttached();

    // When
    await page.locator('#results-panel-toggle').click();

    // Then
    await expect(page.locator('#results-panel')).toContainText('Genomic Filter');
    await expect(page.getByTestId('results-variant-explorer-open')).toHaveCount(0);
  });
});

test.describe('OPEN_TOUR_NAME', () => {
  const tourFeatures = [
    { name: 'OPEN', value: 'true' },
    { name: 'DISCOVER', value: 'true' },
    { name: 'OPEN_EXPLORER', value: 'false' },
  ];

  test.beforeEach(async ({ page }) => {
    await mockApiSuccess(page, searchResultPath, mockData);
    await mockApiSuccess(page, facetResultPath, facetsResponse);
  });

  test('A recognized OPEN_TOUR_NAME override swaps in that tour', async ({ page }) => {
    // Given
    await mockApiConfig(page, {
      features: tourFeatures,
      settings: [{ name: 'OPEN_TOUR_NAME', value: 'Aim-Ahead' }],
    });
    await page.goto('/discover');

    await page.getByTestId('explorer-tour-start').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Then
    await expect(page.getByTestId('ui-modal-header')).toContainText('Welcome to PIC-SURE');
  });
});
