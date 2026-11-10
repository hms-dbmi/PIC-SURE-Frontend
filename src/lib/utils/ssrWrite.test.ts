import { describe, expect, it, vi } from 'vitest';

const environment = vi.hoisted(() => ({ browser: false }));
vi.mock('$app/env', () => environment);

import { assertNoSsrWrite } from '#lib/utils/ssrWrite.ts';

describe('assertNoSsrWrite', () => {
  it('throws on a server-side write in development', () => {
    expect(() => assertNoSsrWrite('filters')).toThrow(
      'filters is browser-only and was written during server rendering.',
    );
  });

  it('allows writes in the browser', () => {
    environment.browser = true;
    try {
      expect(() => assertNoSsrWrite('filters')).not.toThrow();
    } finally {
      environment.browser = false;
    }
  });

  it('does nothing in production builds', () => {
    vi.stubEnv('DEV', false);

    expect(() => assertNoSsrWrite('filters')).not.toThrow();
  });
});
