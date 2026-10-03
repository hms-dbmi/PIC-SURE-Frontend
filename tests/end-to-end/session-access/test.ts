import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { mockApiConfig } from '../custom-context';
import {
  mockToken,
  picsureUser,
  mockConsents,
  searchResults,
  facetsResponse,
  mockDashboard,
} from '../mock-data';

async function mockSession(context: BrowserContext) {
  await mockApiConfig(context, {
    features: [
      { name: 'OPEN', value: 'true' },
      { name: 'DISCOVER', value: 'true' },
      { name: 'DASHBOARD', value: 'true' },
    ],
  });
  await context.addInitScript(() => {
    sessionStorage.setItem('type', 'AUTH0');
    sessionStorage.setItem('redirect', '/');
  });
  await context.route('**/api/v1/log', (route) => route.fulfill({ status: 202, json: {} }));
  await context.route('**/psama/authentication/**', (route) =>
    route.fulfill({ json: picsureUser }),
  );
  await context.route('**/psama/user/me', (route) => route.fulfill({ json: picsureUser }));
  await context.route('**/psama/user/me/consents', (route) =>
    route.fulfill({ json: { consents: mockConsents } }),
  );
  await context.route('**/picsure/dictionary/concepts?**', (route) =>
    route.fulfill({ json: searchResults }),
  );
  await context.route('**/picsure/dictionary/facets', (route) =>
    route.fulfill({ json: facetsResponse }),
  );
  await context.route('**/picsure/dictionary/dashboard', (route) =>
    route.fulfill({ json: mockDashboard }),
  );
  await context.route('**/picsure/hpds/auth/v3/query/sync', (route) => route.fulfill({ json: 88 }));
  await context.route('**/picsure/hpds/open/v3/query/sync', (route) =>
    route.fulfill({ json: { '\\_studies_consents\\': 100 } }),
  );
}

async function login(page: Page) {
  await page.goto(`/login/loading/#access_token=${mockToken}&token_type=Bearer&state=test`);
  await expect(page).toHaveURL('http://localhost:4173/');
  await expect(page.getByTestId('value-auth-dict:concepts-Variables')).toHaveText(
    searchResults.totalElements.toLocaleString(),
  );
}

async function expectStats(page: Page) {
  await expect(page.getByTestId('value-auth-dict:concepts-Variables')).toHaveText(
    searchResults.totalElements.toLocaleString(),
  );
  const datasets = facetsResponse.find((category) => category.name === 'dataset_id')!;
  await expect(page.getByTestId('value-auth-dict:facets:dataset_id-Data Sources')).toHaveText(
    datasets.facets.filter((facet) => facet.count > 0).length.toLocaleString(),
  );
  await expect(page.getByTestId('toast-root')).not.toBeVisible();
}

test('restores access in a new tab after the login tab closes, and after reload', async ({
  browser,
}) => {
  // Use a raw context: the standard fixture deliberately injects a stored user into every tab.
  const context = await browser.newContext({ baseURL: 'http://localhost:4173' });
  try {
    await mockSession(context);
    const original = await context.newPage();
    await login(original);
    const fresh = await context.newPage();
    await original.close();
    let consents = 0;
    const authRequests: string[][] = [];
    context.on('request', (request) => {
      if (request.url().endsWith('/psama/user/me/consents')) consents++;
      if (
        request.url().includes('/dictionary/') &&
        request.method() === 'POST' &&
        request.headers().authorization
      ) {
        authRequests.push(request.postDataJSON().consents);
      }
    });
    await fresh.goto('/');
    await expectStats(fresh);
    expect(consents).toBe(1);
    expect(authRequests).toHaveLength(2);
    expect(
      authRequests.every(
        (list) => JSON.stringify(list) === JSON.stringify(mockConsents['\\_consents\\']),
      ),
    ).toBe(true);
    await fresh.reload();
    await expectStats(fresh);
    expect(consents).toBe(2);
  } finally {
    await context.close();
  }
});

for (const path of ['/explorer?search=age', '/dashboard']) {
  test(`restores access when a fresh tab enters ${path} directly`, async ({ browser }) => {
    const context = await browser.newContext({ baseURL: 'http://localhost:4173' });
    try {
      await mockSession(context);
      const original = await context.newPage();
      await login(original);
      const fresh = await context.newPage();
      await original.close();
      let consentRequests = 0;
      context.on('request', (request) => {
        if (request.url().endsWith('/psama/user/me/consents')) consentRequests++;
      });
      await fresh.goto(path);
      if (path.startsWith('/explorer')) {
        await expect(fresh.locator('#search-container tbody tr').first()).toBeVisible();
      } else {
        await expect(fresh.getByRole('cell', { name: 'A', exact: true })).toBeVisible();
      }
      await expect(fresh.getByTestId('toast-root')).not.toBeVisible();
      await expect.poll(() => consentRequests).toBe(1);
    } finally {
      await context.close();
    }
  });
}

test('retries failed access and statistics without logging out', async ({ browser }) => {
  const context = await browser.newContext({ baseURL: 'http://localhost:4173' });
  try {
    await mockSession(context);
    const original = await context.newPage();
    await login(original);
    const fresh = await context.newPage();
    await original.close();
    let fail = true;
    let consentRequests = 0;
    let authDictionaryRequests = 0;
    await context.route('**/psama/user/me/consents', (route) => {
      consentRequests++;
      return fail
        ? route.fulfill({ status: 500, body: 'Unavailable' })
        : route.fulfill({ json: { consents: mockConsents } });
    });
    context.on('request', (request) => {
      if (
        request.url().includes('/dictionary/') &&
        request.method() === 'POST' &&
        request.headers().authorization
      )
        authDictionaryRequests++;
    });
    await fresh.goto('/');
    await expect(fresh.getByTestId('toast-root')).toContainText(
      'could not load which studies you have access to',
    );
    await expect(fresh.getByRole('button', { name: 'Retry access', exact: true })).toBeVisible();
    expect(consentRequests).toBe(3);
    expect(authDictionaryRequests).toBe(0);
    fail = false;
    await fresh.getByRole('button', { name: 'Retry access', exact: true }).click();
    await expectStats(fresh);
    expect(consentRequests).toBe(4);
    expect(authDictionaryRequests).toBe(2);
  } finally {
    await context.close();
  }
});

for (const path of ['/explorer?search=age', '/dashboard']) {
  test(`shared access retry recovers ${path}`, async ({ browser }) => {
    const context = await browser.newContext({ baseURL: 'http://localhost:4173' });
    try {
      await mockSession(context);
      const original = await context.newPage();
      await login(original);
      const fresh = await context.newPage();
      await original.close();
      let fail = true;
      await context.route('**/psama/user/me/consents', (route) =>
        fail
          ? route.fulfill({ status: 500, body: 'Unavailable' })
          : route.fulfill({ json: { consents: mockConsents } }),
      );
      await fresh.goto(path);
      const retry = fresh.getByRole('button', { name: 'Retry access', exact: true });
      await expect(retry).toBeVisible();
      fail = false;
      await retry.click();
      if (path.startsWith('/explorer')) {
        await expect(fresh.locator('#search-container tbody tr')).toHaveCount(
          searchResults.content.length,
        );
      } else {
        await expect(fresh.getByRole('cell', { name: 'A', exact: true })).toBeVisible();
      }
      await expect(fresh.getByTestId('toast-root')).not.toBeVisible();
    } finally {
      await context.close();
    }
  });
}

test('removes authenticated statistics after logout in another tab', async ({ browser }) => {
  const context = await browser.newContext({ baseURL: 'http://localhost:4173' });
  try {
    await mockSession(context);
    const original = await context.newPage();
    await login(original);
    const other = await context.newPage();
    await other.goto('/');
    await expectStats(other);
    await original.evaluate(() => localStorage.removeItem('token'));
    await expect(other.getByTestId('data-summary-auth')).not.toBeVisible();
    await expect(other.getByTestId('data-summary-open')).toBeVisible();
    await expect(other.getByTestId('toast-root')).not.toBeVisible();
  } finally {
    await context.close();
  }
});
