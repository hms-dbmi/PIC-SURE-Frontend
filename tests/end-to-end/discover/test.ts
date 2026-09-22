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
  crossCountSyncResponseLessThan10,
  hierarchyResponse,
} from '../mock-data';
import {
  addFilterButton,
  getOption,
  mockConceptDetailFromRows,
  openNthResult,
  openNthResultFilter,
  searchResultCards as resultCards,
} from '../utils';

// The row indices the allowFiltering specs below depend on, checked rather than trusted: the
// specs mean nothing if the fixture changes under them.
const FILTERABLE_ROW = 5;
const UNFILTERABLE_ROW = 6;

test.use({ storageState: 'tests/end-to-end/.auth/unauthenticated.json' });

test.describe('Discover for unauthenticated users', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiConfig(page, {
      features: [
        { name: 'OPEN', value: 'true' },
        { name: 'DISCOVER', value: 'true' },
        { name: 'ENABLE_GENE_QUERY', value: 'true' },
        { name: 'ENABLE_HIERARCHY', value: 'true' },
        { name: 'ENABLE_SNP_QUERY', value: 'true' },
        // Required so useOpenAccess() routes counts through the open-access
        // sync endpoint (picsure/hpds/open/v3/query/sync) instead of v3/query/sync.
        { name: 'OPEN_EXPLORER', value: 'false' },
      ],
    });
    await mockApiSuccess(page, searchResultPath, mockData);
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockConceptDetailFromRows(page);
  });

  test('Has filters, and searchbar', async ({ page }) => {
    // Given
    await page.goto('/discover');

    // Then
    await expect(page.locator('#search-bar')).toBeVisible();
    await expect(page.locator('#facet-side-bar')).toBeVisible();
  });
  test('Discover can display ±3 ', async ({ page }) => {
    // Given
    await mockApiSuccess(
      page,
      `${conceptsDetailPath}/${detailResponseCat.dataset}`,
      detailResponseCat,
    );
    await mockApiSuccess(page, '*/**/picsure/search/2', crossCountSyncResponseInital);
    await mockApiSuccess(page, '*/**/picsure/hpds/open/v3/query/sync', crossCountSyncResponsePlus3);
    await page.goto('/discover?search=somedata');

    // When
    await openNthResultFilter(page);
    const firstItem = await getOption(page);
    await firstItem.click();
    await addFilterButton(page).click();
    const raw = crossCountSyncResponsePlus3['\\_studies_consents\\'];
    const match = raw.match(/^(\d[\d,]*)\s*±(\d+)$/);
    const numeric = parseInt((match?.[1] || '0').replace(/,/g, '')) || 0;
    const plusMinus = match?.[2] || '0';
    // Then
    await expect(page.locator('#results-panel')).toBeVisible();
    await expect(page.locator('#result-count')).toContainText(
      new RegExp(`^${numeric.toLocaleString()}\\s*±\\s*${plusMinus}\\s*$`),
    );
  });
  test('Discover displays large number with ± and no space', async ({ page }) => {
    // Given
    await mockApiSuccess(
      page,
      `${conceptsDetailPath}/${detailResponseCat.dataset}`,
      detailResponseCat,
    );
    await mockApiSuccess(page, '*/**/picsure/search/2', crossCountSyncResponseInital);
    const bigNumberSync = { '\\_studies_consents\\': '1477888±3' };
    await mockApiSuccess(page, '*/**/picsure/hpds/open/v3/query/sync', bigNumberSync);
    await page.goto('/discover?search=somedata');

    // When
    await openNthResultFilter(page);
    const firstItem = await getOption(page);
    await firstItem.click();
    await addFilterButton(page).click();

    // Then
    await expect(page.locator('#results-panel')).toBeVisible();
    await expect(page.locator('#result-count')).toContainText(
      new RegExp('^1,477,888\\s*±\\s*3\\s*$'),
    );
  });
  test('Discover can display < 10', async ({ page }) => {
    // Given
    await mockApiSuccess(
      page,
      `${conceptsDetailPath}/${detailResponseCat.dataset}`,
      detailResponseCat,
    );
    await mockApiSuccess(page, '*/**/picsure/search/2', crossCountSyncResponseInital);
    await mockApiSuccess(
      page,
      '*/**/picsure/hpds/open/v3/query/sync',
      crossCountSyncResponseLessThan10,
    );
    await page.goto('/discover?search=somedata');

    // When
    await openNthResultFilter(page);
    const firstItem = await getOption(page);
    await firstItem.click();
    await addFilterButton(page).click();

    // Then
    await expect(page.locator('#results-panel')).toBeVisible();
    await expect(page.locator('#result-count')).toHaveText('< 10');
  });
  /*
   * The filter affordance moved to the variable's own page, so without something on the card
   * a user only learns which Discover results they may filter by opening each one. One
   * assertion per case: bundled with the enabled card's, the disabled card's marking hides
   * behind whichever expectation runs first.
   */
  test("A card for an unfilterable variable says so, in the detail page's words", async ({
    page,
  }) => {
    // Given
    expect(mockData.content[UNFILTERABLE_ROW].allowFiltering).toBe(false);
    await page.goto('/discover?search=somedata');

    // Then
    await expect(
      resultCards(page)
        .nth(UNFILTERABLE_ROW)
        .getByTestId('search-result-card-filtering-unavailable'),
    ).toContainText('Filtering is not available for this variable');
  });

  test('That card carries a marker the tour and this suite can target', async ({ page }) => {
    // Given
    await page.goto('/discover?search=somedata');

    // Then
    await expect(resultCards(page).nth(UNFILTERABLE_ROW)).toHaveAttribute(
      'data-filterable',
      'false',
    );
  });

  test('A filterable card carries the other value, so the two are told apart', async ({ page }) => {
    // Given
    expect(mockData.content[FILTERABLE_ROW].allowFiltering).toBe(true);
    await page.goto('/discover?search=somedata');

    // Then - separately from the message, which is what the disabled card is checked on
    await expect(resultCards(page).nth(FILTERABLE_ROW)).toHaveAttribute('data-filterable', 'true');
  });

  test('A filterable card offers no such explanation', async ({ page }) => {
    // Given
    await page.goto('/discover?search=somedata');

    // Then
    await expect(
      resultCards(page).nth(FILTERABLE_ROW).getByTestId('search-result-card-filtering-unavailable'),
    ).toHaveCount(0);
  });

  test('Only the variables the dictionary refuses are marked', async ({ page }) => {
    // Given
    const refused = mockData.content.filter((row) => row.allowFiltering === false).length;
    expect(refused).toBe(1);
    await page.goto('/discover?search=somedata');
    await expect(resultCards(page)).toHaveCount(mockData.content.length);

    // Then - marked on the one row, not on every row of an open-access section
    await expect(
      page.locator('[data-testid="search-result-card"][data-filterable="false"]'),
    ).toHaveCount(refused);
    await expect(page.getByTestId('search-result-card-filtering-unavailable')).toHaveCount(refused);
  });

  test('Search results with allowFiltering false are not filterable', async ({ page }) => {
    // Given
    expect(mockData.content[UNFILTERABLE_ROW].allowFiltering).toBe(false);
    await mockApiSuccess(page, '*/**/picsure/hpds/open/v3/query/sync', '9999');
    await page.goto('/discover?search=somedata');

    // When - the filter lives on the variable's own page now, so that is where the refusal is
    await openNthResult(page, UNFILTERABLE_ROW);

    // Then
    await expect(page.getByTestId('variable-detail-filter-disabled')).toContainText(
      'Filtering is not available for this variable',
    );
    await expect(page.getByTestId('variable-filter-panel')).toHaveCount(0);
  });
  test('Search results with allowFiltering true are filterable', async ({ page }) => {
    // Given
    expect(mockData.content[FILTERABLE_ROW].allowFiltering).toBe(true);
    await mockApiSuccess(page, '*/**/picsure/hpds/open/v3/query/sync', '9999');
    await page.goto('/discover?search=somedata');

    // When
    await openNthResult(page, FILTERABLE_ROW);

    // Then
    await expect(page.getByTestId('variable-filter-panel')).toBeVisible();
    await expect(page.getByTestId('variable-detail-filter-disabled')).toHaveCount(0);
  });
  test("Hierarchy component's radio buttons are not selectable when disableAddFilter is true", async ({
    page,
  }) => {
    // Given
    await mockApiSuccess(
      page,
      `*/**/picsure/dictionary/concepts/hierarchy/${mockData.content[UNFILTERABLE_ROW].dataset}`,
      hierarchyResponse,
    );
    await page.goto('/discover?search=somedata');

    // When
    await openNthResult(page, UNFILTERABLE_ROW);

    // Then
    const hierarchyComponent = page.getByTestId('hierarchy-component');
    await expect(hierarchyComponent).toBeVisible();
    const radioButtons = hierarchyComponent.locator('input');
    // Pinned first: with no tree loaded the loop below has nothing to check and would pass
    // for the wrong reason.
    await expect(radioButtons).toHaveCount(hierarchyResponse.length);
    for (const radio of await radioButtons.all()) {
      await expect(radio).toBeDisabled();
    }
  });
  test('Cohort details button and variant explorer button are not visible', async ({ page }) => {
    // Given
    await mockApiSuccess(
      page,
      `${conceptsDetailPath}/${detailResponseCat.dataset}`,
      detailResponseCat,
    );
    await mockApiSuccess(page, '*/**/picsure/search/2', crossCountSyncResponseInital);
    const bigNumberSync = { '\\_studies_consents\\': '1477888±3' };
    await mockApiSuccess(page, '*/**/picsure/hpds/open/v3/query/sync', bigNumberSync);
    await page.goto('/discover?search=somedata');

    // When
    await openNthResultFilter(page);
    const firstItem = await getOption(page);
    await firstItem.click();
    await addFilterButton(page).click();
    const cohortDetailsButton = page.getByTestId('cohort-details-btn');

    // Then
    await expect(page.locator('#results-panel')).toBeVisible();
    await expect(cohortDetailsButton).not.toBeVisible();
    await expect(page.locator('#variant-explorer-btn')).not.toBeVisible();
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

  test('Without an override, the default BDC-Open tour is used', async ({ page }) => {
    // Given
    await mockApiConfig(page, { features: tourFeatures });
    await page.goto('/discover');

    // When
    await expect(async () => {
      await page.getByTestId('explorer-tour-btn').click();
      await expect(page.locator('#modal-component')).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 15000 });

    // Then
    await expect(page.getByTestId('modal-wrapper-header')).toContainText(
      'Welcome to BioData Catalyst Powered by PIC-SURE',
    );
  });

  test('A recognized OPEN_TOUR_NAME override swaps in that tour', async ({ page }) => {
    // Given
    await mockApiConfig(page, {
      features: tourFeatures,
      settings: [{ name: 'OPEN_TOUR_NAME', value: 'Aim-Ahead' }],
    });
    await page.goto('/discover');

    // When
    await expect(async () => {
      await page.getByTestId('explorer-tour-btn').click();
      await expect(page.locator('#modal-component')).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 15000 });

    // Then
    await expect(page.getByTestId('modal-wrapper-header')).toContainText('Welcome to PIC-SURE');
  });

  test('An unrecognized OPEN_TOUR_NAME override falls back to the default BDC-Open tour', async ({
    page,
  }) => {
    // Given
    await mockApiConfig(page, {
      features: tourFeatures,
      settings: [{ name: 'OPEN_TOUR_NAME', value: 'not-a-real-tour' }],
    });
    await page.goto('/discover');

    // When
    await expect(async () => {
      await page.getByTestId('explorer-tour-btn').click();
      await expect(page.locator('#modal-component')).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 15000 });

    // Then
    await expect(page.getByTestId('modal-wrapper-header')).toContainText(
      'Welcome to BioData Catalyst Powered by PIC-SURE',
    );
  });
});
