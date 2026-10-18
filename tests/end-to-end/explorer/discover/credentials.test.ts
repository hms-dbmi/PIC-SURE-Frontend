import { expect, type Page } from '@playwright/test';
import { test, mockApiConfig, mockApiSuccess } from '../../custom-context';
import {
  crossCountSyncResponseInital,
  facetResultPath,
  facetsResponse,
  mockToken,
  searchResultPath,
  searchResults,
} from '../../../support/mock-data';

// The open variant's data requests, the landing page's public stats and /discover's
// distributions, carry a signed-in user's login token so the backend's access log can tell who
// sent them; a visitor's carry this browser's open-access session.

function b64url(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

const SESSION = `picsure_s_${b64url({ alg: 'HS256' })}.${b64url({
  sub: '33333333-3333-4333-8333-333333333333',
  exp: Math.floor(Date.now() / 1000) + 3600,
})}.sig`;

interface Sent {
  path: string;
  bearer?: string;
  // the dictionary body's consents; the public stats send none
  consents?: unknown;
}

function recordRequests(page: Page, prefix: string): Sent[] {
  const sent: Sent[] = [];
  page.on('request', (request) => {
    const path = new URL(request.url()).pathname;
    if (!path.startsWith(prefix)) return;
    sent.push({
      path,
      bearer: request.headers()['authorization']?.replace(/^Bearer /, ''),
      consents: request.postDataJSON()?.consents,
    });
  });
  return sent;
}

const isPublicStat = ({ consents }: Sent) => Array.isArray(consents) && consents.length === 0;

async function mockBackend(page: Page) {
  await page.route('*/**/psama/open/session', (route) =>
    route.fulfill({
      json: { token: SESSION, expiresAt: new Date(Date.now() + 3_600_000).toISOString() },
    }),
  );
  await mockApiSuccess(page, '*/**/psama/user/me?hasToken', {});
  await mockApiSuccess(page, '*/**/picsure/hpds/auth/query/sync', '88');
  await mockApiSuccess(page, '*/**/picsure/hpds/open/query/sync', '88');
  await mockApiSuccess(page, '*/**/picsure/search/2', crossCountSyncResponseInital);
  await mockApiSuccess(page, '*/**/picsure/dictionary/concepts?*', searchResults);
  await mockApiSuccess(page, searchResultPath, searchResults);
  await mockApiSuccess(page, facetResultPath, facetsResponse);
  await mockApiSuccess(page, '*/**/picsure/visualization/*/distributions', {
    categoricalData: [],
    continuousData: [],
  });
}

const DICTIONARY = ['/picsure/dictionary/concepts', '/picsure/dictionary/facets'];

test.describe('Open variant credentials', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiConfig(page, {
      features: [
        { name: 'OPEN', value: 'true' },
        { name: 'OPEN_EXPLORER', value: 'false' },
        { name: 'DISCOVER', value: 'true' },
      ],
    });
    await mockBackend(page);
  });

  test.describe('signed in', () => {
    test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });

    test('the landing page public stats send the login token', async ({ page }) => {
      const sent = recordRequests(page, '/picsure/dictionary/');
      await page.goto('/');

      await expect
        .poll(() => sent.filter(isPublicStat).map(({ path, bearer }) => [path, bearer]))
        .toEqual(expect.arrayContaining(DICTIONARY.map((path) => [path, mockToken])));
      expect(sent.filter(({ bearer }) => bearer !== mockToken)).toEqual([]);
    });

    test('/discover distributions send the login token', async ({ page }) => {
      const sent = recordRequests(page, '/picsure/visualization/');
      await page.goto('/discover/distributions');

      await expect
        .poll(() => sent)
        .toEqual([{ path: '/picsure/visualization/open/distributions', bearer: mockToken }]);
    });

    test('/explorer distributions still send the login token', async ({ page }) => {
      const sent = recordRequests(page, '/picsure/visualization/');
      await page.goto('/explorer/distributions');

      await expect
        .poll(() => sent)
        .toEqual([{ path: '/picsure/visualization/auth/distributions', bearer: mockToken }]);
    });
  });

  test.describe('visitor', () => {
    test.use({ storageState: 'tests/end-to-end/.auth/unauthenticated.json' });

    test('the landing page public stats send the open-access session', async ({ page }) => {
      const sent = recordRequests(page, '/picsure/dictionary/');
      await page.goto('/');

      await expect
        .poll(() => sent.map(({ path, bearer }) => [path, bearer]).sort())
        .toEqual(DICTIONARY.map((path) => [path, SESSION]));
      expect(sent.every(isPublicStat)).toBe(true);
    });

    test('/discover distributions send the open-access session', async ({ page }) => {
      const sent = recordRequests(page, '/picsure/visualization/');
      await page.goto('/discover/distributions');

      await expect
        .poll(() => sent)
        .toEqual([{ path: '/picsure/visualization/open/distributions', bearer: SESSION }]);
    });
  });
});
