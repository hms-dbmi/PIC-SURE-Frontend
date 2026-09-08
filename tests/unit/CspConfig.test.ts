import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

type CspConfig = { mode?: string; directives?: Record<string, string[] | undefined> };

const config: { kit?: { csp?: CspConfig } } = await import(
  new URL('../../svelte.config.js', import.meta.url).href
).then((module) => module.default);

const appHtml = readFileSync(
  fileURLToPath(new URL('../../src/app.html', import.meta.url)),
  'utf-8',
);
const directives = config.kit?.csp?.directives ?? {};

describe('kit.csp keeps the Plotly stylesheet seed authorisable', () => {
  it('seeds the Plotly style element with the nonce placeholder', () => {
    expect(appHtml).toContain('id="plotly.js-style-global"');
    expect(appHtml).toContain('nonce="%sveltekit.nonce%"');
  });

  it("must not mark the seed with .no-inline-styles, which is Plotly's skip-injection opt-out", () => {
    expect(appHtml).not.toContain('no-inline-styles');
  });

  it('uses nonce mode, which %sveltekit.nonce% requires', () => {
    expect(config.kit?.csp?.mode).toBe('nonce');
  });

  it('declares style-src explicitly, so the nonce has a directive to land in', () => {
    expect(directives['style-src']).toBeDefined();
  });

  it("keeps 'unsafe-inline' out of script-src, or SvelteKit emits no nonce at all", () => {
    expect(directives['script-src'] ?? []).not.toContain('unsafe-inline');
  });
});

describe('kit.csp carries no unsafe source outside style-src-attr', () => {
  const exempt = new Set(['style-src-attr']);

  for (const [directive, sources] of Object.entries(directives)) {
    if (exempt.has(directive) || !Array.isArray(sources)) continue;

    it(`${directive} has no unsafe- source`, () => {
      expect(sources.filter((source) => String(source).startsWith('unsafe-'))).toEqual([]);
    });
  }

  it('confines the only exception to style-src-attr', () => {
    expect(directives['style-src-attr']).toEqual(['unsafe-inline']);
  });
});

describe('CSP_EXTRA_* build vars cannot reintroduce an unsafe source', () => {
  const configUrl = new URL('../../svelte.config.js', import.meta.url).href;
  let counter = 0;

  const loadWith = (name: string, value: string) => {
    process.env[name] = value;
    return import(/* @vite-ignore */ `${configUrl}?case=${counter++}`);
  };

  afterEach(() => {
    delete process.env.CSP_EXTRA_SCRIPT_SRC;
    delete process.env.CSP_EXTRA_CONNECT_SRC;
  });

  for (const token of ['unsafe-eval', "'unsafe-eval'", 'unsafe-inline', "'unsafe-inline'"]) {
    it(`rejects ${token}`, async () => {
      await expect(loadWith('CSP_EXTRA_SCRIPT_SRC', token)).rejects.toThrow(/ALS-9583/);
    });
  }

  it('still accepts a legitimate host, with quotes normalised for SvelteKit', async () => {
    const module = await loadWith('CSP_EXTRA_CONNECT_SRC', "'self' https://example.test");
    const connectSrc = module.default.kit.csp.directives['connect-src'];
    expect(connectSrc).toContain('https://example.test');
    expect(connectSrc).not.toContain("'self'");
  });
});
