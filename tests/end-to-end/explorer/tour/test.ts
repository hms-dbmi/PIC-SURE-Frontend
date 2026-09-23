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

test.beforeEach(async ({ page }) => {
  await mockApiConfig(page);
  await mockApiSuccess(page, facetResultPath, facetsResponse);
  await mockApiSuccess(page, '*/**/picsure/dictionary/concepts*', detailResponseCat);
  await mockApiSuccess(page, '*/**/picsure/hpds/auth/v3/query/sync', '9999');
});

const HIERARCHY_AND_EXPORT_FEATURES = [
  { name: 'ENABLE_HIERARCHY', value: 'true' },
  { name: 'ALLOW_EXPORT_ENABLED', value: 'true' },
];

// Tracks the highlighted element, not popover visibility: driver.js falls back to an
// invisible dummy element when a step's selector fails to resolve (undetected before,
// ALS-6141), and separately blips the popover to `display: none` mid-transition - so
// visibility alone can't signal a bad selector or real progress.
async function walkTourAssertingRealHighlights(page: Page) {
  const progressText = page.locator('#driver-popover-content .driver-popover-progress-text');
  await expect(progressText).toBeVisible();

  async function readProgress(): Promise<{ current: number; total: number }> {
    const text = await progressText.textContent();
    const match = text?.match(/(\d+)\s*of\s*(\d+)/);
    if (!match) throw new Error(`Could not parse tour progress from "${text}"`);
    return { current: Number(match[1]), total: Number(match[2]) };
  }

  const seenElementIds = new Set<string | null>();
  const deadline = Date.now() + 45000;
  let { current, total } = await readProgress();

  // driver.js ignores presses that land during its ~200ms step animation, so
  // advance by outcome rather than pressing a fixed number of times on a timer.
  while (current < total) {
    if (Date.now() > deadline) {
      throw new Error(`Tour got stuck at step ${current} of ${total}`);
    }
    seenElementIds.add(
      await page.evaluate(() => document.querySelector('.driver-active-element')?.id ?? null),
    );
    await page.keyboard.press('ArrowRight');
    // Some steps (applyFilterThenNext -> clickFilterOption in ExplorerTour.svelte) advance
    // via an internal 200ms setTimeout rather than immediately, so a shorter wait here risks
    // reading a stale/mid-transition state and pressing again before that timeout fires.
    await page.waitForTimeout(350);
    ({ current, total } = await readProgress());
  }
  seenElementIds.add(
    await page.evaluate(() => document.querySelector('.driver-active-element')?.id ?? null),
  );

  // The last step's button reads "Done", and - unlike every preceding step -
  // ArrowRight does not close the tour here (confirmed empirically; only the
  // button's click handler does), so finish by clicking it directly.
  await page.locator('#driver-popover-content footer button', { hasText: 'Done' }).click();
  await expect(page.locator('#driver-popover-content')).not.toBeVisible({ timeout: 10000 });
  expect(seenElementIds.has('driver-dummy-element')).toBe(false);
}

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
  await mockApiConfig(page, { features: HIERARCHY_AND_EXPORT_FEATURES });
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

  // Then
  await walkTourAssertingRealHighlights(page);
});
test('Tour Finishes for BDC-Auth, with every step highlighting a real element', async ({
  page,
}) => {
  // Given
  await mockApiConfig(page, {
    settings: [{ name: 'AUTH_TOUR_NAME', value: 'BDC-Auth' }],
    features: HIERARCHY_AND_EXPORT_FEATURES,
  });
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

  // Then
  await walkTourAssertingRealHighlights(page);
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
