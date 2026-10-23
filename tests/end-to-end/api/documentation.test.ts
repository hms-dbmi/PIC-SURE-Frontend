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

async function collectDocumentHeaders(page: Page) {
  await page
    .context()
    .addCookies([
      { name: 'api-doc-cookie-probe', value: 'present', domain: 'localhost', path: '/' },
    ]);
  expect(await page.context().cookies('http://localhost:4173')).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ name: 'api-doc-cookie-probe', value: 'present' }),
    ]),
  );
  const headers: Promise<Record<string, string>>[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/picsure/openapi')) headers.push(request.allHeaders());
  });
  return headers;
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
    const documentHeaders = await collectDocumentHeaders(page);
    const requests: string[] = [];
    page.on('request', (request) => {
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
    await expect(page.getByLabel('Select service:')).toHaveValue('hpds-query-service');
    const serviceSelect = page.getByLabel('Select service:');
    await expect(serviceSelect).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    await expect(page.getByTestId('api-public-notice')).toHaveCSS(
      'background-color',
      'rgb(255, 255, 255)',
    );
    const selectorBounds = await serviceSelect.boundingBox();
    const labelBounds = await viewer.locator('label[for="api-document-service"]').boundingBox();
    expect(selectorBounds!.x).toBeGreaterThan(labelBounds!.x + labelBounds!.width);
    expect(selectorBounds!.y).toBeLessThan(labelBounds!.y + labelBounds!.height);
    expect(selectorBounds!.width).toBeLessThan((await viewer.boundingBox())!.width / 2);
    await expect(viewer.locator('.servers select')).toBeVisible();
    await expect(viewer.locator('.servers select')).toHaveValue('/picsure');
    await expect(page.getByLabel('Select service:').locator('option')).toHaveText([
      'HPDS queries',
      'Dictionary',
    ]);
    await viewer.locator('.opblock-summary').click();
    await expect(viewer.getByText('Available data', { exact: true })).toBeVisible();
    await expect(viewer.getByRole('button', { name: /Try it out|Execute|Authoriz/i })).toHaveCount(
      0,
    );
    await expect(page).toHaveURL(/#api-access$/);
    await page.getByLabel('Select service:').selectOption('dictionary');
    await expect(viewer.getByRole('heading', { name: 'Dictionary documentation' })).toBeVisible();
    await expect(viewer.locator('.servers select')).toHaveValue('/picsure/dictionary');
    await expect(viewer.getByRole('heading', { name: 'HPDS documentation' })).toHaveCount(0);
    expect(documentHeaders).toHaveLength(3);
    for (const headers of await Promise.all(documentHeaders)) {
      expect(headers.authorization).toBeUndefined();
      expect(headers.cookie).toBeUndefined();
    }
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
      await page.getByLabel('Select service:').selectOption(service);
      await expect(
        page.getByTestId('api-documentation').getByRole('heading', {
          name: service === 'dictionary' ? 'Dictionary documentation' : 'HPDS documentation',
        }),
      ).toBeVisible();
    }
    await page.getByTestId('api-public-notice').getByRole('link').click();
    await expect(page.getByTestId('api-documentation')).toHaveCount(0);
    await page.goBack();
    await expect(
      page.getByTestId('api-documentation').getByRole('heading', { name: 'HPDS documentation' }),
    ).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('keeps the previous document visible while loading another service', async ({ page }) => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route('**/picsure/openapi/dictionary', async (route) => {
      await gate;
      await route.fulfill({ json: openApiDocument('Dictionary documentation', '/search') });
    });
    await page.goto('/api#api-access');
    const viewer = page.getByTestId('api-documentation');
    await expect(viewer.getByRole('heading', { name: 'HPDS documentation' })).toBeVisible();
    await page.getByLabel('Select service:').selectOption('dictionary');
    try {
      await expect(viewer.getByRole('status')).toContainText(
        'Loading API documentation for Dictionary',
      );
      await expect(viewer.getByRole('heading', { name: 'HPDS documentation' })).toBeVisible();
    } finally {
      release();
    }
    await expect(viewer.getByRole('heading', { name: 'Dictionary documentation' })).toBeVisible();
    await expect(viewer.getByRole('heading', { name: 'HPDS documentation' })).toHaveCount(0);
    await expect(viewer.getByRole('status')).toHaveCount(0);
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
    await page.getByLabel('Select service:').selectOption('dictionary');
    await expect(viewer.getByRole('heading', { name: 'Dictionary documentation' })).toBeVisible();
    await page.getByLabel('Select service:').selectOption('hpds-query-service');
    await expect(viewer.getByRole('button', { name: 'Retry' })).toBeVisible();
    await expect(
      viewer.getByRole('heading', { name: 'Dictionary documentation' }),
    ).not.toBeVisible();
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
      await expect(
        page.getByRole('heading', { name: 'API Documentation', exact: true }),
      ).toBeVisible();
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
    await expect(page.getByLabel('Select service:')).toBeVisible();
    await page.getByLabel('Select service:').selectOption('dictionary');
    await expect(page.getByRole('heading', { name: 'Dictionary documentation' })).toBeVisible();
    release();
    await expect(page.getByLabel('Select service:')).toHaveValue('dictionary');
    await expect(page.getByRole('heading', { name: 'Stale HPDS' })).toHaveCount(0);
  });
});

test.describe('API documentation for signed-in visitors', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/generalUser.json' });
  test('shows docs without the public notice or request execution', async ({ page }) => {
    await mockDocuments(page);
    const documentHeaders = await collectDocumentHeaders(page);
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
    expect(documentHeaders).toHaveLength(2);
    for (const headers of await Promise.all(documentHeaders)) {
      expect(headers.authorization).toBeUndefined();
      expect(headers.cookie).toBeUndefined();
    }
  });
});

interface LoggedEvent {
  event_type: string;
  action: string;
  metadata?: Record<string, unknown>;
  status?: number;
  error?: Record<string, unknown>;
}

async function collectLogs(page: Page) {
  const events: LoggedEvent[] = [];
  await page.route('**/api/v1/log', (route) => {
    events.push(route.request().postDataJSON());
    return route.fulfill({ status: 202, json: { result: 'accepted' } });
  });
  return events;
}

function docsEvents(events: LoggedEvent[]) {
  return events
    .filter((event) => event.action.startsWith('api.docs_'))
    .map(({ event_type, action, metadata }) => ({ event_type, action, metadata }));
}

const interactiveDocument = {
  openapi: '3.0.3',
  info: {
    title: 'HPDS documentation',
    version: '1.0',
    description: 'See [the guide](https://docs.example.org/guide) first.',
  },
  servers: [{ url: '/picsure' }, { url: '/picsure/v2' }],
  tags: [{ name: 'Query' }, { name: 'Search' }],
  paths: {
    '/query': {
      post: {
        tags: ['Query'],
        operationId: 'runQuery',
        summary: 'Run a query',
        responses: {
          '200': {
            description: 'Query result',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/QueryResult' } },
              'text/plain': { schema: { type: 'string' } },
            },
          },
        },
      },
    },
    '/search': {
      get: {
        tags: ['Search'],
        summary: 'Search without an operationId',
        responses: { '200': { description: 'Matches' } },
      },
    },
  },
  components: {
    schemas: {
      QueryResult: {
        type: 'object',
        properties: {
          count: { type: 'integer' },
          detail: { $ref: '#/components/schemas/Detail' },
        },
      },
      Detail: { type: 'object', properties: { note: { type: 'string' } } },
    },
  },
};

test.describe('API documentation activity logging', () => {
  test.use({ storageState: 'tests/end-to-end/.auth/unauthenticated.json' });
  test.beforeEach(async ({ page }) => {
    await mockApiConfig(page, { features: [{ name: 'OPEN', value: 'true' }] });
    await mockDocuments(page);
    await page.route('**/picsure/openapi/hpds-query-service', (route) =>
      route.fulfill({ json: interactiveDocument }),
    );
  });

  async function openDocs(page: Page) {
    const events = await collectLogs(page);
    await page.goto('/api#api-access');
    const viewer = page.getByTestId('api-documentation');
    await expect(viewer.getByRole('heading', { name: 'HPDS documentation' })).toBeVisible();
    const expected: LoggedEvent[] = [];
    const expectLogged = async (action: string, metadata: Record<string, unknown>) => {
      expected.push({
        event_type: 'ACTION',
        action,
        metadata: { service: 'hpds-query-service', ...metadata },
      });
      await expect.poll(() => docsEvents(events)).toEqual(expected);
    };
    return { events, viewer, expectLogged };
  }

  test('logs what a visitor does inside an operation', async ({ page }) => {
    const { viewer, expectLogged } = await openDocs(page);
    const query = viewer.locator('.opblock-post');
    const operation = { method: 'post', path: '/query' };

    await expect(async () => {
      await query.locator('.opblock-summary-control').click({ timeout: 2000 });
      await expect(query.getByText('Query result')).toBeVisible({ timeout: 2000 });
    }).toPass();
    await expectLogged('api.docs_toggle', {
      kind: 'operation',
      tag: 'Query',
      ...operation,
      shown: true,
    });

    await query.getByRole('tab', { name: 'Schema', exact: true }).click();
    await expectLogged('api.docs_tab_select', { tab: 'schema', ...operation });

    await query.locator('.model-box-control', { hasText: 'Detail' }).click();
    await expect(query.getByText('note', { exact: true })).toBeVisible();
    await expectLogged('api.docs_toggle', {
      kind: 'schema_property',
      name: 'Detail',
      shown: true,
      ...operation,
    });

    await query.locator('select.content-type').selectOption('text/plain');
    await expectLogged('api.docs_select', {
      control: 'media_type',
      value: 'text/plain',
      ...operation,
    });

    // Swagger shows the path's copy button only while the summary is hovered.
    await query.locator('.opblock-summary .copy-to-clipboard button').dispatchEvent('click');
    await expectLogged('api.docs_copy', operation);

    await query.locator('.opblock-summary-control').click();
    await expect(query.getByText('Query result')).toBeHidden();
    await expectLogged('api.docs_toggle', {
      kind: 'operation',
      tag: 'Query',
      ...operation,
      shown: false,
    });

    await viewer.locator('.opblock-get .opblock-summary-control').click();
    await expectLogged('api.docs_toggle', {
      kind: 'operation',
      tag: 'Search',
      method: 'get',
      path: '/search',
      shown: true,
    });
  });

  test('logs each tag and schema toggle once', async ({ page }) => {
    const { viewer, expectLogged } = await openDocs(page);
    const search = viewer.locator('.opblock-tag[data-tag="Search"]');
    const getSearch = viewer.locator('.opblock-get');

    await viewer.getByRole('heading', { name: 'Search', level: 3 }).click();
    await expect(getSearch).toBeHidden();
    await expectLogged('api.docs_toggle', { kind: 'tag', tag: 'Search', shown: false });
    // Swagger handles a click on the tag's arrow in both the button and its heading.
    await search.locator('.expand-operation').click();
    await expect(getSearch).toBeVisible();
    await expectLogged('api.docs_toggle', { kind: 'tag', tag: 'Search', shown: true });

    const schemas = viewer.locator('.models-control');
    const queryResult = viewer.locator('#model-QueryResult');
    // Under load Swagger can re-render the section mid-click and drop it, so click again only
    // while the section is still in the other state; a retry can never toggle it twice.
    const setSchemasOpen = async (open: boolean) => {
      await expect(async () => {
        if ((await schemas.getAttribute('aria-expanded')) !== String(open)) {
          await schemas.click({ timeout: 2000 });
        }
        await expect(schemas).toHaveAttribute('aria-expanded', String(open), { timeout: 2000 });
      }).toPass();
    };
    await setSchemasOpen(false);
    await expect(queryResult).toHaveCount(0);
    await expectLogged('api.docs_toggle', { kind: 'schemas', shown: false });
    await setSchemasOpen(true);
    await expectLogged('api.docs_toggle', { kind: 'schemas', shown: true });
    await queryResult.locator('.model-box-control').first().click();
    await expect(queryResult).toContainText('count');
    await expectLogged('api.docs_toggle', { kind: 'schema', name: 'QueryResult', shown: true });

    // Reopening the section remounts the expanded schema, which is not a new expansion.
    await setSchemasOpen(false);
    await expect(queryResult).toHaveCount(0);
    await expectLogged('api.docs_toggle', { kind: 'schemas', shown: false });
    await setSchemasOpen(true);
    await expect(queryResult).toContainText('count');
    await expectLogged('api.docs_toggle', { kind: 'schemas', shown: true });
  });

  test('logs server and service switches', async ({ page }) => {
    const { events, viewer, expectLogged } = await openDocs(page);
    await viewer.locator('.servers select').selectOption('/picsure/v2');
    await expectLogged('api.docs_select', { control: 'server', value: '/picsure/v2' });

    await page.getByLabel('Select service:').selectOption('dictionary');
    await expect(viewer.getByRole('heading', { name: 'Dictionary documentation' })).toBeVisible();
    await expect
      .poll(() => docsEvents(events).at(-1))
      .toEqual({
        event_type: 'ACTION',
        action: 'api.docs_service_select',
        metadata: { from: 'hpds-query-service', to: 'dictionary' },
      });
  });

  test('logs a link followed from the documentation', async ({ page }) => {
    const events = await collectLogs(page);
    await page.route('https://docs.example.org/**', (route) => route.fulfill({ body: 'guide' }));
    await page.goto('/api#api-access');
    const viewer = page.getByTestId('api-documentation');
    await viewer.getByRole('link', { name: 'the guide' }).click({ modifiers: ['ControlOrMeta'] });
    await expect
      .poll(() => docsEvents(events))
      .toEqual([
        {
          event_type: 'ACTION',
          action: 'api.docs_link_click',
          metadata: { service: 'hpds-query-service', url: 'https://docs.example.org/guide' },
        },
      ]);
  });

  test('logs documentation that fails to load, but not a deployment without it', async ({
    page,
  }) => {
    const events = await collectLogs(page);
    await page.route('**/picsure/openapi', (route) => route.fulfill({ status: 404 }));
    await page.goto('/api#api-access');
    const viewer = page.getByTestId('api-documentation');
    await expect(viewer).toContainText('API documentation is unavailable on this deployment.');
    await page.route('**/picsure/openapi', (route) => route.fulfill({ status: 503 }));
    await viewer.getByRole('button', { name: 'Retry' }).click();
    await expect(viewer).toContainText('Unable to load API documentation');
    await page.route('**/picsure/openapi', (route) => route.fulfill({ json: registry }));
    await page.route('**/picsure/openapi/hpds-query-service', (route) =>
      route.fulfill({ status: 502 }),
    );
    await viewer.getByRole('button', { name: 'Retry' }).click();
    const failures = () =>
      events
        .filter((event) => event.action === 'api.docs_load_failed')
        .map(({ event_type, metadata, status, error }) => ({
          event_type,
          metadata,
          status,
          error,
        }));
    const failed = { message: 'Documentation request failed' };
    await expect.poll(failures).toEqual([
      { event_type: 'ERROR', metadata: { stage: 'registry' }, status: 503, error: failed },
      {
        event_type: 'ERROR',
        metadata: { service: 'hpds-query-service', stage: 'document' },
        status: 502,
        error: failed,
      },
    ]);
  });

  test('logs nested schema toggles in an OpenAPI 3.1 document', async ({ page }) => {
    const events = await collectLogs(page);
    await page.route('**/picsure/openapi/hpds-query-service', (route) =>
      route.fulfill({
        json: {
          ...interactiveDocument,
          openapi: '3.1.0',
          components: {
            schemas: {
              ...interactiveDocument.components.schemas,
              Combined: { oneOf: [{ type: 'string' }, { type: 'integer' }] },
            },
          },
        },
      }),
    );
    await page.goto('/api#api-access');
    const viewer = page.getByTestId('api-documentation');
    await expect(viewer.getByRole('heading', { name: 'HPDS documentation' })).toBeVisible();
    const queryResult = viewer.locator('.models .json-schema-2020-12', {
      has: page.locator('.json-schema-2020-12__title', { hasText: 'QueryResult' }),
    });
    await queryResult.locator('.json-schema-2020-12-accordion').first().click();
    const detail = queryResult.locator('.json-schema-2020-12--embedded', { hasText: 'detail' });
    await detail.locator('.json-schema-2020-12-accordion').click();
    await detail.getByRole('button', { name: 'Collapse all' }).click();
    await viewer
      .locator('.models .json-schema-2020-12', {
        has: page.locator('.json-schema-2020-12__title', { hasText: /^Detail$/ }),
      })
      .getByRole('button', { name: 'Expand all' })
      .click();
    const combined = viewer.locator('.models .json-schema-2020-12', {
      has: page.locator('.json-schema-2020-12__title', { hasText: 'Combined' }),
    });
    await combined.locator('.json-schema-2020-12-accordion').first().click();
    await combined.locator('.json-schema-2020-12-accordion', { hasText: 'One of' }).click();
    const service = 'hpds-query-service';
    await expect
      .poll(() => docsEvents(events))
      .toEqual([
        {
          event_type: 'ACTION',
          action: 'api.docs_toggle',
          metadata: { service, kind: 'schema', name: 'QueryResult', shown: true },
        },
        {
          event_type: 'ACTION',
          action: 'api.docs_toggle',
          metadata: { service, kind: 'schema_property', name: 'detail', shown: true },
        },
        {
          event_type: 'ACTION',
          action: 'api.docs_toggle',
          metadata: { service, kind: 'schema_property', name: 'detail', shown: false, all: true },
        },
        {
          event_type: 'ACTION',
          action: 'api.docs_toggle',
          metadata: { service, kind: 'schema', name: 'Detail', shown: true, all: true },
        },
        {
          event_type: 'ACTION',
          action: 'api.docs_toggle',
          metadata: { service, kind: 'schema', name: 'Combined', shown: true },
        },
        {
          event_type: 'ACTION',
          action: 'api.docs_toggle',
          metadata: { service, kind: 'schema_property', name: 'One of', shown: true },
        },
      ]);
  });
});
