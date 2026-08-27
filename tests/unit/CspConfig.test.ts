import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

type CspConfig = { mode?: string; directives?: Record<string, string[] | undefined> };

// Loaded through a runtime-computed specifier on purpose. A static import would pull
// svelte.config.js into svelte-check's program, which surfaces unrelated pre-existing type errors
// in that file and would make this test the reason someone has to fix them.
const config: { kit?: { csp?: CspConfig } } = await import(
  new URL('../../svelte.config.js', import.meta.url).href
).then((module) => module.default);

const appHtml = readFileSync(
  fileURLToPath(new URL('../../src/app.html', import.meta.url)),
  'utf-8',
);
const directives = config.kit?.csp?.directives ?? {};

// app.html seeds a nonced <style> so Plotly's ~53 global rules survive a strict style-src. Every
// way that pairing breaks is silent - charts render subtly wrong with no error - and dev masks
// some of it, because SvelteKit synthesises a relaxed style-src there. These assertions are the
// only place the invariant is checked deterministically.
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

// The findings ALS-9583 and ALS-9584 exist to close.
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

// The CSP_EXTRA_* build vars widen the policy for a deployment served across sibling domains.
// They must not be able to hand back what ALS-9583 removed. A pre-quoted token is the subtle
// case: SvelteKit only re-quotes keywords it recognises, and it recognises them unquoted, so
// "'unsafe-eval'" would be emitted into the header verbatim.
describe('CSP_EXTRA_* build vars cannot reintroduce an unsafe source', () => {
  const configUrl = new URL('../../svelte.config.js', import.meta.url).href;
  let counter = 0;

  // Each import needs a fresh module instance, since the config reads process.env at load.
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
