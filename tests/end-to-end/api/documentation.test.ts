import { expect, type Page } from '@playwright/test';
import { test, mockApiConfig } from '../custom-context';

const registry = [
  { name: 'operations', title: 'Operations', url: 'https://unexpected.example/operations' },
  { name: 'dictionary', title: 'Dictionary', url: 'https://unexpected.example/dictionary' },
  { name: 'hpds-query-service', title: 'HPDS query service', url: 'openapi/hpds-query-service' },
];
function openApiDocument(title: string, path: string, server = '/picsure') {
  return {
    openapi: '3.0.3',
    info: { title, version: '1.0' },
    servers: [{ url: server }],
    security: [{ bearerAuth: [] }],
    components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer' } } },
    paths: {
      [path]: {
        get: {
          summary: 'Read available data',
          parameters: [{ name: 'search', in: 'query', schema: { type: 'string' } }],
          responses: {
            '200': {
              description: 'Available data',
              content: {
                'application/json': {
                  schema: { type: 'object', properties: { count: { type: 'integer' } } },
                },
              },
            },
          },
        },
      },
    },
  };
}
async function mockDocuments(page: Page) {
  await page.route('**/picsure/openapi', (route) => route.fulfill({ json: registry }));
  await page.route('**/picsure/openapi/hpds-query-service', (route) =>
    route.fulfill({ json: openApiDocument('HPDS documentation', '/query') }),
  );
  await page.route('**/picsure/openapi/dictionary', (route) =>
    route.fulfill({
      json: openApiDocument('Dictionary documentation', '/search', '/picsure/dictionary'),
    }),
  );
}

test.describe('API documentation for public visitors', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/unauthenticated.json' });
  test.beforeEach(async ({ page }) => {
    await mockApiConfig(page, { features: [{ name: 'OPEN', value: 'true' }] });
    await mockDocuments(page);
  });

  test('renders real read-only Swagger for both services without credentials or external fetches', async ({
    page,
  }) => {
    const requests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/picsure/openapi')) {
        expect(request.headers().authorization).toBeUndefined();
        expect(request.headers().cookie).toBeUndefined();
      }
      requests.push(request.url());
    });
    await page.goto(
      '/api?url=https://unexpected.example/spec&configUrl=https://unexpected.example/config#api-access',
    );
    const viewer = page.getByTestId('api-documentation');
    await expect(viewer.getByRole('heading', { name: 'HPDS documentation' })).toBeVisible();
    await expect(viewer.locator('.info .title')).toHaveAttribute('aria-level', '3');
    await expect(viewer.locator('.info .title')).not.toHaveAttribute('role');
    await expect(viewer.locator('.info .title').locator('..')).not.toHaveAttribute('role');
    await expect(viewer.getByRole('heading', { name: 'default', level: 3 })).toBeVisible();
    await expect(page.getByTestId('api-public-notice')).toContainText('Public Access Only');
    await expect(page.getByTestId('api-public-notice').getByRole('link')).toHaveAttribute(
      'href',
      '/login?redirectTo=/api',
    );
    await expect(page.getByLabel('API documentation')).toHaveValue('hpds-query-service');
    await expect(viewer.locator('.servers select')).toBeVisible();
    await expect(viewer.locator('.servers select')).toHaveValue('/picsure');
    await expect(page.getByLabel('API documentation').locator('option')).toHaveText([
      'HPDS queries',
      'Dictionary',
    ]);
    await viewer.locator('.opblock-summary').click();
    await expect(viewer.getByText('Available data', { exact: true })).toBeVisible();
    await expect(viewer.getByRole('button', { name: /Try it out|Execute|Authoriz/i })).toHaveCount(
      0,
    );
    await expect(page).toHaveURL(/#api-access$/);
    await page.getByLabel('API documentation').selectOption('dictionary');
    await expect(viewer.getByRole('heading', { name: 'Dictionary documentation' })).toBeVisible();
    await expect(viewer.locator('.servers select')).toHaveValue('/picsure/dictionary');
    await expect(viewer.getByRole('heading', { name: 'HPDS documentation' })).toHaveCount(0);
    expect(
      requests.some((url) => /unexpected\.example|validator\.swagger/.test(new URL(url).hostname)),
    ).toBe(false);
  });

  const policies = [
    {
      name: 'BDC infrastructure',
      allowExistingFontViolation: true,
      policy:
        "frame-ancestors 'none'; default-src 'self'; style-src 'self' 'unsafe-inline'; worker-src 'self' blob:; script-src 'self' 'unsafe-eval' 'unsafe-inline' data: https://*.googletagmanager.com; img-src 'self' data: https://public.era.nih.gov blob: https://*.google-analytics.com https://*.googletagmanager.com; connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com;",
    },
    // The app's own nonce policy from svelte.config.js, served unmodified.
    { name: 'application nonce', allowExistingFontViolation: false, policy: undefined },
  ];
  for (const { name, policy, allowExistingFontViolation } of policies) {
    test(`renders expanded documentation under the ${name} CSP`, async ({ page }) => {
      await page.addInitScript((ignoreFonts) => {
        const violations: string[] = [];
        Object.assign(window, { apiCspViolations: violations });
        document.addEventListener('securitypolicyviolation', (event) => {
          // The old infrastructure policy blocks existing Vite-inlined app fonts.
          // The newer application policy permits them, so every violation counts.
          if (!ignoreFonts || event.effectiveDirective !== 'font-src') {
            violations.push(`${event.effectiveDirective}: ${event.blockedURI}`);
          }
        });
      }, allowExistingFontViolation);
      if (policy) {
        await page.route('**/api', async (route) => {
          const response = await route.fetch();
          await route.fulfill({
            response,
            headers: { ...response.headers(), 'content-security-policy': policy },
          });
        });
      }
      const response = await page.goto('/api#api-access');
      if (!policy) expect(response?.headers()['content-security-policy']).toContain("'nonce-");
      const viewer = page.getByTestId('api-documentation');
      await expect(viewer.getByRole('heading', { name: 'HPDS documentation' })).toBeVisible();
      await viewer.locator('.opblock-summary').click();
      await expect(viewer.locator('.highlight-code')).toBeVisible();
      expect(
        await page.evaluate(
          () => (window as unknown as { apiCspViolations: string[] }).apiCspViolations,
        ),
      ).toEqual([]);
    });
  }

  test('reuses the viewer across switches and renders again after client navigation', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/api#api-access');
    for (const service of ['dictionary', 'hpds-query-service', 'dictionary']) {
      await page.getByLabel('API documentation').selectOption(service);
      await expect(
        page.getByTestId('api-documentation').getByRole('heading', {
          name: service === 'dictionary' ? 'Dictionary documentation' : 'HPDS documentation',
        }),
      ).toBeVisible();
    }
    await page.locator('a[href="/"]').first().click();
    await expect(page.getByTestId('api-documentation')).toHaveCount(0);
    await page.goBack();
    await expect(
      page.getByTestId('api-documentation').getByRole('heading', { name: 'HPDS documentation' }),
    ).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('a failed service can retry and does not prevent switching to another service', async ({
    page,
  }) => {
    await page.route('**/picsure/openapi/hpds-query-service', (route) =>
      route.fulfill({ status: 502 }),
    );
    await page.goto('/api#api-access');
    const viewer = page.getByTestId('api-documentation');
    await expect(viewer).toContainText('Unable to load API documentation');
    await page.getByLabel('API documentation').selectOption('dictionary');
    await expect(viewer.getByRole('heading', { name: 'Dictionary documentation' })).toBeVisible();
    await page.getByLabel('API documentation').selectOption('hpds-query-service');
    await expect(viewer.getByRole('button', { name: 'Retry' })).toBeVisible();
    await page.route('**/picsure/openapi/hpds-query-service', (route) =>
      route.fulfill({ json: openApiDocument('Recovered HPDS', '/query') }),
    );
    await viewer.getByRole('button', { name: 'Retry' }).click();
    await expect(viewer.getByRole('heading', { name: 'Recovered HPDS' })).toBeVisible();
  });

  for (const response of [{ status: 404 }, { json: [] }]) {
    test(`keeps section when index is unavailable: ${JSON.stringify(response)}`, async ({
      page,
    }) => {
      await page.route('**/picsure/openapi', (route) => route.fulfill(response));
      await page.goto('/api#api-access');
      await expect(page.getByRole('heading', { name: 'API Access', exact: true })).toBeVisible();
      await expect(page.getByTestId('api-documentation')).toContainText(
        'API documentation is unavailable on this deployment.',
      );
      await page.route('**/picsure/openapi', (route) => route.fulfill({ json: registry }));
      await page.getByTestId('api-documentation').getByRole('button', { name: 'Retry' }).click();
      await expect(page.getByRole('heading', { name: 'HPDS documentation' })).toBeVisible();
    });
  }

  for (const response of [{ status: 503 }, { json: { invalid: true } }]) {
    test(`reports a retryable index error: ${JSON.stringify(response)}`, async ({ page }) => {
      await page.route('**/picsure/openapi', (route) => route.fulfill(response));
      await page.goto('/api#api-access');
      const viewer = page.getByTestId('api-documentation');
      await expect(viewer).toContainText('Unable to load API documentation. Please try again.');
      await expect(viewer).not.toContainText('unavailable on this deployment');
      await page.route('**/picsure/openapi', (route) => route.fulfill({ json: registry }));
      await viewer.getByRole('button', { name: 'Retry' }).click();
      await expect(viewer.getByRole('heading', { name: 'HPDS documentation' })).toBeVisible();
    });
  }

  test('keeps expanded documentation within the mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/api#api-access');
    const viewer = page.getByTestId('api-documentation');
    await expect(viewer.getByRole('heading', { name: 'HPDS documentation' })).toBeVisible();
    await expect(viewer.locator('.info .title')).toHaveAttribute('aria-level', '3');
    await expect(viewer.locator('.info .title')).not.toHaveAttribute('role');
    await expect(viewer.locator('.info .title').locator('..')).not.toHaveAttribute('role');
    await expect(viewer.getByRole('heading', { name: 'default', level: 3 })).toBeVisible();
    await viewer.locator('.opblock-summary').click();
    await viewer.getByRole('tab', { name: 'Schema', exact: true }).click();
    await expect(viewer.getByText('count', { exact: true })).toBeVisible();
    const dimensions = await viewer.evaluate((element) => ({
      right: element.getBoundingClientRect().right,
      viewport: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.right).toBeLessThanOrEqual(dimensions.viewport);
    expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewport);
  });

  test('a stalled request times out into a retryable state', async ({ page }) => {
    await page.route('**/picsure/openapi/hpds-query-service', () => {});
    await page.goto('/api#api-access');
    await expect(page.getByTestId('api-documentation')).toContainText('Loading API documentation');
    await expect(
      page.getByTestId('api-documentation').getByRole('button', { name: 'Retry' }),
    ).toBeVisible({ timeout: 20000 });
  });

  test('rejects a malformed service document', async ({ page }) => {
    await page.route('**/picsure/openapi/hpds-query-service', (route) =>
      route.fulfill({ json: { message: 'not a spec' } }),
    );
    await page.goto('/api#api-access');
    await expect(page.getByTestId('api-documentation')).toContainText(
      'Unable to load API documentation',
    );
  });

  test('a slow previous selection cannot overwrite the current document', async ({ page }) => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route('**/picsure/openapi/hpds-query-service', async (route) => {
      await gate;
      await route.fulfill({ json: openApiDocument('Stale HPDS', '/query') }).catch(() => {});
    });
    await page.goto('/api#api-access');
    await expect(page.getByLabel('API documentation')).toBeVisible();
    await page.getByLabel('API documentation').selectOption('dictionary');
    await expect(page.getByRole('heading', { name: 'Dictionary documentation' })).toBeVisible();
    release();
    await expect(page.getByLabel('API documentation')).toHaveValue('dictionary');
    await expect(page.getByRole('heading', { name: 'Stale HPDS' })).toHaveCount(0);
  });
});

test.describe('API documentation for signed-in visitors', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });
  test('shows docs without the public notice or request execution', async ({ page }) => {
    await mockDocuments(page);
    const response = await page.goto('/api#api-access');
    expect(await response?.text()).not.toContain('data-testid="api-public-notice"');
    const viewer = page.getByTestId('api-documentation');
    await expect(viewer.getByRole('heading', { name: 'HPDS documentation' })).toBeVisible();
    await expect(viewer.locator('.info .title')).toHaveAttribute('aria-level', '3');
    await expect(viewer.locator('.info .title')).not.toHaveAttribute('role');
    await expect(viewer.locator('.info .title').locator('..')).not.toHaveAttribute('role');
    await expect(viewer.getByRole('heading', { name: 'default', level: 3 })).toBeVisible();
    await expect(page.getByTestId('api-public-notice')).toHaveCount(0);
    await viewer.locator('.opblock-summary').click();
    await expect(viewer.getByText('Available data', { exact: true })).toBeVisible();
    await expect(viewer.getByRole('button', { name: /Try it out|Execute|Authoriz/i })).toHaveCount(
      0,
    );
  });
});
