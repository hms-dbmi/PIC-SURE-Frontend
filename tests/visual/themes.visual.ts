import { expect, type Page } from '@playwright/test';
import { test, mockApiSuccess, mockApiFail, mockApiConfig } from '../end-to-end/custom-context';
import {
  datasets,
  facetsResponse,
  facetResultPath,
  mockDashboard,
  roles,
  connections,
  privileges,
  users,
  searchResults,
  searchResultPath,
  conceptsDetailPath,
  detailResponseCat,
  detailResponseCatSameDataset,
  tourSearchResults,
} from '../support/mock-data';
import { clickNthFilterIcon, getOption } from '../end-to-end/utils';

// Screenshot comparison of the main pages in each theme, for styling changes that must not
// change the look. Baselines are machine-specific and not committed: generate them from the
// base branch with --update-snapshots, then run without it on the change.

const themes = ['picsure', 'bdc', 'aim-ahead'];

const features = [
  { name: 'ALLOW_EXPORT_ENABLED', value: 'true' },
  { name: 'ENABLE_HIERARCHY', value: 'true' },
  { name: 'DASHBOARD', value: 'true' },
  { name: 'DASHBOARD_DRAWER', value: 'true' },
  { name: 'GENOMIC_FILTERS', value: 'true' },
];

interface Shot {
  name: string;
  path: string;
  user?: 'generalUser' | 'superUser';
  features?: { name: string; value: string }[];
  mock?: (page: Page) => Promise<unknown>;
  ready?: (page: Page) => Promise<unknown>;
}

async function addTwoFilters(page: Page) {
  const add = async (row: number, detail: { dataset: string }) => {
    await mockApiSuccess(page, `${conceptsDetailPath}/${detail.dataset}`, detail);
    await clickNthFilterIcon(page, row);
    await (await getOption(page)).click();
    await page.getByTestId('filter-add').click();
  };
  await add(0, detailResponseCat);
  await add(1, detailResponseCatSameDataset);
  await expect(page.locator('#results-panel')).toBeVisible();
}

const searchShot = (name: string, act: (page: Page) => Promise<unknown>): Shot => ({
  name,
  path: '/explorer?search=somedata',
  user: 'generalUser',
  mock: async (page) => {
    await mockApiSuccess(page, searchResultPath, searchResults);
    await mockApiSuccess(
      page,
      `${conceptsDetailPath}/${detailResponseCat.dataset}`,
      detailResponseCat,
    );
  },
  ready: async (page) => {
    const actions = page.locator('table tbody tr').first().locator('td').last().locator('button');
    await expect(actions.first()).toBeVisible();
    await act(page);
  },
});

const datasetPath = '*/**/picsure/operations/dataset/named';

const shots: Shot[] = [
  { name: 'login', path: '/login' },
  {
    name: 'terms',
    path: '/login',
    features: [{ name: 'ENABLE_TOS', value: 'true' }],
    mock: (page) =>
      page.route('*/**/psama/tos/latest', (route) =>
        route.fulfill({
          body: '<h1>Terms</h1><p class="subtitle">Updated</p><h2>Use</h2><ul><li>One</li></ul><ol><li>Two</li></ol><div>Text with <a href="#">a link</a>.</div>',
        }),
      ),
    ready: async (page) => {
      await page.getByTestId('app-footer-terms-trigger').click();
      await expect(page.locator('#terms-of-service')).toBeVisible();
    },
  },
  {
    name: 'tour',
    path: '/explorer',
    user: 'generalUser',
    mock: async (page) => {
      await mockApiSuccess(page, searchResultPath, tourSearchResults);
      await mockApiSuccess(page, '*/**/picsure/dictionary/concepts*', detailResponseCat);
    },
    ready: async (page) => {
      await page.getByTestId('explorer-tour-start').click();
      await page.getByRole('dialog').getByRole('button', { name: 'Start Tour' }).click();
      await expect(page.locator('#driver-popover-content')).toBeVisible();
    },
  },
  { name: 'not-found', path: '/no-such-page', user: 'generalUser' },
  { name: 'landing', path: '/', user: 'generalUser' },
  {
    name: 'explorer-search',
    path: '/explorer?search=somedata',
    user: 'generalUser',
    mock: (page) => mockApiSuccess(page, searchResultPath, searchResults),
    ready: (page) => expect(page.locator('table tbody tr').first()).toBeVisible(),
  },
  searchShot('explorer-row-info', (page) =>
    page.locator('table tbody tr').first().locator('td').last().locator('button').first().click(),
  ),
  searchShot('explorer-add-filter', async (page) => {
    await page
      .locator('table tbody tr')
      .first()
      .locator('td')
      .last()
      .locator('button')
      .nth(1)
      .click();
    await expect(page.locator('#results-sidebar')).toBeVisible();
  }),
  {
    name: 'explorer-filters',
    path: '/explorer?search=somedata',
    user: 'generalUser',
    mock: (page) => mockApiSuccess(page, searchResultPath, searchResults),
    ready: addTwoFilters,
  },
  {
    name: 'explorer-advanced',
    path: '/explorer?search=somedata',
    user: 'generalUser',
    mock: (page) => mockApiSuccess(page, searchResultPath, searchResults),
    ready: async (page) => {
      await addTwoFilters(page);
      await page.getByTestId('results-advanced-filtering-open').click();
      await expect(page.getByTestId('filter-root')).toBeVisible();
    },
  },
  {
    name: 'explorer-search-error',
    path: '/explorer?search=somedata',
    user: 'generalUser',
    mock: (page) => mockApiFail(page, searchResultPath, 'accessdenied'),
  },
  { name: 'explorer-genome-filter', path: '/explorer/genome-filter', user: 'generalUser' },
  {
    name: 'dataset',
    path: '/dataset',
    user: 'generalUser',
    mock: (page) => mockApiSuccess(page, datasetPath, datasets),
    ready: (page) => expect(page.locator('table tbody tr').first()).toBeVisible(),
  },
  {
    name: 'dataset-error',
    path: '/dataset',
    user: 'generalUser',
    mock: (page) => mockApiFail(page, datasetPath, 'accessdenied'),
  },
  { name: 'api', path: '/api', user: 'generalUser' },
  {
    name: 'api-workflow',
    path: '/api',
    user: 'generalUser',
    ready: (page) =>
      page
        .getByTestId('api-workflow-http')
        .getByRole('heading', { level: 3 })
        .getByRole('button')
        .click(),
  },
  { name: 'help', path: '/help', user: 'generalUser' },
  {
    name: 'dashboard',
    path: '/dashboard',
    user: 'generalUser',
    mock: (page) => mockApiSuccess(page, '*/**/picsure/dictionary/dashboard', mockDashboard),
    ready: (page) => expect(page.locator('table tbody tr').first()).toBeVisible(),
  },
  {
    name: 'admin-users',
    path: '/admin/users',
    user: 'superUser',
    ready: (page) => expect(page.locator('table tbody tr').first()).toBeVisible(),
  },
  { name: 'admin-user-new', path: '/admin/users/new', user: 'superUser' },
  { name: 'admin-configuration', path: '/admin/configuration', user: 'superUser' },
  { name: 'admin-banners', path: '/admin/configuration?tab=banners', user: 'superUser' },
  { name: 'admin-branding', path: '/admin/configuration?tab=branding', user: 'superUser' },
  { name: 'admin-role-new', path: '/admin/configuration/role/new', user: 'superUser' },
  {
    name: 'admin-role-new-checked',
    path: '/admin/configuration/role/new',
    user: 'superUser',
    ready: (page) => page.locator('input[type=checkbox]').first().check(),
  },
  { name: 'admin-user', path: `/admin/users/${users[0].uuid}`, user: 'superUser' },
  {
    name: 'admin-connection-new',
    path: '/admin/configuration/connection/new',
    user: 'superUser',
  },
];

async function mockAdmin(page: Page) {
  await mockApiSuccess(page, '*/**/psama/user', users);
  await mockApiSuccess(page, `*/**/psama/user/${users[0].uuid}`, users[0]);
  await mockApiSuccess(page, '*/**/psama/role', roles);
  await mockApiSuccess(page, '*/**/psama/connection', connections);
  await mockApiSuccess(page, '*/**/psama/privilege', privileges);
  for (const privilege of privileges) {
    await mockApiSuccess(page, `*/**/psama/privilege/${privilege.uuid}`, privilege);
  }
}

for (const theme of themes) {
  test.describe(theme, () => {
    for (const shot of shots) {
      test.describe(() => {
        if (shot.user) test.use({ storageState: `tests/end-to-end/.auth/${shot.user}.json` });
        else test.use({ storageState: 'tests/end-to-end/.auth/unauthenticated.json' });

        test(shot.name, async ({ page }) => {
          await mockApiConfig(page, {
            features: [...features, ...(shot.features ?? [])],
            branding: [{ name: 'THEME', value: theme }],
          });
          // Answer every backend read the shot doesn't mock with an empty body; the routes
          // registered after this one take precedence.
          await page.route(/\/(picsure|psama)\//, (route) => route.fulfill({ json: [] }));
          await mockApiSuccess(page, facetResultPath, facetsResponse);
          await mockApiSuccess(page, '*/**/picsure/hpds/*/query/sync', 9999);
          if (shot.user === 'superUser') await mockAdmin(page);
          await shot.mock?.(page);

          await page.goto(shot.path);
          await shot.ready?.(page);
          await page.waitForLoadState('networkidle');
          // Let transitions finish; infinite animations never do, and the screenshot stops them.
          // A transition cancelled mid-way (a hover leaving a button) rejects `finished` with an
          // AbortError; it's over either way.
          await page.evaluate(() =>
            Promise.all(
              document
                .getAnimations()
                .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
                .map((animation) => animation.finished.catch(() => undefined)),
            ),
          );
          // Clicks can leave scroll containers part-way along, by a different amount each run.
          await page.evaluate(() => {
            for (const element of document.querySelectorAll('*')) element.scrollTo(0, 0);
          });
          await expect(page).toHaveScreenshot(`${theme}-${shot.name}.png`, {
            fullPage: true,
            animations: 'disabled',
            caret: 'hide',
          });
        });
      });
    }
  });
}
