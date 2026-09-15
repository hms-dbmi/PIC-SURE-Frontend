import { expect, type Page, type Route } from '@playwright/test';
import { test, mockApiSuccess, mockApiConfig } from '../../custom-context';
import {
  facetResultPath,
  facetsResponse,
  detailResponseCat,
  searchResultPath,
  tourSearchResults as mockData,
  conceptsDetailPath,
} from '../../mock-data';
import { userIsLoggedIn } from '../../utils';

test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });

/**
 * driver.js calls the hooks in its config from its own listeners and bare - `onDestroyed &&
 * onDestroyed(...)`, no try/catch - so anything a hook throws surfaces only as an uncaught
 * page error, which nothing here would otherwise fail on.
 *
 * Read what this does and does not cover before relying on it. It does not currently reach
 * the onDestroyed hook at all: on this branch neither ending the tour nor dismissing it with
 * Escape gets as far as driver's destroy(), so the tour's own cleanup - resetSearch(), the
 * search-box reset, driver's focus restore - never runs either. That is tracked with the tour
 * re-anchoring work. This guard is here so that when the tours are re-anchored and those
 * paths run again, a throw inside one of them fails a test instead of passing silently.
 */
function trackPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

test.beforeEach(async ({ page }) => {
  await mockApiConfig(page);
  await mockApiSuccess(page, facetResultPath, facetsResponse);
  await mockApiSuccess(page, '*/**/picsure/dictionary/concepts*', detailResponseCat);
  await mockApiSuccess(page, '*/**/picsure/hpds/auth/v3/query/sync', '9999');
});

test('Explorer tour button opens instruction modal', async ({ page }) => {
  // Given
  await page.goto('/explorer');
  await userIsLoggedIn(page);
  await expect(page.getByTestId('explorer-tour-btn')).toBeVisible();

  // When — retry click because Skeleton's click-outside handler can dismiss the modal
  // on the same pointer event that opened it, so the first click sometimes doesn't stick
  await expect(async () => {
    await page.getByTestId('explorer-tour-btn').click();
    await expect(page.locator('#modal-component')).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 15000 });
});
test('Tour Finishes', async ({ page }) => {
  // Given
  const pageErrors = trackPageErrors(page);
  await page.route(searchResultPath, async (route: Route) => route.fulfill({ json: mockData }));
  await page.route(facetResultPath, async (route: Route) =>
    route.fulfill({ json: facetsResponse }),
  );
  await page.route(`${conceptsDetailPath}/${detailResponseCat.dataset}`, async (route: Route) =>
    route.fulfill({ json: detailResponseCat }),
  );
  await page.goto('/explorer');
  await userIsLoggedIn(page);
  await expect(async () => {
    await page.getByTestId('explorer-tour-btn').click();
    await expect(page.locator('#modal-component')).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 15000 });
  await page.locator('#modal-component').getByRole('button', { name: 'Start Tour' }).click();

  await expect(
    page
      .locator('#driver-popover-content')
      .locator('footer')
      .locator('.driver-popover-progress-text'),
  ).toBeVisible();

  // When - driver.js ignores presses that land during its 200ms step animation, so
  // advance by outcome rather than pressing a fixed number of times on a timer.
  await expect(async () => {
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#driver-popover-content')).not.toBeVisible({ timeout: 500 });
  }).toPass({ timeout: 30000 });

  // Then
  await expect(page.locator('#driver-popover-content')).not.toBeVisible();
  expect(pageErrors).toEqual([]);
});
test('Explorer tour starts from modal', async ({ page }) => {
  // Given
  await page.goto('/explorer');
  await userIsLoggedIn(page);
  await expect(page.getByTestId('explorer-tour-btn')).toBeVisible();
  await expect(async () => {
    await page.getByTestId('explorer-tour-btn').click();
    await expect(page.locator('#modal-component')).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 15000 });

  // When
  await page.locator('#modal-component').getByRole('button', { name: 'Start Tour' }).click();

  // Then
  await expect(page.locator('#driver-popover-content')).toBeVisible({ timeout: 10000 });
});
test('Escape key closes tour', async ({ page }) => {
  // Given
  const pageErrors = trackPageErrors(page);
  await page.goto('/explorer');
  await userIsLoggedIn(page);
  await expect(page.getByTestId('explorer-tour-btn')).toBeVisible();
  // Retry the open — Skeleton's click-outside handler can dismiss the modal on the same pointer event
  await expect(async () => {
    await page.getByTestId('explorer-tour-btn').click();
    await expect(page.locator('#modal-component')).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 15000 });
  await page.locator('#modal-component').getByRole('button', { name: 'Start Tour' }).click();
  await expect(page.locator('#driver-popover-content')).toBeVisible({ timeout: 10000 });

  // When
  await page.keyboard.press('Escape');

  // Then
  await expect(page.locator('#driver-popover-content')).not.toBeVisible();
  expect(pageErrors).toEqual([]);
});
test('EXPLORE_TOUR=false hides the tour button entirely', async ({ page }) => {
  // Given
  await mockApiConfig(page, {
    features: [{ name: 'EXPLORE_TOUR', value: 'false' }],
  });

  // When
  await page.goto('/explorer');
  await userIsLoggedIn(page);

  // Then
  await expect(page.getByTestId('explorer-tour-btn')).not.toBeVisible();
});

test.describe('AUTH_TOUR_NAME', () => {
  test('Without an override, the default NHANES-Auth tour is used', async ({ page }) => {
    // Given
    await page.goto('/explorer');
    await userIsLoggedIn(page);

    // When
    await expect(async () => {
      await page.getByTestId('explorer-tour-btn').click();
      await expect(page.locator('#modal-component')).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 15000 });

    // Then
    await expect(page.getByTestId('modal-wrapper-header')).toContainText('Welcome to PIC-SURE');
  });

  test('A recognized AUTH_TOUR_NAME override swaps in that tour', async ({ page }) => {
    // Given
    await mockApiConfig(page, { settings: [{ name: 'AUTH_TOUR_NAME', value: 'BDC-Auth' }] });
    await page.goto('/explorer');
    await userIsLoggedIn(page);

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

  test('An unrecognized AUTH_TOUR_NAME override falls back to the default NHANES-Auth tour', async ({
    page,
  }) => {
    // Given
    await mockApiConfig(page, { settings: [{ name: 'AUTH_TOUR_NAME', value: 'not-a-real-tour' }] });
    await page.goto('/explorer');
    await userIsLoggedIn(page);

    // When
    await expect(async () => {
      await page.getByTestId('explorer-tour-btn').click();
      await expect(page.locator('#modal-component')).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 15000 });

    // Then
    await expect(page.getByTestId('modal-wrapper-header')).toContainText('Welcome to PIC-SURE');
  });
});
