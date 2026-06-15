import { expect, type Route } from '@playwright/test';
import { test, mockApiSuccess } from '../../custom-context';
import {
  conceptsDetailPath,
  detailResponseCat,
  detailResponseCat2,
  facetResultPath,
  facetsResponse,
  searchResults as mockData,
  searchResultPath,
} from '../../mock-data';
import { getOption } from '../../utils';

const countResultPath = '*/**/picsure/v3/query/sync';
const distributionsPath = '*/**/picsure/proxy/visualization/distributions';

async function addFilterFromRow(page: import('@playwright/test').Page, rowIndex: number) {
  await page.locator(`#row-${rowIndex} button[title=Filter]`).click();
  const firstItem = await getOption(page);
  await firstItem.click();
  await page.getByTestId('add-filter').click();
}

test.describe('Variable Distributions visualizations', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });

  test.beforeEach(async ({ page }) => {
    await mockApiSuccess(page, '*/**/api/config', {
      features: [{ name: 'DIST_EXPLORER', value: 'true' }],
      settings: [],
    });
    await mockApiSuccess(page, searchResultPath, mockData);
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, countResultPath, '9999');
    await page.route(`${conceptsDetailPath}/${detailResponseCat.dataset}`, async (route: Route) => {
      const requestBody = route.request().postData() || '';
      if (requestBody.includes(detailResponseCat2.conceptPath)) {
        await route.fulfill({ json: detailResponseCat2 });
        return;
      }
      await route.fulfill({ json: detailResponseCat });
    });
  });

  test('shows an insufficient data warning for empty returned charts and graphs charts with data', async ({
    page,
  }) => {
    await mockApiSuccess(page, distributionsPath, {
      categoricalData: [
        {
          title: detailResponseCat.display,
          conceptPath: detailResponseCat.conceptPath,
          categoricalMap: {},
          obfuscated: false,
          xaxisName: detailResponseCat.display,
          yaxisName: 'Participants',
        },
        {
          title: detailResponseCat2.display,
          conceptPath: detailResponseCat2.conceptPath,
          categoricalMap: { Yes: 12, No: 4 },
          obfuscated: false,
          xaxisName: detailResponseCat2.display,
          yaxisName: 'Participants',
        },
      ],
      continuousData: [],
    });

    await page.goto('/explorer?search=somedata');
    await addFilterFromRow(page, 0);
    await addFilterFromRow(page, 2);
    await page.getByTestId('distributions-btn').click();

    const warning = page.getByTestId('excluded-visualizations-warning');
    await expect(warning).toBeVisible();
    await expect(warning).toContainText(
      'Some variables were excluded from visualization because there was insufficient participant data for the selected query.',
    );
    await expect(warning).toContainText(`TDS - ${detailResponseCat.display}`);
    await expect(
      page.locator('[aria-label="Column chart showing the visualization of Any tests today?"]'),
    ).toBeVisible();
    await expect(
      page.locator(
        '[aria-label="Column chart showing the visualization of Any family with heart attack?"]',
      ),
    ).not.toBeVisible();
  });

  test('does not show the insufficient data warning when all returned charts have data', async ({
    page,
  }) => {
    await mockApiSuccess(page, distributionsPath, {
      categoricalData: [
        {
          title: detailResponseCat.display,
          conceptPath: detailResponseCat.conceptPath,
          categoricalMap: { Yes: 1 },
          obfuscated: false,
          xaxisName: detailResponseCat.display,
          yaxisName: 'Participants',
        },
      ],
      continuousData: [],
    });

    await page.goto('/explorer?search=somedata');
    await addFilterFromRow(page, 0);
    await page.getByTestId('distributions-btn').click();

    await expect(page.getByTestId('excluded-visualizations-warning')).not.toBeVisible();
    await expect(
      page.locator(
        '[aria-label="Column chart showing the visualization of Any family with heart attack?"]',
      ),
    ).toBeVisible();
  });
});
