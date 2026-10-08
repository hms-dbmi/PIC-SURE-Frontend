import { expect, type Page, type Route } from '@playwright/test';
import { test, mockApiConfig } from '../../custom-context';
import { facetResultPath, facetsResponse, searchResultPath, searchResults } from '../../mock-data';

test.use({ storageState: 'tests/end-to-end/.auth/unauthenticated.json' });

const SESSION_PATH = '*/**/psama/open/session';

function b64url(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function session(sub: string, expiresInSeconds: number): string {
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  return `picsure_s_${b64url({ alg: 'HS256' })}.${b64url({ sub, exp })}.sig-${sub}-${exp}`;
}

function bearer(headers: Record<string, string>): string | undefined {
  return headers['authorization']?.replace(/^Bearer /, '');
}

const SUB_1 = '11111111-1111-4111-8111-111111111111';
const SUB_2 = '22222222-2222-4222-8222-222222222222';

// the dictionary requests the discover page makes through api.ts, with the API key each carried as its bearer
function recordDataRequests(page: Page): { url: string; apiKey?: string }[] {
  const seen: { url: string; apiKey?: string }[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).pathname.startsWith('/picsure/dictionary/')) {
      seen.push({ url: request.url(), apiKey: bearer(request.headers()) });
    }
  });
  return seen;
}

async function mockIssuance(page: Page, tokens: string[]) {
  const issued: string[] = [];
  await page.route(SESSION_PATH, async (route: Route) => {
    const token = tokens[issued.length] ?? tokens[tokens.length - 1];
    issued.push(token);
    await route.fulfill({
      json: { token, expiresAt: new Date(Date.now() + 900_000).toISOString() },
    });
  });
  return issued;
}

test.describe('Open-access session for anonymous discover', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiConfig(page, {
      features: [
        { name: 'OPEN', value: 'true' },
        { name: 'DISCOVER', value: 'true' },
      ],
    });
    await page.route(facetResultPath, (route) => route.fulfill({ json: facetsResponse }));
  });

  test('Acquires one session and sends it on every data request', async ({ page }) => {
    const token = session(SUB_1, 900);
    const issued = await mockIssuance(page, [token]);
    const requests = recordDataRequests(page);
    await page.route(searchResultPath, (route) => route.fulfill({ json: searchResults }));

    await page.goto('/discover?search=somedata');
    await expect.poll(() => requests.some((r) => r.url.includes('dictionary/concepts'))).toBe(true);

    expect(issued).toHaveLength(1);
    expect(requests.every((request) => request.apiKey === token)).toBe(true);
    expect(requests.some((request) => request.url.includes('/api/v1/open'))).toBe(false);
    expect(await page.evaluate(() => localStorage.getItem('open-session'))).toBe(token);
  });

  test('Keeps a refreshed session from the gateway', async ({ page }) => {
    const token = session(SUB_1, 900);
    const refreshed = session(SUB_1, 1200);
    await mockIssuance(page, [token]);
    await page.route(searchResultPath, (route) =>
      route.fulfill({ json: searchResults, headers: { 'X-PICSURE-Session-Refresh': refreshed } }),
    );

    await page.goto('/discover?search=somedata');
    await expect(page.locator('#search-bar')).toBeVisible();

    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('open-session')))
      .toBe(refreshed);
  });

  test('Replaces a rejected session and retries without sending the visitor to login', async ({
    page,
  }) => {
    const rejected = session(SUB_1, 900);
    const replacement = session(SUB_2, 900);
    const issued = await mockIssuance(page, [rejected, replacement]);
    const requests = recordDataRequests(page);
    await page.route(searchResultPath, (route) =>
      bearer(route.request().headers()) === rejected
        ? route.fulfill({
            status: 401,
            json: {
              errorType: 'api_key_invalid',
              message: 'API key is not valid.',
              requestId: null,
            },
          })
        : route.fulfill({ json: searchResults }),
    );

    await page.goto('/discover?search=somedata');
    await expect(page.locator('#search-bar')).toBeVisible();

    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('open-session')))
      .toBe(replacement);
    expect(issued).toEqual([rejected, replacement]);
    await expect.poll(() => requests.some((request) => request.apiKey === replacement)).toBe(true);
    await expect(page).toHaveURL(/\/discover/);
  });

  test('Browses keyless when sessions are disabled', async ({ page }) => {
    let issuanceCalls = 0;
    await page.route(SESSION_PATH, (route) => {
      issuanceCalls++;
      return route.fulfill({ status: 404, body: 'Open-access sessions are not enabled.' });
    });
    const requests = recordDataRequests(page);
    await page.route(searchResultPath, (route) => route.fulfill({ json: searchResults }));

    await page.goto('/discover?search=somedata');
    await expect.poll(() => requests.some((r) => r.url.includes('dictionary/concepts'))).toBe(true);

    expect(issuanceCalls).toBe(1);
    expect(requests.every((request) => request.apiKey === undefined)).toBe(true);
  });

  test('The removed open-access proxy route no longer exists', async ({ page }) => {
    const response = await page.request.get('/api/v1/open/picsure/dictionary/concepts');

    expect(response.status()).toBe(404);
  });
});
