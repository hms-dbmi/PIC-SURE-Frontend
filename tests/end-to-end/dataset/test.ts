import { expect } from '@playwright/test';
import { test, mockApiSuccess, mockApiFail } from '../custom-context';
import { datasets as mockData } from '../mock-data';

test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });

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
});
test.describe('dataset/[uuid]', () => {
  test('Dataset values present on page', async ({ page }) => {
    // Given
    await mockApiSuccess(page, `*/**/picsure/dataset/named/${mockData[0].uuid}`, mockData[0]);
    await page.goto(`/dataset/${mockData[0].uuid}`);

    // Then
    await expect(page.getByTestId('dataset-summary-name')).toBeVisible();
    await expect(page.getByTestId('dataset-summary-uuid')).toBeVisible();
    await expect(page.getByTestId('dataset-summary-filters')).toBeVisible();
    await expect(page.getByTestId('dataset-summary-variables')).toBeVisible();
  });
  test('Error message on api error', async ({ page }) => {
    // Given
    await mockApiFail(page, `*/**/picsure/dataset/named/${mockData[0].uuid}`, 'accessdenied');
    await page.goto(`/dataset/${mockData[0].uuid}`);

    // Then
    await expect(page.getByTestId('error-alert')).toBeVisible();
  });
});
