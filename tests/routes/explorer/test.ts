import { expect, type Route } from '@playwright/test';
import { test } from '../../custom-context';
import { searchResults as mockData, searchResultPath } from '../../mock-data';
import { branding } from '../../../src/lib/configuration';

const firstId = 'tag-dataset-nhanes';
const secondId = 'tag-dataset-1000_genomes';

test.describe('explorer', () => {
  test.beforeEach(async ({ context }) => {
    await context.route(searchResultPath, async (route: Route) =>
      route.fulfill({ json: mockData }),
    );
  });
  test('Has datatable, filters, and searchbar', async ({ page }) => {
    // Given
    await page.goto('/explorer');

    // Then
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('#search-bar')).toBeVisible();
    await expect(page.locator('#search-tags')).toBeVisible();
  });
  test('Error message on api error', async ({ page }) => {
    // Given
    await page.route(searchResultPath, (route: Route) => route.abort('accessdenied'));
    await page.goto('/explorer?search=somedata');

    // Then
    await expect(page.getByTestId('error-alert')).toBeVisible();
  });
  test.describe('#search-tags', () => {
    test('Tag toggles included icon on', async ({ page }) => {
      // Given
      await page.goto('/explorer?search=somedata');
      const tag = page.locator(`#${firstId}-include`);
      await expect(tag).toBeVisible();

      //When
      await tag.click(); // to Included state

      // Then
      await expect(tag).toHaveAttribute('aria-checked', 'true');
    });
    test('Tag toggles included icon off', async ({ page }) => {
      // Given
      await page.goto('/explorer?search=somedata');
      const tag = page.locator(`#${firstId}-include`);
      await tag.click(); // to Included state
      await expect(tag).toBeVisible();

      //When
      await tag.click(); // to Default state

      // Then
      await expect(tag).toHaveAttribute('aria-checked', 'false');
    });
    test('Tag toggles excluded icon on', async ({ page }) => {
      // Given
      await page.goto('/explorer?search=somedata');
      const tag = page.locator(`#${firstId}-exclude`);
      await expect(tag).toBeVisible();

      //When
      await tag.click(); // to Excluded state

      // Then
      await expect(tag).toHaveAttribute('aria-checked', 'true');
    });
    test('Tag toggles excluded icon off', async ({ page }) => {
      // Given
      await page.goto('/explorer?search=somedata');
      const tag = page.locator(`#${firstId}-exclude`);
      await tag.click(); // to Excluded state
      await expect(tag).toBeVisible();

      //When
      await tag.click(); // to Default state

      // Then
      await expect(tag).toHaveAttribute('aria-checked', 'false');
    });
    test('Tag toggles excluded icon off and included icon on', async ({ page }) => {
      // Given
      await page.goto('/explorer?search=somedata');
      const excludeTag = page.locator(`#${firstId}-exclude`);
      await excludeTag.click(); // to Excluded state
      await expect(excludeTag).toHaveAttribute('aria-checked', 'true');

      //When
      const includeTag = page.locator(`#${firstId}-include`);
      await includeTag.click(); // to Included state

      // Then
      await expect(includeTag).toHaveAttribute('aria-checked', 'true');
      await expect(excludeTag).toHaveAttribute('aria-checked', 'false');
    });
    test('Tag toggles included icon off and excluded icon on', async ({ page }) => {
      // Given
      await page.goto('/explorer?search=somedata');
      const includeTag = page.locator(`#${firstId}-include`);
      await includeTag.click(); // to Included state
      await expect(includeTag).toHaveAttribute('aria-checked', 'true');

      //When
      const excludeTag = page.locator(`#${firstId}-exclude`);
      await excludeTag.click(); // to Excluded state

      // Then
      await expect(excludeTag).toHaveAttribute('aria-checked', 'true');
      await expect(includeTag).toHaveAttribute('aria-checked', 'false');
    });
  });
  test.describe('#search-tags keyboard navigation', () => {
    test('Can tab between checkbox groups', async ({ page }) => {
      // Given
      await page.goto('/explorer?search=somedata');
      const firstBox = page.locator(`#${firstId}-include`);
      await firstBox.focus();

      // When
      await page.keyboard.press('Tab');

      // Then
      await expect(page.locator(`#${firstId}-include`)).not.toBeFocused();
      await expect(page.locator(`#${secondId}-include`)).toBeFocused();
    });
    test('Gives visual indicator of focus to parent container', async ({ page }) => {
      // Given
      await page.goto('/explorer?search=somedata');
      const firstBox = page.locator(`#${firstId}-include`);
      await firstBox.focus();

      // When
      await page.keyboard.press('Tab');

      // Then
      await expect(page.getByTestId(secondId)).toHaveClass(/key-focus/);
    });
    test('Can select Include checkbox with + key', async ({ page }) => {
      // Given
      await page.goto('/explorer?search=somedata');
      const firstBox = page.locator(`#${firstId}-include`);
      await firstBox.focus();
      await page.keyboard.press('Tab');

      // When
      await page.keyboard.press('+');

      // Then
      await expect(page.locator(`#${secondId}-include`)).toHaveAttribute('aria-checked', 'true');
    });
    test('Can select Exclude checkbox with - key', async ({ page }) => {
      // Given
      await page.goto('/explorer?search=somedata');
      const firstBox = page.locator(`#${firstId}-include`);
      await firstBox.focus();
      await page.keyboard.press('Tab');

      // When
      await page.keyboard.press('-');

      // Then
      await expect(page.locator(`#${secondId}-exclude`)).toHaveAttribute('aria-checked', 'true');
    });
    test('Can move between checkboxes with left arrow key', async ({ page }) => {
      // Given
      await page.goto('/explorer?search=somedata');
      const firstBox = page.locator(`#${firstId}-include`);
      await firstBox.focus();
      await page.keyboard.press('Tab');

      // When
      await page.keyboard.press('ArrowRight');

      // Then
      await expect(page.locator(`#${secondId}-exclude`)).toBeFocused();
    });
    test('Can move between checkboxes with right arrow key', async ({ page }) => {
      // Given
      await page.goto('/explorer?search=somedata');
      const firstBox = page.locator(`#${firstId}-include`);
      await firstBox.focus();
      await page.keyboard.press('Tab');

      // When
      await page.keyboard.press('ArrowLeft');

      // Then
      await expect(page.locator(`#${secondId}-exclude`)).toBeFocused();
    });
    test('Space key checks checkbox', async ({ page }) => {
      // Given
      await page.goto('/explorer?search=somedata');
      const firstBox = page.locator(`#${firstId}-include`);
      await firstBox.focus();
      await page.keyboard.press('Tab');

      // When
      await page.keyboard.press(' ');

      // Then
      await expect(page.locator(`#${secondId}-include`)).toHaveAttribute('aria-checked', 'true');
    });
    test('Enter key checks checkbox', async ({ page }) => {
      // Given
      await page.goto('/explorer?search=somedata');
      const firstBox = page.locator(`#${firstId}-include`);
      await firstBox.focus();
      await page.keyboard.press('Tab');

      // When
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('Enter');

      // Then
      await expect(page.locator(`#${secondId}-exclude`)).toHaveAttribute('aria-checked', 'true');
    });
  });

  //Results
  test('Result panel bar and button shows', async ({ page }) => {
    // Given
    await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
    await page.goto('/explorer?search=somedata');

    // Then
    await expect(page.locator('#side-panel-bar')).toBeVisible();
    await expect(page.locator('#results-panel-toggle')).toBeVisible();
  });
  test('Result toggle button opens and closes the results panel', async ({ page }) => {
    // Given
    await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
    await page.goto('/explorer?search=somedata');

    //When
    await page.locator('#results-panel-toggle').click();

    // Then
    await expect(page.locator('#results-panel')).toBeVisible();

    //When
    await page.locator('#results-panel-toggle').click();

    // Then
    await expect(page.locator('#results-panel')).not.toBeVisible();
  });
  test('Result panel shows 0 results on an error', async ({ page }) => {
    // Given
    await page.goto('/explorer?search=somedata');
    await page.locator('#results-panel-toggle').click();

    // Then
    await expect(page.locator('#result-count')).toBeVisible();
    await expect(page.locator('#result-count')).toHaveText('0');
  });
  test('Toast shows on query error', async ({ page }) => {
    // Given
    await page.goto('/explorer?search=somedata');
    await page.locator('#results-panel-toggle').click();

    // Then
    let toast = page.getByTestId('toast');
    await expect(toast).toBeVisible();
    expect(toast.getByText(branding.explorePage.queryErrorText)).toBeVisible();
  });
  test('Result panel shows the correct number of results', async ({ page }) => {
    // Given
    await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
    await page.route('*/**/picsure/query/sync', async (route: Route) => route.fulfill({ body: '9999' }));
    await page.goto('/explorer?search=somedata');
    await page.locator('#results-panel-toggle').click();

    // Then
    await expect(page.locator('#result-count')).toBeVisible();
    await expect(page.locator('#result-count')).not.toHaveText('0');
  });
  test('Result panel shows no filters added when there are no filters', async ({ page }) => {
    // Given
    await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
    await page.route('*/**/picsure/query/sync', async (route: Route) => route.fulfill({ body: '9999' }));
    await page.goto('/explorer?search=somedata');
    await page.locator('#results-panel-toggle').click();

    // Then
    await expect(page.getByText('No filters added')).toBeVisible();
  });
  test('Export button hidden when no filters or exports are added', async ({ page }) => {
    // Given
    await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
    await page.route('*/**/picsure/query/sync', async (route: Route) => route.fulfill({ body: '9999' }));
    await page.goto('/explorer?search=somedata');
    await page.locator('#results-panel-toggle').click();

    // Then
    await expect(page.getByText('No filters added')).toBeVisible();
    await expect(page.locator('#export-data-button')).not.toBeVisible();
  });
  test('Export button hidden when count is 0', async ({ page }) => {
    // Given
    await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
    await page.route('*/**/picsure/query/sync', async (route: Route) => route.fulfill({ body: '0' }));
    await page.goto('/explorer?search=somedata');
    await page.locator('#results-panel-toggle').click();

    // add filters

    // Then
    await expect(page.locator('#export-data-button')).not.toBeVisible();
  });
  // test('Export button shows when filters are added', async ({ page }) => {
  //   // Given
  //   await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
  //   await page.route('*/**/picsure/query/sync', async (route: Route) => route.fulfill({ body: '9999' }));
  //   await page.goto('/explorer?search=somedata');
  //   await page.locator('#results-panel-toggle').click();
    
  //   // Then
  //   await expect(page.getByText('No filters added')).not.toBeVisible();
  //   await expect(page.locator('#export-data-button')).toBeVisible();
  // });
});
