import { test, expect, type BrowserContext, type Page, type Route } from '@playwright/test';
import { mockApiConfig } from '../custom-context';
import { mockToken, picsureUser, mockConsents, searchResults, facetsResponse } from '../mock-data';

async function mockSession(context: BrowserContext) {
  await mockApiConfig(context, {
    features: [
      { name: 'OPEN', value: 'true' },
      { name: 'DISCOVER', value: 'true' },
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
  await context.route('**/picsure/hpds/auth/v3/query/sync', (route) => route.fulfill({ json: 88 }));
  await context.route('**/picsure/hpds/open/v3/query/sync', (route) =>
    route.fulfill({ json: { '\\_studies_consents\\': 100 } }),
  );
}

async function expectAuthStats(page: Page) {
  await expect(page.getByTestId('value-auth-dict:concepts-Variables')).toHaveText(
    searchResults.totalElements.toLocaleString(),
  );
  const datasets = facetsResponse.find((category) => category.name === 'dataset_id')!;
  await expect(page.getByTestId('value-auth-dict:facets:dataset_id-Data Sources')).toHaveText(
    datasets.facets.filter((facet) => facet.count > 0).length.toLocaleString(),
  );
  await expect(page.getByTestId('toast-root')).not.toBeVisible();
}

async function login(page: Page) {
  await page.goto(`/login/loading/#access_token=${mockToken}&token_type=Bearer&state=test`);
  await expect(page).toHaveURL('http://localhost:4173/');
  await expectAuthStats(page);
}

function trackDictionaryRequests(context: BrowserContext) {
  const auth: string[][] = [];
  const open: string[][] = [];
  context.on('request', (request) => {
    if (request.url().includes('/dictionary/') && request.method() === 'POST') {
      (request.headers().authorization ? auth : open).push(request.postDataJSON().consents);
    }
  });
  return { auth, open };
}

for (const { label, consents } of [
  { label: 'with granted studies', consents: mockConsents },
  { label: 'without a consent model', consents: {} },
]) {
  test(`loads landing stats in a fresh tab ${label}, then reloads`, async ({ browser }) => {
    // The shared fixture injects sessionStorage user data into every tab, hiding this bug.
    const context = await browser.newContext({ baseURL: 'http://localhost:4173' });
    try {
      await mockSession(context);
      const original = await context.newPage();
      await login(original);
      const fresh = await context.newPage();
      await original.close();
      const requests = trackDictionaryRequests(context);
      let consentRequests = 0;
      let pendingConsent: Route | undefined;
      await context.route('**/psama/user/me/consents', (route) => {
        consentRequests++;
        pendingConsent = route;
      });

      await fresh.goto('/');
      await expect.poll(() => consentRequests).toBe(1);
      expect(requests.auth).toEqual([]);
      await expect(fresh.getByTestId('toast-root')).not.toBeVisible();
      await pendingConsent!.fulfill({ json: { consents } });
      await expectAuthStats(fresh);
      expect(consentRequests).toBe(1);
      expect(requests.auth).toEqual([
        consents['\\_consents\\'] ?? [],
        consents['\\_consents\\'] ?? [],
      ]);

      await fresh.reload();
      await expectAuthStats(fresh);
      expect(consentRequests).toBe(1);
      expect(requests.auth).toHaveLength(4);
    } finally {
      await context.close();
    }
  });
}

test('blocks stats on consent failure and retries when returning to the landing page', async ({
  browser,
}) => {
  const context = await browser.newContext({ baseURL: 'http://localhost:4173' });
  try {
    await mockSession(context);
    const original = await context.newPage();
    await login(original);
    const fresh = await context.newPage();
    await original.close();
    const requests = trackDictionaryRequests(context);
    let consentRequests = 0;
    let fail = true;
    await context.route('**/psama/user/me/consents', (route) => {
      consentRequests++;
      return fail
        ? route.fulfill({ status: 500, body: 'Unavailable' })
        : route.fulfill({ json: { consents: mockConsents } });
    });

    await fresh.goto('/');
    await expect(fresh.getByTestId('toast-root')).toContainText(
      'could not load which studies you have access to',
    );
    for (const key of ['dict:concepts-Variables', 'dict:facets:dataset_id-Data Sources']) {
      await expect(
        fresh.getByTestId(`value-auth-${key}`).locator('i.fa-circle-exclamation'),
      ).toBeVisible();
    }
    await expect(fresh.getByTestId('value-open-dict:concepts-Variables')).toHaveText(
      searchResults.totalElements.toLocaleString(),
    );
    expect(consentRequests).toBe(3);
    expect(requests.auth).toEqual([]);
    expect(requests.open).toEqual([[], []]);
    expect(await fresh.evaluate(() => localStorage.getItem('token'))).toBe(mockToken);

    fail = false;
    await fresh.getByTestId('toast-root').getByRole('button').click();
    await fresh.locator('#nav-link-help').click();
    await expect(fresh).toHaveURL('http://localhost:4173/help');
    await fresh.getByTestId('logo-home-link').click();
    await expect(fresh).toHaveURL('http://localhost:4173/');
    await expectAuthStats(fresh);
    expect(consentRequests).toBe(4);
    expect(requests.auth).toEqual([mockConsents['\\_consents\\'], mockConsents['\\_consents\\']]);
  } finally {
    await context.close();
  }
});

test('loads public landing stats without fetching consents for an anonymous user', async ({
  browser,
}) => {
  const context = await browser.newContext({ baseURL: 'http://localhost:4173' });
  try {
    await mockSession(context);
    const requests = trackDictionaryRequests(context);
    let consentRequests = 0;
    await context.route('**/psama/user/me/consents', (route) => {
      consentRequests++;
      return route.fulfill({ status: 401 });
    });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.getByTestId('value-open-dict:concepts-Variables')).toHaveText(
      searchResults.totalElements.toLocaleString(),
    );
    const datasets = facetsResponse.find((category) => category.name === 'dataset_id')!;
    await expect(page.getByTestId('value-open-dict:facets:dataset_id-Data Sources')).toHaveText(
      datasets.facets.length.toLocaleString(),
    );
    await expect(page.getByTestId('data-summary-auth')).not.toBeVisible();
    await expect(page.getByTestId('toast-root')).not.toBeVisible();
    expect(consentRequests).toBe(0);
    expect(requests.auth).toEqual([]);
    expect(requests.open).toEqual([[], []]);
  } finally {
    await context.close();
  }
});
