import { expect } from '@playwright/test';
import { test, mockApiSuccess } from '../../custom-context';
import {
  facetResultPath,
  facetsResponse,
  searchResultPath,
  searchResults as mockData,
  crossCountSyncResponseInital,
} from '../../mock-data';

const distributionsPath = '*/**/picsure/proxy/visualization/distributions';
const openCountResultPath = '*/**/picsure/query/sync';

// Visualization resource response in the {count, display, variance} wire shape:
// exact values carry a null variance, randomized values carry the configured
// variance, and below-threshold values are encoded as count 0 / variance threshold-1.
const distributionsResponse = {
  categoricalData: [
    {
      conceptPath: '\\demographics\\race\\',
      title: 'demographics: race',
      continuous: false,
      categoricalMap: {
        White: { count: 45000, display: '45000 ±3', variance: 3 },
        Black: { count: 12000, display: '12000', variance: null },
        Other: { count: 0, display: '< 10', variance: 9 },
      },
      obfuscated: true,
      xaxisName: 'race',
      yaxisName: 'Number of Participants',
      chartWidth: 500,
      chartHeight: 600,
    },
  ],
  continuousData: [
    {
      conceptPath: '\\measurements\\bmi\\',
      title: 'measurements: bmi',
      continuous: true,
      continuousMap: {
        '18.0 - 24.0': { count: 600, display: '600 ±3', variance: 3 },
        '24.0 - 30.0': { count: 0, display: '< 10', variance: 9 },
        '30.0 +': { count: 150, display: '150 ±3', variance: 3 },
      },
      obfuscated: true,
      xaxisName: 'bmi',
      yaxisName: 'Number of Participants',
      chartWidth: 500,
      chartHeight: 600,
    },
  ],
};

test.use({ storageState: 'tests/end-to-end/.auth/unauthenticated.json' });

test.describe('Discover distributions', () => {
  test('renders charts with backend-provided count, display, and variance', async ({ page }) => {
    // Given: the visualization endpoint returns the new wire shape
    // OPEN is required for unauthenticated access; DISCOVER keeps /discover/*
    // from being redirected to /explorer by the (public) layout guard.
    await mockApiSuccess(page, '*/**/api/config', {
      features: [
        { name: 'OPEN', value: 'true' },
        { name: 'DISCOVER', value: 'true' },
      ],
      settings: [],
    });
    await mockApiSuccess(page, searchResultPath, mockData);
    await mockApiSuccess(page, facetResultPath, facetsResponse);
    await mockApiSuccess(page, '*/**/picsure/search/2', crossCountSyncResponseInital);
    await mockApiSuccess(page, openCountResultPath, '9999');
    await mockApiSuccess(page, distributionsPath, distributionsResponse);

    // When: opening the distributions page
    await page.goto('/discover/distributions');

    // Then: one categorical and one continuous plot render
    const visualizations = page.locator('#visualizations');
    await expect(page.locator('#plot-0')).toBeVisible();
    await expect(page.locator('#plot-1')).toBeVisible();

    // And the bar labels come straight from the backend display strings
    await expect(visualizations).toContainText('< 10');
    await expect(visualizations).toContainText('45000 ±3');
    await expect(visualizations).toContainText('12000');
    await expect(visualizations).toContainText('600 ±3');
  });
});
