import { expect, type Page } from '@playwright/test';
import { test, mockApiConfig } from '../custom-context';

const operation = (summary: string, extra: Record<string, unknown> = {}) => ({
  tags: ['Concepts'],
  summary,
  responses: { '200': { description: 'Matching concepts' } },
  ...extra,
});

const themedDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Dictionary documentation',
    version: '1.0',
    description: 'Search the [data dictionary](https://docs.example.org/dictionary).',
  },
  servers: [{ url: '/picsure/dictionary' }],
  tags: [{ name: 'Concepts', description: 'Concepts and their facets' }],
  paths: {
    '/concepts': {
      get: operation('List concepts', {
        parameters: [
          { name: 'search', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', format: 'int32', default: 0 } },
        ],
      }),
      post: operation('Search concepts', {
        requestBody: {
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Concept' } } },
        },
        responses: {
          '200': {
            description: 'Matching concepts',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Concept' } } },
          },
        },
      }),
      put: operation('Replace a concept'),
      patch: operation('Update a concept'),
      delete: operation('Remove a concept'),
      head: operation('Check for concepts'),
      options: operation('Concept options'),
    },
    '/concepts/legacy': { get: operation('List concepts the old way', { deprecated: true }) },
  },
  components: {
    schemas: {
      Concept: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', description: 'Concept name', example: 'age', maxLength: 64 },
          dataset: { type: 'string', format: 'uuid', description: 'Dataset the concept is in' },
          code: { type: 'string', description: 'Former identifier', deprecated: true },
        },
      },
    },
  },
};

// The semantic theme color each HTTP method's label is drawn in.
const methodColors = {
  get: '--color-primary-500',
  post: '--color-success-900',
  put: '--color-warning-900',
  delete: '--color-error-500',
  patch: '--color-surface-800',
  head: '--color-surface-800',
  options: '--color-surface-800',
};

interface Failure {
  kind: string;
  text: string;
  ratio: number;
}

// Computes WCAG contrast in the browser, which resolves the theme's oklch() and color-mix()
// values to sRGB through a canvas.
async function contrastFailures(page: Page): Promise<Failure[]> {
  return page.getByTestId('api-documentation').evaluate((host) => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d', { willReadFrequently: true })!;
    type Rgba = [number, number, number, number];
    const rgba = (color: string): Rgba => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
      return [r, g, b, a / 255];
    };
    const over = ([r, g, b, a]: Rgba, [br, bg, bb]: Rgba): Rgba => [
      r * a + br * (1 - a),
      g * a + bg * (1 - a),
      b * a + bb * (1 - a),
      1,
    ];
    const luminance = (color: Rgba) => {
      const [r, g, b] = color.slice(0, 3).map((channel) => {
        const value = channel / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const contrast = (a: Rgba, b: Rgba) => {
      const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
      return (light + 0.05) / (dark + 0.05);
    };
    // The opaque color behind an element, blending translucent ancestors over the canvas.
    const backdrop = (element: Element | null): Rgba => {
      const layers: Rgba[] = [];
      for (let node = element; node; node = node.parentElement) {
        layers.unshift(rgba(getComputedStyle(node).backgroundColor));
      }
      return layers.reduce<Rgba>((below, layer) => over(layer, below), [255, 255, 255, 1]);
    };
    const opacity = (element: Element) => {
      let value = 1;
      for (let node: Element | null = element; node && node !== host; node = node.parentElement) {
        value *= Number(getComputedStyle(node).opacity);
      }
      return value;
    };
    const failures: { kind: string; text: string; ratio: number }[] = [];
    const check = (kind: string, element: Element, color: string, minimum: number) => {
      const behind = backdrop(kind === 'text' ? element : element.parentElement);
      const [r, g, b, a] = rgba(color);
      const ratio = contrast(over([r, g, b, a * opacity(element)], behind), behind);
      if (ratio < minimum) {
        const text = (element.textContent ?? '').trim().slice(0, 40);
        failures.push({ kind, text: `${element.tagName}.${element.classList[0]} ${text}`, ratio });
      }
    };

    // The service tabs above the viewer, and everything Swagger draws.
    for (const element of host.querySelectorAll('*')) {
      if (!element.checkVisibility({ visibilityProperty: true })) continue;
      const style = getComputedStyle(element);
      const ownText = [...element.childNodes].some(
        (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
      );
      if (ownText) check('text', element, style.color, 4.5);
      // A control draws its value without a text node of its own.
      if (element.matches('select, :is(input, textarea):enabled')) {
        check('text', element, style.color, 4.5);
      }
      if (element.matches('svg, svg *') && style.fill !== 'none' && element.matches('svg')) {
        check('icon', element, style.fill, 3);
      }
      // The outline of each operation, control, and the version badges.
      // Disabled controls are exempt.
      if (element.matches('.opblock, select, :is(input, textarea):enabled, .info .title small')) {
        const border = parseFloat(style.borderTopWidth) > 0 ? style.borderTopColor : undefined;
        check('boundary', element, border ?? style.backgroundColor, 3);
      }
      // The selected service tab's underline, which marks it apart from its color.
      if (element.matches('[role="tab"][aria-selected="true"]')) {
        check('boundary', element, style.borderBottomColor, 3);
      }
    }
    return failures;
  });
}

for (const theme of ['picsure', 'bdc', 'aim-ahead']) {
  test.describe(`API documentation in the ${theme} theme`, () => {
    test.use({ storageState: 'tests/end-to-end/.auth/unauthenticated.json' });
    // Swagger draws OpenAPI 3.1 schemas with a different set of components than 3.0.
    async function openDocs(page: Page, openapi = '3.0.3') {
      await mockApiConfig(page, {
        features: [{ name: 'OPEN', value: 'true' }],
        branding: [{ name: 'THEME', value: theme }],
      });
      // Two services, so the tabs are drawn too.
      await page.route('**/picsure/openapi', (route) =>
        route.fulfill({ json: [{ name: 'dictionary' }, { name: 'hpds-open-access' }] }),
      );
      await page.route('**/picsure/openapi/dictionary', (route) =>
        route.fulfill({ json: { ...themedDocument, openapi } }),
      );
      await page.goto('/api#api-access');
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      const viewer = page.getByTestId('api-documentation');
      await expect(viewer.locator('.info .title')).toBeVisible();
      for (const summary of await viewer.locator('.opblock-summary-control').all()) {
        await expect(async () => {
          await summary.click({ timeout: 2000 });
          await expect(summary).toHaveAttribute('aria-expanded', 'true', { timeout: 2000 });
        }).toPass();
      }
      const models = viewer.locator('.models');
      const is31 = openapi.startsWith('3.1');
      await models
        .locator(is31 ? '.json-schema-2020-12-accordion' : '.model-box-control')
        .first()
        .click();
      // Expand every nested property so its description and badges render.
      const collapsed = is31
        ? models.getByRole('button', { name: 'Expand all' })
        : models.locator('.model-toggle.collapsed');
      await expect(async () => {
        while ((await collapsed.count()) > 0) await collapsed.first().click({ timeout: 2000 });
        await expect(models).toContainText('Former identifier', { timeout: 1000 });
      }).toPass();
      await expect(models).toContainText('Former identifier');
    }

    test('sits on the page background in the theme colors', async ({ page }) => {
      await openDocs(page);
      const colors = await page.locator('#api-access').evaluate((section, methods) => {
        const probe = document.createElement('span');
        section.append(probe);
        const resolve = (color: string) => {
          probe.style.color = color;
          return getComputedStyle(probe).color;
        };
        const host = section.querySelector('.swagger-host')!;
        const result = {
          section: getComputedStyle(section).backgroundColor,
          host: getComputedStyle(host).backgroundColor,
          wrapper: getComputedStyle(host.querySelector('.swagger-ui .wrapper')!).backgroundColor,
          title: getComputedStyle(host.querySelector('.info .title')!).color,
          text: resolve('var(--base-font-color)'),
          methods: Object.entries(methods).map(([method, variable]) => [
            getComputedStyle(host.querySelector(`.opblock-${method} .opblock-summary-method`)!)
              .backgroundColor,
            resolve(`var(${variable})`),
          ]),
        };
        probe.remove();
        return result;
      }, methodColors);
      const transparent = 'rgba(0, 0, 0, 0)';
      expect([colors.host, colors.wrapper]).toEqual([transparent, transparent]);
      expect(colors.title).toBe(colors.text);
      for (const [label, palette] of colors.methods) expect(label).toBe(palette);
    });

    for (const openapi of ['3.0.3', '3.1.0']) {
      test(`meets WCAG contrast for text and controls in OpenAPI ${openapi}`, async ({ page }) => {
        await openDocs(page, openapi);
        expect(await contrastFailures(page)).toEqual([]);
      });
    }
  });
}
