import { describe, expect, it } from 'vitest';

import { truncate } from '$lib/utilities/Strings';

describe('truncate', () => {
  it('returns text at or under the limit unchanged', () => {
    expect(truncate('short', 5)).toBe('short');
  });

  it('caps overflowing text at the limit including the ellipsis', () => {
    expect(truncate('abcdefgh', 5)).toBe('abcd…');
  });

  it('trims trailing whitespace before the ellipsis', () => {
    expect(truncate('abc     def', 5)).toBe('abc…');
  });

  it('never splits surrogate pairs', () => {
    const truncated = truncate('🎉'.repeat(10), 5);
    expect(truncated).toBe(`${'🎉'.repeat(4)}…`);
    expect(truncated.includes('�')).toBe(false);
  });
});
