import { describe, expect, it } from 'vitest';

import { truncate, visibleLength } from '$lib/utilities/Strings';

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

  it('never splits multi-code-point graphemes such as flags', () => {
    expect(truncate('🇺🇸'.repeat(10), 5)).toBe(`${'🇺🇸'.repeat(4)}…`);
  });

  it('keeps combining marks attached to the last visible character', () => {
    const accented = 'é';
    expect(truncate(accented.repeat(10), 5)).toBe(`${accented.repeat(4)}…`);
  });

  it('treats text at the limit in graphemes as fitting even when longer in UTF-16 units', () => {
    const text = `${'A'.repeat(4)}😀`;
    expect(text.length).toBe(6);
    expect(truncate(text, 5)).toBe(text);
  });
});

describe('visibleLength', () => {
  it('counts graphemes rather than UTF-16 units or code points', () => {
    expect(visibleLength('')).toBe(0);
    expect(visibleLength('abc')).toBe(3);
    expect(visibleLength('😀')).toBe(1);
    expect(visibleLength('🇺🇸')).toBe(1);
    expect(visibleLength('é')).toBe(1);
    expect(visibleLength('👨‍👩‍👧')).toBe(1);
  });

  it('matches the unit truncate uses to decide whether text overflows', () => {
    const text = `${'A'.repeat(149)}😀`;
    expect(visibleLength(text) > 150).toBe(false);
    expect(truncate(text, 150)).toBe(text);
  });
});
