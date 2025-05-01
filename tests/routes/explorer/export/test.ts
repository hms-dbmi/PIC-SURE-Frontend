import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { test, mockApiSuccess } from '../../../custom-context';
import {
  conceptsDetailPath,
  detailResponseCat,
  detailResponseCatSameDataset,
  searchResults as mockData,
  searchResultPath,
  facetResultPath,
  facetsResponse,
  geneValues,
  newDatasetResponse,
  availableDatasetResponse,
  picsureUser,
} from '../../../mock-data';
import { getOption } from '../../../utils';

const countResultPath = '*/**/picsure/query/sync';
const HPDS = process.env.VITE_RESOURCE_HPDS;

// Standard identifiers that should be present
const standardIdentifiers = [
  {
    name: 'Patient ID',
    description: 'Patient identifier.',
    type: 'Categorical',
  },
  {
    name: 'TOPMed Study Accession with Subject ID',
    description: 'TOPMed study accession number and subject identifier.',
    type: 'Categorical',
  },
  {
    name: 'Parent Study Accession with Subject ID',
    description: 'Parent study accession number and subject identifier.',
    type: 'Categorical',
  },
];

test.use({ storageState: 'tests/.auth/generalUser.json' });

async function setupExportPageAndAddFilterAndExport(
  page: Page,
  includeGenomicFilter: boolean = false,
) {
  await mockApiSuccess(
    page,
    `${conceptsDetailPath}${detailResponseCat.dataset}`,
    detailResponseCat,
  );
  await mockApiSuccess(page, facetResultPath, facetsResponse);
  await mockApiSuccess(page, searchResultPath, mockData);
  await mockApiSuccess(page, countResultPath, 9999);
  await mockApiSuccess(page, `*/**/picsure/search/${HPDS}/values/*`, geneValues);
  await page.goto('/explorer?search=age');

  const expectedRowIds = mockData.content.map((row) => row.conceptPath);
  const tableBody = page.locator('tbody');
  await expect(tableBody).toBeVisible();

  const firstRow = tableBody.locator('tr').nth(0);
  const filterIcon = firstRow.locator('td').last().locator('button').nth(1);
  await filterIcon.click();
  const firstFilter = await getOption(page);
  await firstFilter.click();
  const addFilterButton = page.getByTestId('add-filter');
  await addFilterButton.click();
  await expect(page.getByTestId(`added-filter-${expectedRowIds[0]}`)).toBeVisible();

  const secondRow = tableBody.locator('tr').nth(1);
  const exportButton = secondRow.locator('td').last().locator('button').last();
  await exportButton.click();
  await expect(page.getByTestId(`added-export-${expectedRowIds[1]}`)).toBeVisible();

  if (includeGenomicFilter) {
    await page.getByTestId('genomic-filter-btn').click();
    await page.getByTestId('gene-variant-option').click();
    await expect(page.getByTestId('add-filter-btn')).not.toBeEnabled();
    const optionsContainer = page.locator('#options-container');
    await optionsContainer.getByLabel(geneValues.results[0]).click();
    await mockApiSuccess(page, '*/**/picsure/query/sync', 200);
    await page.getByTestId('add-filter-btn').click();
  }

  const exportForAnalysisButton = page.locator('button#export-data-button');
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
  await expect(step).toHaveClass(/variant-filled-primary/);
  await expect(page.locator('header.step-header')).toHaveText(headerText);

  // Check that the summary section is rendered if expected
  if (showSummary) {
    await expect(page.locator('div#stats')).toBeVisible();
  } else {
    await expect(page.locator('div#stats')).not.toBeVisible();
  }

  // Check that the next button is rendered with correct text and disabled state
  const nextButton = page.getByTestId(`${nextStepButtonText?.toLowerCase()}-btn`);
  await expect(nextButton).toBeVisible();
  await expect(nextButton).toContainText(nextStepButtonText);
  if (nextStepDisabled) {
    await expect(nextButton).toBeDisabled();
  } else {
    await expect(nextButton).toBeEnabled();
  }
}

test.describe('Export Page', () => {
  test('Empty Export page renders', async ({ page }) => {
    await page.goto('/explorer/export');
    await expect(page).toHaveURL('/explorer/export');
    await expect(page.locator('h1')).toHaveText('Export Data for Research Analysis');
    await expect(page.locator('button.variant-filled-primary')).toHaveText('Learn How');
    await expect(page.getByTestId('back-btn')).toBeVisible();
  });

  test('Export page renders', async ({ page }) => {
    await setupExportPageAndAddFilterAndExport(page);
    await expect(page).toHaveURL('/explorer/export');
  });

  test('Export page renders expected data', async ({ page }) => {
    await setupExportPageAndAddFilterAndExport(page);
    await expect(page).toHaveURL('/explorer/export');
    await expect(page.locator('header.step-header')).toHaveText('Review Cohort Details:');

    // Verify the table body is visible
    const tableBody = page.locator('tbody');
    await expect(tableBody).toBeVisible();

    // Verify first row content (filter) using detailResponseCat
    await expect(page.locator('#row-0-col-0')).toHaveText(detailResponseCat.display);
    await expect(page.locator('#row-0-col-1')).toHaveText(detailResponseCat.description);
    await expect(page.locator('#row-0-col-2')).toHaveText(detailResponseCat.type);

    // Verify second row content (export) using detailResponseCatSameDataset
    await expect(page.locator('#row-1-col-0')).toHaveText(detailResponseCatSameDataset.display);
    await expect(page.locator('#row-1-col-1')).toHaveText(detailResponseCatSameDataset.description);
    await expect(page.locator('#row-1-col-2')).toHaveText(detailResponseCatSameDataset.type);

    // Verify standard identifiers
    for (let i = 0; i < standardIdentifiers.length; i++) {
      const rowIndex = i + 2; // Standard identifiers start at row 2
      await expect(page.locator(`#row-${rowIndex}-col-0`)).toHaveText(standardIdentifiers[i].name);
      await expect(page.locator(`#row-${rowIndex}-col-1`)).toHaveText(
        standardIdentifiers[i].description,
      );
      await expect(page.locator(`#row-${rowIndex}-col-2`)).toHaveText(standardIdentifiers[i].type);
    }
  });

  test('All steps render as expected', async ({ page }) => {
    await setupExportPageAndAddFilterAndExport(page);
    await expect(page).toHaveURL('/explorer/export');
    const nextButton = page.getByTestId('next-btn');

    // Review Cohort Details
    await checkStepRenderedCorrectly(page, 1, 'Review Cohort Details:', false, 'Next', true);
    await nextButton.click();

    // Review and Save Dataset
    await checkStepRenderedCorrectly(page, 2, 'Review and Save Dataset:', true, 'Next', true);
    const csvExportOption = page.getByTestId('csv-export-option');
    const pfbExportOption = page.getByTestId('pfb-export-option');
    await expect(csvExportOption).toBeVisible();
    await expect(pfbExportOption).toBeVisible();
    await expect(csvExportOption).toHaveClass(/variant-ringed-primary/);
    await expect(pfbExportOption).toHaveClass(/variant-ringed-primary/);
    await pfbExportOption.click();
    await expect(csvExportOption).toHaveClass(/variant-ringed-primary/);
    await expect(pfbExportOption).toHaveClass(/variant-filled-primary/);
    await csvExportOption.click();
    await expect(csvExportOption).toHaveClass(/variant-filled-primary/);
    await expect(pfbExportOption).toHaveClass(/variant-ringed-primary/);
    await expect(nextButton).not.toBeDisabled();
    await mockApiSuccess(page, `*/**/picsure/query`, newDatasetResponse);
    await nextButton.click();

    // Save Dataset ID
    await checkStepRenderedCorrectly(page, 3, 'Save Dataset ID:', true, 'Next', true);
    const datasetNameInput = page.locator('input#dataset-name');
    await expect(datasetNameInput).toBeVisible();
    await datasetNameInput.fill('test-dataset');
    await expect(page.locator('div#dataset-id')).toHaveText(newDatasetResponse.picsureResultId);
    await expect(nextButton).not.toBeDisabled();
    await mockApiSuccess(page, `*/**/picsure/dataset/named`, newDatasetResponse);
    await mockApiSuccess(
      page,
      `*/**/picsure/query/${newDatasetResponse.picsureResultId}/status`,
      availableDatasetResponse,
    );
    await mockApiSuccess(page, '*/**/psama/user/me?hasToken', picsureUser);
    await nextButton.click();

    // Start Analysis
    await checkStepRenderedCorrectly(page, 4, 'Start Analysis:', false, 'Done', false);
    const tabGroup = page.getByTestId('tab-group');
    const codeBlock = tabGroup.getByTestId('codeblock');
    await expect(tabGroup).toBeVisible();
    await expect(codeBlock).toBeVisible();
    await expect(codeBlock).toContainText('python');
    const tab = tabGroup.getByTestId('tab').nth(2);
    await expect(tab).toBeVisible();
    await expect(tab).toHaveText('Download');
    await tab.click();
    const downloadButton = page.locator('button').filter({ hasText: 'Download as CSV' });
    await expect(downloadButton).toBeVisible();
    await expect(downloadButton).toBeEnabled();
    const userToken = page.locator('div#user-token');
    await expect(userToken).toBeVisible();
    await expect(userToken.locator('span#account')).toHaveText(picsureUser.email || '');

    const doneButton = page.getByTestId('done-btn');
    await expect(doneButton).toBeVisible();
    await doneButton.click();
    await expect(page).toHaveURL('/explorer');
  });
});
