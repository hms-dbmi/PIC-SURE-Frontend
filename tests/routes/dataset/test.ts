import { expect, type Route } from '@playwright/test';
import { test } from '../../custom-context';
import { datasets as mockData } from '../../mock-data';

test.describe('dataset', () => {
  test('Shows active datasets table', async ({ page }) => {
    // Given
    await page.route('*/**/picsure/dataset/named', async (route: Route) =>
      route.fulfill({ json: mockData })
    );
    await page.goto('/dataset');

    const responsePromise = page.waitForResponse((resp) =>
      resp.url().includes('picsure/dataset/named')
    );
    await responsePromise;

    // Then
    await expect(page.getByText('Active Datasets', { exact: true })).toBeVisible();
    await expect(page.getByText(mockData[0].query.uuid, { exact: true })).toBeVisible();
  });
  test('Should not show archived datasets table on page load', async ({ page }) => {
    // Given
    await page.route('*/**/picsure/dataset/named', (route: Route) =>
      route.fulfill({ json: mockData })
    );
    await page.goto('/dataset');

    // Then
    await expect(page.getByText('Archived Datasets', { exact: true })).not.toBeVisible();
    await expect(page.getByText(mockData[1].query.uuid, { exact: true })).not.toBeVisible();
  });
  test('Shows archived datasets on archive toggle button press', async ({ page }) => {
    // Given
    await page.route('*/**/picsure/dataset/named', (route: Route) =>
      route.fulfill({ json: mockData })
    );
    await page.goto('/dataset');

    // When
    const toggleButton = page.getByTestId('dataset-toggle-archive');
    await toggleButton.click();

    // Then
    await expect(page.getByText('Archived Datasets', { exact: true })).toBeVisible();
    await expect(page.getByText(mockData[1].query.uuid, { exact: true })).toBeVisible();
  });
  test('Archive button press moves item to archived', async ({ page }) => {
    // Given
    await page.route('*/**/picsure/dataset/named', (route: Route) =>
      route.fulfill({ json: mockData })
    );
    await page.route(`*/**/picsure/dataset/named/${mockData[0].uuid}`, (route: Route) =>
      route.fulfill({
        json: {
          ...mockData[0],
          archived: true
        }
      })
    );
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
    await page.route('*/**/picsure/dataset/named', (route: Route) =>
      route.fulfill({ json: mockData })
    );
    await page.route(`*/**/picsure/dataset/named/${mockData[1].uuid}`, (route: Route) =>
      route.fulfill({
        json: {
          ...mockData[1],
          archived: false
        }
      })
    );
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
  test('View button should route to view page', async ({ page }) => {
    // Given
    await page.route('*/**/picsure/dataset/named', (route: Route) =>
      route.fulfill({ json: mockData })
    );
    await page.goto('/dataset');

    // When
    const viewButton = page.getByTestId(`dataset-action-view-${mockData[0].uuid}`);
    await viewButton.click();

    // Then
    await page.waitForURL(`**/dataset/${mockData[0].uuid}`);
    await expect(page.url()).toContain(`/dataset/${mockData[0].uuid}`);
  });
  test('Error message on api error', async ({ page }) => {
    // Given
    await page.route('*/**/picsure/dataset/named', (route: Route) => route.abort('accessdenied'));
    await page.goto('/dataset');

    // Then
    await expect(page.getByTestId('error-alert')).toBeVisible();
  });
});
test.describe('dataset/[uuid]', () => {
  test('Dataset values present on page', async ({ page }) => {
    // Given
    await page.route(`*/**/picsure/dataset/named/${mockData[0].uuid}`, (route: Route) =>
      route.fulfill({ json: mockData[0] })
    );
    await page.goto(`/dataset/${mockData[0].uuid}`);

    // Then
    await expect(page.getByTestId('dataset-summary-name')).toBeVisible();
    await expect(page.getByTestId('dataset-summary-uuid')).toBeVisible();
    await expect(page.getByTestId('dataset-summary-filters')).toBeVisible();
    await expect(page.getByTestId('dataset-summary-variables')).toBeVisible();
  });
  test('Error message on api error', async ({ page }) => {
    // Given
    await page.route(`*/**/picsure/dataset/named/${mockData[0].uuid}`, (route: Route) =>
      route.abort('accessdenied')
    );
    await page.goto(`/dataset/${mockData[0].uuid}`);

    // Then
    await expect(page.getByTestId('error-alert')).toBeVisible();
  });
});
