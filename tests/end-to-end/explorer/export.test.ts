import { expect, type Route, type Page } from '@playwright/test';
import {
  test,
  mockApiSuccess,
  mockApiSuccessByMethod,
  mockApiConfig,
  mockQuerySync,
} from '../custom-context';
import {
  conceptTreePath,
  conceptsDetailPath,
  detailResponseCat,
  detailResponseCatSameDataset,
  searchResults as mockData,
  searchResultPath,
  searchResultPathForSampleIds,
  facetResultPath,
  facetsResponse,
  geneValues,
  newDatasetResponse,
  availableDatasetResponse,
  picsureUser,
  mockDataWithChildren,
} from '../../support/mock-data';
import { getOption, userIsLoggedIn, chooseGenomicFilterType } from '../utils';
import { tones } from '#lib/ui/surface.ts';
import { buttonVariants } from '#lib/ui/button.ts';
import configJson from '../../../src/lib/assets/configuration.json' with { type: 'json' };

const { codeBlocks } = configJson.explorePage;

const queryPath = '*/**/picsure/hpds/auth/query';
const countResultPath = `${queryPath}/sync`;
const openCountResultPath = '*/**/picsure/hpds/open/query/sync';

// Standard identifiers that should be present
const standardIdentifiers = [
  {
    name: 'Patient ID',
    description: 'Patient identifier.',
    type: 'Categorical',
  },
];

test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });

const baseExportFeatures = [
  { name: 'ALLOW_DOWNLOAD', value: 'true' },
  { name: 'ALLOW_EXPORT_ENABLED', value: 'true' },
  { name: 'ALLOW_EXPORT', value: 'true' },
  { name: 'ANALYZE_API', value: 'true' },
  { name: 'DOWNLOAD_AS_PFB', value: 'true' },
  { name: 'ENABLE_SAMPLE_ID_CHECKBOX', value: 'true' },
  { name: 'SHOW_TREE_STEP', value: 'true' },
  { name: 'EXPORT_TIMESERIES', value: 'false' },
];
const baseExportSettings = [{ name: 'EXPORT_SYSTEM_FIELDS', value: '_consents' }];

async function setupExportPageAndAddFilterAndExport(
  page: Page,
  includeGenomicFilter: boolean = false,
) {
  await mockApiSuccess(page, `${conceptTreePath}?depth=4`, [mockDataWithChildren]);
  await mockApiSuccess(
    page,
    `${conceptsDetailPath}/${detailResponseCat.dataset}`,
    detailResponseCat,
  );
  await mockApiSuccess(page, facetResultPath, facetsResponse);
  await mockApiSuccess(page, searchResultPath, mockData);
  await mockApiSuccess(page, countResultPath, 9999);
  await mockApiSuccess(page, `*/**/picsure/hpds/auth/search/values*`, geneValues);
  await page.goto('/explorer?search=age');
  await userIsLoggedIn(page);

  const expectedRowIds = mockData.content.map((row) => row.conceptPath);
  const tableBody = page.locator('tbody');
  await expect(tableBody).toBeVisible();

  const firstRow = tableBody.locator('tr').nth(0);
  const filterIcon = firstRow.locator('td').last().locator('button').nth(1);
  await filterIcon.click();
  const firstFilter = await getOption(page);
  await firstFilter.click();
  const addFilterButton = page.getByTestId('filter-add');
  await addFilterButton.click();
  await expect(page.getByTestId(`results-filter-item-${expectedRowIds[0]}`)).toBeVisible();

  const secondRow = tableBody.locator('tr').nth(1);
  const exportButton = secondRow.locator('td').last().locator('button').last();
  await exportButton.click();
  await expect(page.getByTestId(`results-export-item-${expectedRowIds[1]}`)).toBeVisible();

  if (includeGenomicFilter) {
    await page.getByTestId('explorer-genomic-filter-open').click();
    await chooseGenomicFilterType(page, 'gene');
    await expect(page.getByTestId('genomic-filter-add')).not.toBeEnabled();
    const optionsContainer = page.getByTestId('ui-options-selection-list-available');
    await optionsContainer.getByLabel(geneValues.results[0]).click();
    await mockApiSuccess(page, countResultPath, 200);
    await page.getByTestId('genomic-filter-add').click();
  }

  const exportForAnalysisButton = page.locator('button#results-export-open');
  await expect(exportForAnalysisButton).toBeVisible();
  await exportForAnalysisButton.click();
}

async function checkStepRenderedCorrectly(
  page: Page,
  stepNumber: number,
  headerText: string,
  nextStepDisabled: boolean = false,
  nextStepButtonText: string = 'Next',
  showSummary: boolean = true,
) {
  // Check that the step header is rendered with correct text and number
  const stepHeader = page.locator('div.stepper-header-step').nth(stepNumber - 1);
  const step = stepHeader.locator('span');
  await expect(step).toContainClass(tones['filled-primary']);
  await expect(page.locator('header.step-header')).toHaveText(headerText);

  // Check that the summary section is rendered if expected
  if (showSummary) {
    await expect(page.locator('div#export-summary-stats')).toBeVisible();
  } else {
    await expect(page.locator('div#export-summary-stats')).not.toBeVisible();
  }

  // Check that the next button is rendered with correct text and disabled state
  const nextButton = page.getByTestId(
    nextStepButtonText === 'Next' ? 'ui-stepper-next' : 'ui-stepper-complete',
  );
  await expect(nextButton).toBeVisible();
  await expect(nextButton).toContainText(nextStepButtonText);
  if (nextStepDisabled) {
    await expect(nextButton).toBeDisabled();
  } else {
    await expect(nextButton).toBeEnabled();
  }
}

const exportFeatures = [
  { name: 'ALLOW_DOWNLOAD', value: 'true' },
  { name: 'ALLOW_EXPORT_ENABLED', value: 'true' },
  { name: 'ALLOW_EXPORT', value: 'true' },
  { name: 'ANALYZE_API', value: 'true' },
  { name: 'DOWNLOAD_AS_PFB', value: 'true' },
  { name: 'ENABLE_REDCAP_EXPORT', value: 'false' },
  { name: 'ENABLE_SAMPLE_ID_CHECKBOX', value: 'true' },
  { name: 'SHOW_TREE_STEP', value: 'true' },
  { name: 'EXPORT_TIMESERIES', value: 'false' },
];
const exportSettings = [{ name: 'EXPORT_SYSTEM_FIELDS', value: '_consents' }];

test.describe('Export Page', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiConfig(page, {
      features: baseExportFeatures,
      settings: baseExportSettings,
    });
  });

  test('Empty Export page renders', async ({ page }) => {
    await page.goto('/explorer/export');
    await userIsLoggedIn(page);
    await expect(page).toHaveURL('/explorer/export');
    await expect(page.locator('h1')).toHaveText('Export Data for Research Analysis');
    await expect(page.getByRole('button', { name: 'Learn How' })).toBeVisible();
    await expect(page.getByTestId('ui-page-back')).toBeVisible();
  });

  test('Export page renders', async ({ page }) => {
    await setupExportPageAndAddFilterAndExport(page);
    await expect(page).toHaveURL('/explorer/export');
  });

  test('MAX_DATA_POINTS_FOR_EXPORT below the participant count locks the review step with a warning', async ({
    page,
  }) => {
    // Given - the mocked participant count (9999) exceeds this max of 10
    await mockApiConfig(page, {
      features: baseExportFeatures,
      settings: [...baseExportSettings, { name: 'MAX_DATA_POINTS_FOR_EXPORT', value: '10' }],
    });

    // When
    await setupExportPageAndAddFilterAndExport(page);

    // Then
    await expect(page).toHaveURL('/explorer/export');
    await expect(page.getByTestId('export-review-error')).toBeVisible();
    await expect(page.getByTestId('export-review-error')).toContainText(
      'exceeds 10 estimated data points',
    );
    await expect(page.getByTestId('ui-stepper-next')).toBeDisabled();
  });

  test('a variable selected in the tree that takes the export over the limit locks the tree step', async ({
    page,
  }) => {
    // Given - 9999 participants: the filter and the added variable fit under 25,000, a third doesn't
    await mockApiConfig(page, {
      features: baseExportFeatures,
      settings: [...baseExportSettings, { name: 'MAX_DATA_POINTS_FOR_EXPORT', value: '25000' }],
    });
    await setupExportPageAndAddFilterAndExport(page);
    const other = { ...mockDataWithChildren, conceptPath: '\\OTHER\\', name: 'other' };
    await mockApiSuccess(page, `${conceptTreePath}?depth=4`, [
      mockDataWithChildren,
      { ...other, children: undefined },
    ]);
    await page.getByTestId('ui-stepper-next').click();
    await expect(page.getByTestId('ui-tree-checkbox-other-other')).toBeVisible();
    await expect(page.getByTestId('export-tree-error')).toBeHidden();

    // When
    await page.getByTestId('ui-tree-checkbox-other-other').click();

    // Then
    await expect(page.getByTestId('export-tree-error')).toContainText(
      'exceeds 25,000 estimated data points',
    );
    await expect(page.getByTestId('ui-stepper-next')).toBeDisabled();
  });

  test('Export page renders expected data', async ({ page }) => {
    await setupExportPageAndAddFilterAndExport(page);
    await expect(page).toHaveURL('/explorer/export');
    await expect(page.locator('header.step-header')).toHaveText('Review Cohort Details:');

    // Verify the table body is visible
    const tableBody = page.locator('tbody');
    await expect(tableBody).toBeVisible();

    // Verify standard identifiers come first (Patient ID hardcoded, then system fields from env)
    for (let i = 0; i < standardIdentifiers.length; i++) {
      await expect(page.locator(`#export-summary-table-row-${i}-col-0`)).toHaveText(
        standardIdentifiers[i].name,
      );
      await expect(page.locator(`#export-summary-table-row-${i}-col-1`)).toHaveText(
        standardIdentifiers[i].description,
      );
      await expect(page.locator(`#export-summary-table-row-${i}-col-2`)).toHaveText(
        standardIdentifiers[i].type,
      );
    }

    // System field from VITE_EXPORT_SYSTEM_FIELDS (_consents)
    const systemFieldOffset = standardIdentifiers.length;
    await expect(page.locator(`#export-summary-table-row-${systemFieldOffset}-col-0`)).toHaveText(
      '_consents',
    );

    // Filter row
    const filterRowIndex = systemFieldOffset + 1;
    await expect(page.locator(`#export-summary-table-row-${filterRowIndex}-col-0`)).toHaveText(
      detailResponseCat.display,
    );
    await expect(page.locator(`#export-summary-table-row-${filterRowIndex}-col-1`)).toHaveText(
      detailResponseCat.description,
    );
    await expect(page.locator(`#export-summary-table-row-${filterRowIndex}-col-2`)).toHaveText(
      detailResponseCat.type,
    );

    // Export row
    const exportRowIndex = filterRowIndex + 1;
    await expect(page.locator(`#export-summary-table-row-${exportRowIndex}-col-0`)).toHaveText(
      detailResponseCatSameDataset.display,
    );
    await expect(page.locator(`#export-summary-table-row-${exportRowIndex}-col-1`)).toHaveText(
      detailResponseCatSameDataset.description,
    );
    await expect(page.locator(`#export-summary-table-row-${exportRowIndex}-col-2`)).toHaveText(
      detailResponseCatSameDataset.type,
    );
  });

  test('never queries the open endpoint, even with DISCOVER enabled', async ({ page }) => {
    await mockApiConfig(page, {
      features: [
        ...exportFeatures,
        { name: 'DISCOVER', value: 'true' },
        // Required for the Genomic Filtering entry point to render at all.
        { name: 'ENABLE_GENE_QUERY', value: 'true' },
        { name: 'ENABLE_SNP_QUERY', value: 'true' },
      ],
      settings: exportSettings,
    });

    const openQueryUrls: string[] = [];
    await page.route(openCountResultPath, async (route: Route) => {
      openQueryUrls.push(route.request().url());
      await route.fulfill({ json: { '\\_studies_consents\\': 9999 } });
    });

    await setupExportPageAndAddFilterAndExport(page, true);
    await expect(page).toHaveURL('/explorer/export');

    const nextButton = page.getByTestId('ui-stepper-next');
    await checkStepRenderedCorrectly(page, 1, 'Review Cohort Details:', false, 'Next', true);
    await nextButton.click();
    await checkStepRenderedCorrectly(page, 2, 'Finalize Data:', false, 'Next', true);
    await nextButton.click();
    await checkStepRenderedCorrectly(page, 3, 'Review and Save Dataset:', true, 'Next', true);

    expect(openQueryUrls).toEqual([]);
  });

  test('logs each stepper move with the step it lands on', async ({ page }) => {
    // Given
    const logs: { action?: string; metadata?: Record<string, unknown> }[] = [];
    await page.route('**/api/v1/log', (route) => {
      const { action, metadata } = route.request().postDataJSON() ?? {};
      if (action?.startsWith('export.stepper')) logs.push({ action, metadata });
      return route.fulfill({ status: 202, json: { result: 'accepted' } });
    });
    await setupExportPageAndAddFilterAndExport(page);
    const nextButton = page.getByTestId('ui-stepper-next');

    // When
    await nextButton.click();
    await expect(page.locator('header.step-header')).toHaveText('Finalize Data:');
    await page.getByTestId('ui-stepper-back').click();
    await expect(page.locator('header.step-header')).toHaveText('Review Cohort Details:');

    // Then
    await expect
      .poll(() => logs)
      .toEqual([
        { action: 'export.stepper_next', metadata: { step: 1, stepName: 'select-variables' } },
        { action: 'export.stepper_back', metadata: { step: 0, stepName: 'review' } },
      ]);
  });

  test('All steps render as expected', async ({ page }) => {
    await setupExportPageAndAddFilterAndExport(page);
    await expect(page).toHaveURL('/explorer/export');
    const nextButton = page.getByTestId('ui-stepper-next');

    // Review Cohort Details
    await checkStepRenderedCorrectly(page, 1, 'Review Cohort Details:', false, 'Next', true);
    await nextButton.click();

    // Tree Step
    await checkStepRenderedCorrectly(page, 2, 'Finalize Data:', false, 'Next', true);
    await nextButton.click();

    // Review and Save Dataset
    await checkStepRenderedCorrectly(page, 3, 'Review and Save Dataset:', true, 'Next', true);
    const csvExportOption = page.getByTestId('export-type-csv');
    const pfbExportOption = page.getByTestId('export-type-pfb');
    await expect(csvExportOption).toBeVisible();
    await expect(pfbExportOption).toBeVisible();
    await expect(csvExportOption).not.toContainClass(buttonVariants.filled);
    await expect(pfbExportOption).not.toContainClass(buttonVariants.filled);
    await pfbExportOption.click();
    await expect(csvExportOption).not.toContainClass(buttonVariants.filled);
    await expect(pfbExportOption).toContainClass(buttonVariants.filled);
    await csvExportOption.click();
    await expect(csvExportOption).toContainClass(buttonVariants.filled);
    await expect(pfbExportOption).not.toContainClass(buttonVariants.filled);
    await expect(nextButton).not.toBeDisabled();
    await mockApiSuccess(page, queryPath, newDatasetResponse);
    await nextButton.click();

    // Save Dataset ID
    await checkStepRenderedCorrectly(page, 4, 'Save Dataset ID:', true, 'Next', true);
    const datasetNameInput = page.locator('input#export-dataset-name');
    await expect(datasetNameInput).toBeVisible();
    await datasetNameInput.fill('test-dataset');
    await expect(page.locator('div#export-dataset-id')).toHaveText(
      newDatasetResponse.picsureResultId,
    );
    await expect(nextButton).not.toBeDisabled();
    await mockApiSuccess(page, `*/**/picsure/operations/dataset/named`, newDatasetResponse);
    await mockApiSuccessByMethod(
      page,
      `${queryPath}/${newDatasetResponse.picsureResultId}/status`,
      'GET',
      availableDatasetResponse,
    );
    await mockApiSuccess(page, '*/**/psama/user/me?hasToken', picsureUser);
    await nextButton.click();

    // Start Analysis
    await checkStepRenderedCorrectly(page, 5, 'Start Analysis:', false, 'Done', false);
    const tabGroup = page.getByTestId('ui-tabs-list');
    const codeBlock = page.getByTestId('ui-tabs-panel').locator('.code-block').first();
    await expect(tabGroup).toBeVisible();
    await expect(codeBlock).toBeVisible();
    await expect(codeBlock).toContainText('python');
    await expect(codeBlock).toContainText('%pip install picsure');
    await expect(codeBlock).toContainText(`session.runQueryByID(queryID, type="participant")`);
    await expect(codeBlock).toContainText(`queryID = "${newDatasetResponse.picsureResultId}"`);
    await expect(codeBlock).not.toContainText('github.com');
    const origin = new URL(page.url()).origin;
    await expect(codeBlock).toContainText(`platform="${origin}"`);
    const rTab = tabGroup.getByTestId('ui-tabs-control').nth(1);
    await expect(rTab).toHaveText('R');
    await rTab.click();
    const rCodeBlock = page
      .getByTestId('ui-tabs-panel')
      .locator('.code-block')
      .filter({ visible: true });
    await expect(rCodeBlock).toContainText(
      codeBlocks.RExport.replace('{{PICSURE_ORIGIN}}', origin).replace(
        '{{queryId}}',
        newDatasetResponse.picsureResultId,
      ),
    );
    await expect(rCodeBlock).toContainText(`platform="${origin}"`);
    const tab = tabGroup.getByTestId('ui-tabs-control').nth(2);
    await expect(tab).toBeVisible();
    await expect(tab).toHaveText('Download');
    await tab.click();
    const downloadButton = page.getByRole('button', { name: 'Download as CSV' });
    await expect(downloadButton).toBeVisible();
    await expect(downloadButton).toBeEnabled();
    const userToken = page.locator('div#user-token');
    await expect(userToken).toBeVisible();
    await expect(userToken.locator('span#user-token-account')).toHaveText(picsureUser.email || '');

    const doneButton = page.getByTestId('ui-stepper-complete');
    await expect(doneButton).toBeVisible();
    await doneButton.click();
    await expect(page).toHaveURL('/explorer');
  });

  test('Adds filters to select field for QueryV3', async ({ page }) => {
    const conceptPaths = mockData.content.map((row) => row.conceptPath);
    const addedFilterConcept = conceptPaths[0];
    const addedExportConcept = conceptPaths[1];
    const expectedSelectFields = [addedExportConcept, addedFilterConcept];
    await setupExportPageAndAddFilterAndExport(page);
    await expect(page).toHaveURL('/explorer/export');
    const nextButton = page.getByTestId('ui-stepper-next');

    // Review Cohort Details
    await nextButton.click();

    // Tree Step
    await nextButton.click();

    // Review and Save Dataset=
    await page.getByTestId('export-type-csv').click();
    await expect(nextButton).not.toBeDisabled();
    await page.route(queryPath, (route: Route) => {
      const request = route.request().postDataJSON();
      const selects: string[] = request?.query?.select || [];
      const allFiltersInSelect = expectedSelectFields.every((concept) => selects.includes(concept));

      if (allFiltersInSelect) {
        return route.fulfill({ json: newDatasetResponse });
      }
      return route.abort('Query did not include filter concept paths in QueryV3 select files');
    });

    await nextButton.click();
  });

  test('System fields from config appear on export page', async ({ page }) => {
    await setupExportPageAndAddFilterAndExport(page);
    await expect(page).toHaveURL('/explorer/export');

    const tableBody = page.locator('tbody');
    await expect(tableBody).toBeVisible();

    // Patient ID is always shown as a hardcoded display row
    await expect(tableBody.getByText('Patient ID', { exact: true })).toBeVisible();
    // System fields configured via VITE_EXPORT_SYSTEM_FIELDS in .env.test (_consents)
    await expect(tableBody.getByText('_consents', { exact: true })).toBeVisible();
  });

  test('System fields are included in query select on submit', async ({ page }) => {
    await setupExportPageAndAddFilterAndExport(page);
    await expect(page).toHaveURL('/explorer/export');
    const nextButton = page.getByTestId('ui-stepper-next');

    // Step through to save-dataset
    await nextButton.click(); // Review Cohort Details
    await nextButton.click(); // Tree Step

    // Select CSV export type
    await page.getByTestId('export-type-csv').click();
    await expect(nextButton).not.toBeDisabled();

    // Intercept the query request to verify system fields are included
    let capturedQuery: { query: { select: string[] } } | null = null;
    await page.route(queryPath, async (route: Route) => {
      const request = route.request();
      capturedQuery = request.postDataJSON();
      await route.fulfill({ json: newDatasetResponse });
    });

    await nextButton.click(); // Submit query

    // Wait for the dataset ID to appear (indicating query was submitted)
    await expect(page.locator('div#export-dataset-id')).toHaveText(
      newDatasetResponse.picsureResultId,
    );

    // Verify the captured query contains the system fields but NOT patient_id
    expect(capturedQuery).not.toBeNull();
    expect(capturedQuery!.query.select).not.toContain('\\patient_id\\');
    expect(capturedQuery!.query.select).toContain('\\_consents\\');
  });

  test('shows a loading message while the dataset ID is created', async ({ page }) => {
    await setupExportPageAndAddFilterAndExport(page);
    const nextButton = page.getByTestId('ui-stepper-next');
    await nextButton.click(); // Review Cohort Details
    await nextButton.click(); // Tree Step
    await page.getByTestId('export-type-csv').click();

    let releaseQuery = () => {};
    const queryHeld = new Promise<void>((resolve) => (releaseQuery = resolve));
    await page.route(queryPath, async (route: Route) => {
      await queryHeld;
      await route.fulfill({ json: newDatasetResponse });
    });

    await nextButton.click(); // Submit query

    await expect(
      page.getByRole('status').filter({ hasText: 'Creating dataset ID…' }),
    ).toBeVisible();
    await expect(page.locator('#export-dataset-name')).toBeVisible();
    releaseQuery();
    await expect(page.locator('div#export-dataset-id')).toHaveText(
      newDatasetResponse.picsureResultId,
    );
  });

  test('shows a retry message while a failed dataset ID request is retried', async ({ page }) => {
    await setupExportPageAndAddFilterAndExport(page);
    const nextButton = page.getByTestId('ui-stepper-next');
    await nextButton.click(); // Review Cohort Details
    await nextButton.click(); // Tree Step
    await page.getByTestId('export-type-csv').click();

    let attempts = 0;
    let releaseRetry = () => {};
    const retryHeld = new Promise<void>((resolve) => (releaseRetry = resolve));
    await page.route(queryPath, async (route: Route) => {
      attempts++;
      if (attempts === 1) {
        await route.fulfill({ status: 500 });
        return;
      }
      await retryHeld;
      await route.fulfill({ json: newDatasetResponse });
    });

    await nextButton.click(); // Submit query

    await expect(
      page.getByRole('status').filter({
        hasText: "Something's taking longer than usual. We are still working on it…",
      }),
    ).toBeVisible();
    releaseRetry();
    await expect(page.locator('div#export-dataset-id')).toHaveText(
      newDatasetResponse.picsureResultId,
    );
  });

  async function setupExportPageWithSampleIdMocks(page: Page) {
    // Mock data for genomic concepts
    const genomicConceptsResponse = {
      totalPages: 1,
      totalElements: 2,
      pageable: {
        pageNumber: 0,
        pageSize: 10000,
        sort: { unsorted: true, sorted: false, empty: true },
        offset: 0,
        unpaged: false,
        paged: true,
      },
      numberOfElements: 2,
      first: true,
      last: true,
      size: 10000,
      content: [
        {
          conceptPath: '\\GENOMIC\\SAMPLE_ID\\Study1\\',
          name: 'SAMPLE_ID_Study1',
          display: 'Sample ID - Study 1',
          dataset: 'genomic_data',
          allowFiltering: true,
          studyAcronym: 'GS1',
          description: 'Genomic sample identifier for Study 1',
          values: [],
          children: null,
          meta: null,
          type: 'Categorical',
        },
        {
          conceptPath: '\\GENOMIC\\SAMPLE_ID\\Study2\\',
          name: 'SAMPLE_ID_Study2',
          display: 'Sample ID - Study 2',
          dataset: 'genomic_data',
          allowFiltering: true,
          studyAcronym: 'GS2',
          description: 'Genomic sample identifier for Study 2',
          values: [],
          children: null,
          meta: null,
          type: 'Categorical',
        },
      ],
    };

    // Cross-count response showing both concepts have data
    const crossCountResponse: Record<string, number> = {
      '\\GENOMIC\\SAMPLE_ID\\Study1\\': 100,
      '\\GENOMIC\\SAMPLE_ID\\Study2\\': 150,
    };

    await setupExportPageAndAddFilterAndExport(page);
    await expect(page).toHaveURL('/explorer/export');

    // Now set up mocks for the sample IDs checkbox AFTER the page is loaded
    await page.unroute(countResultPath);
    await mockQuerySync(page, { CROSS_COUNT: crossCountResponse, COUNT: '9999' });

    // Mock the genomic concepts search (page_size=10000 is used for sample IDs)
    await page.route(searchResultPathForSampleIds, async (route) => {
      await route.fulfill({ json: genomicConceptsResponse });
    });
  }

  test('Sample IDs checkbox adds genomic concepts to exports and query', async ({ page }) => {
    await setupExportPageWithSampleIdMocks(page);

    // Find and click the sample IDs checkbox
    const sampleIdsCheckbox = page.getByTestId('export-sample-ids-checkbox');
    await expect(sampleIdsCheckbox).toBeVisible();
    await expect(sampleIdsCheckbox).not.toBeChecked();
    await sampleIdsCheckbox.click();

    // Wait for the loading to complete and verify checkbox is checked
    await expect(sampleIdsCheckbox).toBeChecked({ timeout: 10000 });

    // Verify the sample ID rows appear in the table
    const tableBody = page.locator('tbody');
    await expect(tableBody).toBeVisible();
    await expect(tableBody.getByText('Genomic sample identifier for Study 1')).toBeVisible({
      timeout: 10000,
    });
    await expect(tableBody.getByText('Genomic sample identifier for Study 2')).toBeVisible({
      timeout: 10000,
    });

    // Now navigate to save-dataset step and capture the query
    const nextButton = page.getByTestId('ui-stepper-next');

    // Step through to save-dataset, capturing the query sent
    await nextButton.click(); // Review -> Tree Step
    await nextButton.click(); // Tree Step -> Select Type

    // Select CSV export type
    const csvExportOption = page.getByTestId('export-type-csv');
    await csvExportOption.click();

    // Intercept the query request to verify sample IDs are included
    let capturedQuery: { query: { select: string[] } } | null = null;
    await page.route(queryPath, async (route) => {
      const request = route.request();
      capturedQuery = request.postDataJSON();
      await route.fulfill({ json: newDatasetResponse });
    });

    await nextButton.click(); // Select Type -> Save Dataset (this triggers submitQuery)

    // Wait for the dataset ID to appear (indicating query was submitted)
    await expect(page.locator('div#export-dataset-id')).toHaveText(
      newDatasetResponse.picsureResultId,
    );

    // Verify the captured query contains the sample ID fields
    expect(capturedQuery).not.toBeNull();
    expect(capturedQuery!.query.select).toContain('\\GENOMIC\\SAMPLE_ID\\Study1\\');
    expect(capturedQuery!.query.select).toContain('\\GENOMIC\\SAMPLE_ID\\Study2\\');
  });

  test('Sample ID rows persist after navigating forward and back', async ({ page }) => {
    await setupExportPageWithSampleIdMocks(page);
    const sampleIdsCheckbox = page.getByTestId('export-sample-ids-checkbox');
    await sampleIdsCheckbox.click();
    await expect(sampleIdsCheckbox).toBeChecked();
    const tableBody = page.locator('tbody');
    await expect(tableBody.getByText('Sample ID - Study 1')).toBeVisible();

    await page.getByTestId('ui-stepper-next').click();
    await expect(sampleIdsCheckbox).toBeHidden();
    await page.getByRole('button', { name: 'Back', exact: true }).click();

    await expect(sampleIdsCheckbox).toBeChecked();
    await expect(tableBody.getByText('Sample ID - Study 1')).toBeVisible();
    await expect(tableBody.getByText('Sample ID - Study 2')).toBeVisible();

    await sampleIdsCheckbox.click();
    await expect(sampleIdsCheckbox).not.toBeChecked();
    await expect(tableBody.getByRole('cell', { name: 'Patient ID', exact: true })).toBeVisible();
    await expect(tableBody.getByText('Sample ID - Study 1')).toBeHidden();
    await expect(tableBody.getByText('Sample ID - Study 2')).toBeHidden();
  });

  test('Unchecked sample ID rows stay removed after navigating forward and back', async ({
    page,
  }) => {
    await setupExportPageWithSampleIdMocks(page);
    const sampleIdsCheckbox = page.getByTestId('export-sample-ids-checkbox');
    await sampleIdsCheckbox.click();
    await expect(sampleIdsCheckbox).toBeChecked();

    // Re-enter the export page so the sample IDs are already exported when it loads
    await page.getByTestId('ui-page-back').click();
    await page.locator('button#results-export-open').click();
    await expect(sampleIdsCheckbox).toBeChecked();
    const tableBody = page.locator('tbody');
    await expect(tableBody.getByText('Sample ID - Study 1')).toBeVisible();

    await sampleIdsCheckbox.click();
    await expect(sampleIdsCheckbox).not.toBeChecked();
    await page.getByTestId('ui-stepper-next').click();
    await expect(sampleIdsCheckbox).toBeHidden();
    await page.getByRole('button', { name: 'Back', exact: true }).click();

    await expect(sampleIdsCheckbox).not.toBeChecked();
    await expect(tableBody.getByRole('cell', { name: 'Patient ID', exact: true })).toBeVisible();
    await expect(tableBody.getByText('Sample ID - Study 1')).toBeHidden();
    await expect(tableBody.getByText('Sample ID - Study 2')).toBeHidden();
  });

  async function startAnalysisWith(page: Page, datasetName: string, status: object) {
    await setupExportPageAndAddFilterAndExport(page);
    const nextButton = page.getByTestId('ui-stepper-next');
    await nextButton.click(); // Review Cohort Details -> Tree Step
    await nextButton.click(); // Tree Step -> Select Type
    await page.getByTestId('export-type-csv').click();
    await mockApiSuccess(page, queryPath, newDatasetResponse);
    await nextButton.click(); // Submit query -> Save Dataset ID
    await page.locator('input#export-dataset-name').fill(datasetName);
    await mockApiSuccess(page, `*/**/picsure/operations/dataset/named`, newDatasetResponse);
    await mockApiSuccessByMethod(
      page,
      `${queryPath}/${newDatasetResponse.picsureResultId}/status`,
      'GET',
      status,
    );
    await nextButton.click(); // -> Start Analysis
  }

  test('a failed export says so', async ({ page }) => {
    await startAnalysisWith(page, 'test-dataset', { ...availableDatasetResponse, status: 'ERROR' });

    await expect(page.getByTestId('ui-error-alert')).toContainText(
      'Export failed with status: ERROR',
    );
  });

  test('an invalid dataset name says why it was refused', async ({ page }) => {
    await startAnalysisWith(page, 'bad@name', availableDatasetResponse);

    await expect(page.getByTestId('ui-error-alert')).toContainText(
      'Name can only contain letters, numbers',
    );
  });

  async function navigateToDownloadTab(page: Page) {
    await setupExportPageAndAddFilterAndExport(page);
    const nextButton = page.getByTestId('ui-stepper-next');

    await nextButton.click(); // Review Cohort Details -> Tree Step
    await nextButton.click(); // Tree Step -> Select Type

    await page.getByTestId('export-type-csv').click();
    await mockApiSuccess(page, queryPath, newDatasetResponse);
    await nextButton.click(); // Submit query -> Save Dataset ID

    await page.locator('input#export-dataset-name').fill('test-dataset');
    await mockApiSuccess(page, `*/**/picsure/operations/dataset/named`, newDatasetResponse);
    await mockApiSuccessByMethod(
      page,
      `${queryPath}/${newDatasetResponse.picsureResultId}/status`,
      'GET',
      availableDatasetResponse,
    );
    await mockApiSuccess(page, '*/**/psama/user/me?hasToken', picsureUser);
    await nextButton.click(); // -> Start Analysis

    const tabGroup = page.getByTestId('ui-tabs-list');
    await tabGroup.getByTestId('ui-tabs-control').nth(2).click(); // Download tab
  }

  test('CONFIRM_DOWNLOAD=true opens a confirmation modal before downloading', async ({ page }) => {
    // Given
    await mockApiConfig(page, {
      features: [...baseExportFeatures, { name: 'CONFIRM_DOWNLOAD', value: 'true' }],
      settings: baseExportSettings,
    });
    await navigateToDownloadTab(page);
    const downloadButton = page.getByRole('button', { name: 'Download as CSV' });
    await expect(downloadButton).toBeVisible();
    const downloadResult = page.waitForEvent('download', { timeout: 2000 }).catch(() => null);

    // When
    await downloadButton.click();

    // Then
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    await expect(modal.getByTestId('ui-modal-header')).toContainText(
      'Are you sure you want to download data?',
    );
    expect(await downloadResult).toBeNull();
  });

  test('CONFIRM_DOWNLOAD=false downloads without a confirmation modal', async ({ page }) => {
    // Given
    await mockApiConfig(page, {
      features: [...baseExportFeatures, { name: 'CONFIRM_DOWNLOAD', value: 'false' }],
      settings: baseExportSettings,
    });
    await navigateToDownloadTab(page);
    await mockApiSuccessByMethod(
      page,
      `${queryPath}/${newDatasetResponse.picsureResultId}/result`,
      'GET',
      'csv,data',
    );
    const downloadButton = page.getByRole('button', { name: 'Download as CSV' });
    await expect(downloadButton).toBeVisible();
    const resultRequest = page.waitForRequest((request) => request.url().endsWith('/result'));

    // When
    const [download] = await Promise.all([page.waitForEvent('download'), downloadButton.click()]);

    // Then
    const request = await resultRequest;
    expect(request.method()).toBe('GET');
    expect(request.postData()).toBeNull();
    expect(download).toBeTruthy();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });
});
