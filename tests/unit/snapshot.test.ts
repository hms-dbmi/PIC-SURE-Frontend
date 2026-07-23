import { describe, it, expect } from 'vitest';
import { summarize, type ResultCountSnapshot } from '$lib/services/counts/snapshot';

describe('summarize', () => {
  it('computes total via countResult for a scalar count', () => {
    expect(summarize(1234, false).total).toBe(1234);
  });

  it('returns total 0 when the count is 0', () => {
    expect(summarize(0, false).total).toBe(0);
  });

  it('hasNonZero is true for a non-zero count', () => {
    expect(summarize(5, false).hasNonZero).toBe(true);
  });

  it('hasNonZero is true for an obfuscated "< 10" value (privacy-suppressed non-zero counts must not be reported as zero)', () => {
    expect(summarize('< 10', false).hasNonZero).toBe(true);
  });

  it('hasNonZero is false when the count is zero', () => {
    expect(summarize(0, false).hasNonZero).toBe(false);
  });

  it('passes hasError through to the summary', () => {
    expect(summarize(0, true).hasError).toBe(true);
    expect(summarize(0, false).hasError).toBe(false);
  });
});

describe('ResultCountSnapshot shape', () => {
  it('is constructible as a plain object literal', () => {
    const snapshot: ResultCountSnapshot = {
      descriptorKey: 'key1',
      count: 100,
      summary: { total: 100, hasNonZero: true, hasError: false },
    };
    expect(snapshot.descriptorKey).toBe('key1');
  });
});
