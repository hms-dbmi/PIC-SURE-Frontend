import { describe, it, expect } from 'vitest';

import { findStyleNonceProblem, withStyleNonce } from '$lib/server/csp';

const NONCE = 'abc123==';
const prod = (styleSrc: string) =>
  `default-src 'self'; script-src 'self' 'nonce-${NONCE}'; style-src ${styleSrc}; base-uri 'self'`;

describe('withStyleNonce', () => {
  it("copies the script nonce into style-src so app.html's Plotly seed is allowed", () => {
    expect(withStyleNonce(prod("'self'"))).toContain(`style-src 'self' 'nonce-${NONCE}'`);
  });

  it('leaves every other directive untouched', () => {
    const result = withStyleNonce(prod("'self'")) ?? '';
    expect(result).toContain("default-src 'self'");
    expect(result).toContain("base-uri 'self'");
    expect(result).toContain(`script-src 'self' 'nonce-${NONCE}'`);
  });

  it('does not disturb style-src-attr, which has no nonce mechanism', () => {
    const csp = `${prod("'self'")}; style-src-attr 'unsafe-inline'`;
    expect(withStyleNonce(csp)).toContain("style-src-attr 'unsafe-inline'");
  });

  // SvelteKit relaxes style-src to 'unsafe-inline' in dev so Vite can inject stylesheets. A nonce
  // in the same directive makes browsers ignore 'unsafe-inline' (CSP3), which left `pnpm dev`
  // rendering unstyled.
  it("makes no change in dev, where style-src already carries 'unsafe-inline'", () => {
    const dev = prod("'self' 'unsafe-inline'");
    expect(withStyleNonce(dev)).toBe(dev);
  });

  it('is idempotent', () => {
    const once = withStyleNonce(prod("'self'"));
    expect(withStyleNonce(once)).toBe(once);
  });

  it('returns the policy unchanged when no nonce is present', () => {
    const csp = "default-src 'none'; style-src 'self'";
    expect(withStyleNonce(csp)).toBe(csp);
  });

  it('passes through a missing header', () => {
    expect(withStyleNonce(null)).toBeNull();
  });
});

describe('findStyleNonceProblem', () => {
  it('accepts the production policy once the nonce has been copied across', () => {
    expect(findStyleNonceProblem(withStyleNonce(prod("'self'")))).toBeNull();
  });

  it("accepts dev, where style-src is deliberately relaxed to 'unsafe-inline'", () => {
    expect(findStyleNonceProblem(prod("'self' 'unsafe-inline'"))).toBeNull();
  });

  // Dropping 'style-src' from kit.csp to lean on default-src leaves the seed unauthorised.
  it('reports a policy with no style-src directive', () => {
    const csp = `default-src 'self'; script-src 'self' 'nonce-${NONCE}'`;
    expect(findStyleNonceProblem(csp)).toMatch(/no style-src/);
  });

  // Adding 'unsafe-inline' to script-src stops SvelteKit emitting a nonce anywhere at all.
  it('reports a style-src that never received a nonce', () => {
    const csp = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self'";
    expect(findStyleNonceProblem(csp)).toMatch(/no nonce/);
  });

  it('ignores responses that carry no policy', () => {
    expect(findStyleNonceProblem(null)).toBeNull();
  });
});
