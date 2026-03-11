import { expect, type Route, type BrowserContext, type Page } from '@playwright/test';
import { test, mockApiSuccess, mockApiFail } from '../custom-context';
import {
  datasets as mockData,
  datasetDetails,
  facetResultPath,
  facetsResponse,
  conceptTreePath,
} from '../mock-data';

test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });

function mockDictionaryAPI(
  context: BrowserContext | Page,
  route: string,
  data: Record<string, unknown>,
) {
  return context.route(route, (route: Route) => {
    const buffer = route.request().postDataBuffer();
    if (buffer === null) {
      return route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'request has undefined post body' }),
      });
    }

    const result = data[buffer.toString('utf-8')];
    return route.fulfill(
      result
        ? { status: 200, contentType: 'application/json', body: JSON.stringify(result) }
        : {
            status: 404,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'request has undefined post body' }),
          },
    );
  });
}

test.beforeEach(async ({ page }) => {
  mockDictionaryAPI(
    page,
    '*/**/picsure/proxy/dictionary-api/concepts/detail/*',
    datasetDetails.concepts,
  );
  mockDictionaryAPI(page, `${conceptTreePath}/*`, datasetDetails.tree);
  await mockApiSuccess(page, facetResultPath, facetsResponse);
  await mockApiSuccess(page, '*/**/picsure/v3/query/sync', '9999');
});

test.describe('dataset', () => {
  test('Shows active datasets table', async ({ page }) => {
    // Given
    await mockApiSuccess(page, '*/**/picsure/dataset/named', mockData);
    await page.goto('/dataset');

    // Then
    await expect(page.getByTestId('ActiveDatasets-table')).toBeVisible();
    await expect(page.getByText(mockData[0].query.uuid, { exact: true })).toBeVisible();
  });
  test('Should not show archived datasets table on page load', async ({ page }) => {
    // Given
    await mockApiSuccess(page, '*/**/picsure/dataset/named', mockData);
    await page.goto('/dataset');

    // Then
    await expect(page.getByTestId('ArchivedDatasets-table')).not.toBeVisible();
    await expect(page.getByText(mockData[1].query.uuid, { exact: true })).not.toBeVisible();
  });
  test('Shows archived datasets on archive toggle button press', async ({ page }) => {
    // Given
    await mockApiSuccess(page, '*/**/picsure/dataset/named', mockData);
    await page.goto('/dataset');

    // When
    const toggleButton = page.getByTestId('dataset-toggle-archive');
    await toggleButton.click();

    // Then
    await expect(page.getByTestId('dataset-toggle-archive')).toBeVisible();
    await expect(page.getByText(mockData[1].query.uuid, { exact: true })).toBeVisible();
  });
  test('Copy button displays popup msg', async ({ page }) => {
    // Given
    await mockApiSuccess(page, '*/**/picsure/dataset/named', mockData);
    await page.goto('/dataset');

    // When
    const copyBtn = page.getByTestId(`${mockData[0].query.uuid}-copy-btn`);
    await copyBtn.click();

    // Then
    await expect(page.getByTestId(`${mockData[0].query.uuid}-copy`)).toBeVisible();
  });
  test('Archive button press moves item to archived', async ({ page }) => {
    // Given
    await mockApiSuccess(page, '*/**/picsure/dataset/named', mockData);
    await mockApiSuccess(page, `*/**/picsure/dataset/named/${mockData[0].uuid}`, {
      ...mockData[0],
      archived: true,
    });
    await page.goto('/dataset');

    // When
    const archiveButton = page.getByTestId(`dataset-action-archive-${mockData[0].uuid}`);
    await archiveButton.click();

    const toggleButton = page.getByTestId('dataset-toggle-archive');
    await toggleButton.click();

    // Then
    await expect(page.getByText(mockData[0].query.uuid, { exact: true })).toBeVisible();
  });
  test('Restore button press moves item to active', async ({ page }) => {
    // Given
    await mockApiSuccess(page, '*/**/picsure/dataset/named', mockData);
    await mockApiSuccess(page, `*/**/picsure/dataset/named/${mockData[1].uuid}`, {
      ...mockData[1],
      archived: false,
    });
    await page.goto('/dataset');
    const toggleButton = page.getByTestId('dataset-toggle-archive');
    await toggleButton.click();

    // When
    const restoreButton = page.getByTestId(`dataset-action-restore-${mockData[1].uuid}`);
    await restoreButton.click();
    await toggleButton.click();

    // Then
    await expect(page.getByText(mockData[1].query.uuid, { exact: true })).toBeVisible();
  });
  test('Error message on api error', async ({ page }) => {
    // Given
    await mockApiFail(page, '*/**/picsure/dataset/named', 'accessdenied');
    await page.goto('/dataset');

    // Then
    await expect(page.getByTestId('error-alert')).toBeVisible();
  });
  test('Active table shows dataset name', async ({ page }) => {
    // Given
    await mockApiSuccess(page, '*/**/picsure/dataset/named', mockData);
    await page.goto('/dataset');

    // Then
    await expect(page.getByText(mockData[0].name, { exact: true })).toBeVisible();
  });
  test('Toggle button shows "Show deleted datasets" on page load', async ({ page }) => {
    // Given
    await mockApiSuccess(page, '*/**/picsure/dataset/named', mockData);
    await page.goto('/dataset');

    // Then
    await expect(page.getByTestId('dataset-toggle-archive')).toHaveText('Show deleted datasets');
  });
  test('Toggle button text changes to "Hide deleted datasets" after press', async ({ page }) => {
    // Given
    await mockApiSuccess(page, '*/**/picsure/dataset/named', mockData);
    await page.goto('/dataset');

    // When
    await page.getByTestId('dataset-toggle-archive').click();

    // Then
    await expect(page.getByTestId('dataset-toggle-archive')).toHaveText('Hide deleted datasets');
  });
  test('Row click navigates to dataset detail page', async ({ page }) => {
    // Given
    await mockApiSuccess(page, '*/**/picsure/dataset/named', mockData);
    await mockApiSuccess(page, `*/**/picsure/dataset/named/${mockData[0].uuid}`, mockData[0]);
    await page.goto('/dataset');

    // When
    await page.getByText(mockData[0].name, { exact: true }).click();

    // Then
    await expect(page).toHaveURL(new RegExp(`/dataset/${mockData[0].uuid}`));
  });
});
test.describe('dataset/[uuid]', () => {
  test('Dataset values present on page', async ({ page }) => {
    // Given
    await mockApiSuccess(page, `*/**/picsure/dataset/named/${mockData[0].uuid}`, mockData[0]);
    await page.goto(`/dataset/${mockData[0].uuid}`);
    await page.waitForSelector('[data-testid="detail-summary-container"]');

    // Then
    await expect(page.getByTestId('detail-summary-container')).toBeVisible();
    await expect(page.getByTestId('dataset-summary-name')).toBeVisible();
    await expect(page.getByTestId('dataset-summary-uuid')).toBeVisible();
    await expect(page.getByTestId('detail-filters-container')).toBeVisible();
    await expect(page.getByTestId('detail-variables-container')).toBeVisible();
  });
  test('Error message on api error', async ({ page }) => {
    // Given
    await mockApiFail(page, `*/**/picsure/dataset/named/${mockData[0].uuid}`, 'accessdenied');
    await page.goto(`/dataset/${mockData[0].uuid}`);

    // Then
    await expect(page.getByTestId('error-alert')).toBeVisible();
  });
  test('Back button is visible and navigates to /dataset', async ({ page }) => {
    // Given
    await mockApiSuccess(page, `*/**/picsure/dataset/named/${mockData[0].uuid}`, mockData[0]);
    await page.goto(`/dataset/${mockData[0].uuid}`);
    await page.waitForSelector('[data-testid="detail-summary-container"]');

    // When
    await page.getByTestId('back-btn').click();

    // Then
    await expect(page).toHaveURL(new RegExp('/dataset$'));
  });
  test('Dataset name displays correct value', async ({ page }) => {
    // Given
    await mockApiSuccess(page, `*/**/picsure/dataset/named/${mockData[0].uuid}`, mockData[0]);
    await page.goto(`/dataset/${mockData[0].uuid}`);
    await page.waitForSelector('[data-testid="detail-summary-container"]');

    // Then
    await expect(page.getByTestId('dataset-summary-name')).toHaveText(mockData[0].name);
  });
  test('Dataset queryId displays correct value', async ({ page }) => {
    // Given
    await mockApiSuccess(page, `*/**/picsure/dataset/named/${mockData[0].uuid}`, mockData[0]);
    await page.goto(`/dataset/${mockData[0].uuid}`);
    await page.waitForSelector('[data-testid="detail-summary-container"]');

    // Then
    await expect(page.getByTestId('dataset-summary-uuid')).toContainText(mockData[0].query.uuid);
  });
  test('Filter cards are visible even on detail request failure', async ({ page }) => {
    // Given
    await mockApiSuccess(page, `*/**/picsure/dataset/named/${mockData[0].uuid}`, mockData[0]);
    await mockApiFail(page, '*/**/picsure/proxy/dictionary-api/concepts/detail/**', 'failed');
    await page.goto(`/dataset/${mockData[0].uuid}`);
    await page.waitForSelector('[data-testid="detail-summary-container"]');

    // Then
    await expect(page.getByTestId('dataset-filter-card').first()).toBeVisible();
  });
  test('Variables section is visible', async ({ page }) => {
    // Given
    await mockApiSuccess(page, `*/**/picsure/dataset/named/${mockData[0].uuid}`, mockData[0]);
    await page.goto(`/dataset/${mockData[0].uuid}`);
    await page.waitForSelector('[data-testid="detail-summary-container"]');

    // Then
    await expect(page.getByTestId('detail-variables-container')).toBeVisible();
  });
  test('Shows error when dataset query version is unknown', async ({ page }) => {
    // Given — query with no phenotypicClause or categoryFilters maps to version UNKNOWN (query = null)
    const unknownVersionDataset = {
      ...mockData[0],
      query: {
        ...mockData[0].query,
        query: JSON.stringify({
          '@type': 'GeneralQueryRequest',
          resourceCredentials: { BEARER_TOKEN: null },
          query: { select: [], expectedResultType: 'DATAFRAME' },
          resourceUUID: mockData[0].query.resource.uuid,
        }),
      },
    };
    await mockApiSuccess(
      page,
      `*/**/picsure/dataset/named/${mockData[0].uuid}`,
      unknownVersionDataset,
    );
    await page.goto(`/dataset/${mockData[0].uuid}`);

    // Then
    await expect(page.getByTestId('error-alert')).toBeVisible();
  });
  test('Restore Filters confirms, shows success toast, and navigates to explorer', async ({
    page,
  }) => {
    // Given
    await mockApiSuccess(page, `*/**/picsure/dataset/named/${mockData[0].uuid}`, mockData[0]);
    await page.goto(`/dataset/${mockData[0].uuid}`);
    await page.waitForSelector('[data-testid="detail-summary-container"]');

    // When - open modal and confirm
    await page.getByTestId('restore-filters-btn').click();
    await page
      .getByTestId('restore-filters')
      .getByRole('button', { name: 'Restore Filters' })
      .click();

    // Then
    await expect(page.getByTestId('toast-root')).toBeVisible();
    await expect(page.getByTestId('toast-root')).toHaveAttribute('data-type', 'success');
    await expect(page).toHaveURL(new RegExp('/explorer'));
  });
  test('Restore Filters adds filters to Result Panel', async ({ page }) => {
    // Given
    await mockApiSuccess(page, `*/**/picsure/dataset/named/${mockData[0].uuid}`, mockData[0]);
    await page.goto(`/dataset/${mockData[0].uuid}`);

    // When - open modal and confirm
    await page.getByTestId('restore-filters-btn').click();
    await page
      .getByTestId('restore-filters')
      .getByRole('button', { name: 'Restore Filters' })
      .click();
    await page.waitForURL('**/explorer');
    await expect(page.locator('#results-panel')).toBeVisible();

    // Then
    await expect(page.getByTestId(`added-filter-${datasetDetails.paths.GENDER}`)).toBeVisible();
    await expect(page.getByTestId(`added-export-${datasetDetails.paths.GENDER}`)).toBeVisible();
    await expect(page.getByTestId(`added-export-${datasetDetails.paths.HEIGHT}`)).toBeVisible();
    await expect(page.getByTestId(`added-export-${datasetDetails.paths.WEIGHT}`)).toBeVisible();
  });
  test('Restore Filters modal shows warning when existing filters are present', async ({
    page,
  }) => {
    // Given - restore filters once to populate the filter store
    await mockApiSuccess(page, `*/**/picsure/dataset/named/${mockData[0].uuid}`, mockData[0]);
    await page.goto(`/dataset/${mockData[0].uuid}`);
    await page.waitForSelector('[data-testid="detail-summary-container"]');
    await page.getByTestId('restore-filters-btn').click();
    await page
      .getByTestId('restore-filters')
      .getByRole('button', { name: 'Restore Filters' })
      .click();
    await expect(page).toHaveURL(new RegExp('/explorer'));
    await page.waitForURL('**/explorer');

    // When - navigate back to dataset and open the restore modal again
    await page.goto(`/dataset/${mockData[0].uuid}`);
    await page.waitForSelector('[data-testid="detail-summary-container"]');
    await page.getByTestId('restore-filters-btn').click();

    // Then - warning is shown in the modal
    await expect(page.getByTestId('restore-filters')).toBeVisible();
    await expect(page.getByTestId('error-alert')).toBeVisible();
    await expect(page.getByTestId('error-alert')).toContainText('You already have active filters.');
  });
  test('Restore Filters with existing filters still redirects to explorer with success toast', async ({
    page,
  }) => {
    // Given - restore filters once to populate the filter store
    await mockApiSuccess(page, `*/**/picsure/dataset/named/${mockData[0].uuid}`, mockData[0]);
    await page.goto(`/dataset/${mockData[0].uuid}`);
    await page.waitForSelector('[data-testid="detail-summary-container"]');
    await page.getByTestId('restore-filters-btn').click();
    await page
      .getByTestId('restore-filters')
      .getByRole('button', { name: 'Restore Filters' })
      .click();
    await expect(page).toHaveURL(new RegExp('/explorer'));

    // When - navigate back, open modal, and confirm despite warning
    await page.goto(`/dataset/${mockData[0].uuid}`);
    await page.waitForSelector('[data-testid="detail-summary-container"]');
    await page.getByTestId('restore-filters-btn').click();
    await page
      .getByTestId('restore-filters')
      .getByRole('button', { name: 'Restore Filters' })
      .click();
    await expect(page).toHaveURL(new RegExp('/explorer'));
    await page.waitForURL('**/explorer');

    // Then - still gets success toast and redirected
    await expect(page.getByTestId('toast-root')).toBeVisible();
    await expect(page.getByTestId('toast-root')).toHaveAttribute('data-type', 'success');
    await expect(page).toHaveURL(new RegExp('/explorer'));
  });
  test('Restore Filters for AnyRecordOf uses tree children as concept paths', async ({ page }) => {
    // Given — archived dataset has an ANY_RECORD_OF filter on \\phs001\\
    const anyRecordOfDataset = mockData[1];
    const anyRecordOfConceptPath = '\\phs001\\';
    const treeResponse = {
      conceptPath: anyRecordOfConceptPath,
      name: 'phs001',
      display: 'Study phs001',
      dataset: 'phs001',
      allowFiltering: false,
      type: 'AnyRecordOf',
      children: [
        {
          conceptPath: '\\phs001\\demographics\\',
          name: 'demographics',
          display: 'Demographics',
          dataset: 'phs001',
          allowFiltering: true,
          type: 'Categorical',
          children: [],
        },
        {
          conceptPath: '\\phs001\\vitals\\',
          name: 'vitals',
          display: 'Vitals',
          dataset: 'phs001',
          allowFiltering: true,
          type: 'Continuous',
          children: [],
        },
      ],
    };
    await mockApiSuccess(
      page,
      `*/**/picsure/dataset/named/${anyRecordOfDataset.uuid}`,
      anyRecordOfDataset,
    );
    await mockApiSuccess(page, `${conceptTreePath}/**`, treeResponse);

    // When — restore filters
    await page.goto(`/dataset/${anyRecordOfDataset.uuid}`);
    await page.waitForSelector('[data-testid="detail-summary-container"]');
    await page.getByTestId('restore-filters-btn').click();
    await page
      .getByTestId('restore-filters')
      .getByRole('button', { name: 'Restore Filters' })
      .click();
    await page.waitForURL('**/explorer');
    await expect(page.locator('#results-panel')).toBeVisible();

    // Then — the AnyRecordOf filter appears in the result panel
    await expect(page.getByTestId(`added-filter-${anyRecordOfConceptPath}`)).toBeVisible();
  });

  test('Copy button on queryId shows popup', async ({ page }) => {
    // Given
    await mockApiSuccess(page, `*/**/picsure/dataset/named/${mockData[0].uuid}`, mockData[0]);
    await page.goto(`/dataset/${mockData[0].uuid}`);
    await page.waitForSelector('[data-testid="detail-summary-container"]');

    // When
    const copyBtn = page.getByTestId(`${mockData[0].query.uuid}-copy-btn`);
    await copyBtn.click();

    // Then
    await expect(page.getByTestId(`${mockData[0].query.uuid}-copy`)).toBeVisible();
  });
});
