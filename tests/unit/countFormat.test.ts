import { describe, it, expect } from 'vitest';
import {
  countResult,
  isCountValueEqual,
  isObfuscatedBelowThreshold,
} from '$lib/services/counts/countFormat';

describe('countResult', () => {
  it('returns "0" for an empty list (string mode)', () => {
    expect(countResult([])).toBe('0');
  });

  it('returns 0 for an empty list (numeric mode)', () => {
    expect(countResult([], false)).toBe(0);
  });

  it('sums numeric and comma-string counts and formats with locale separators', () => {
    expect(countResult(['1,000', 2000, '3,000'])).toBe('6,000');
  });

  it('returns the numeric total when asString is false', () => {
    expect(countResult(['1,000', 2000], false)).toBe(3000);
  });

  it('carries the max ±suffix into the formatted total', () => {
    expect(countResult(['10', '20±3'])).toBe('30±3');
  });

  it('flattens a PatientCountMap before summing', () => {
    expect(countResult([{ a: 10, b: 20 }, 5])).toBe('35');
  });

  it('preserves a lone "< 10" obfuscated value', () => {
    expect(countResult(['< 10'])).toBe('< 10');
  });

  it('prefers the "< 10" string over "0" when the numeric total is zero', () => {
    expect(countResult(['< 10', 0])).toBe('< 10');
  });
});

describe('isCountValueEqual', () => {
  it('treats comma-formatted strings and numbers as equal', () => {
    expect(isCountValueEqual('9,999', 9999)).toBe(true);
  });

  it('returns false for differing scalars', () => {
    expect(isCountValueEqual('9,999', 1234)).toBe(false);
  });

  it('compares PatientCountMap values key-by-key with comma normalization', () => {
    expect(isCountValueEqual({ a: '1,000' }, { a: 1000 })).toBe(true);
    expect(isCountValueEqual({ a: '1,000' }, { a: 2000 })).toBe(false);
  });

  it('returns false when maps have different key counts', () => {
    expect(isCountValueEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
  });
});

describe('isObfuscatedBelowThreshold', () => {
  it('is true for "< 10" strings', () => {
    expect(isObfuscatedBelowThreshold('< 10')).toBe(true);
  });

  it('is true for leading-space variants like " < 10"', () => {
    expect(isObfuscatedBelowThreshold(' < 10')).toBe(true);
  });

  it('is false for an explicit numeric small count', () => {
    expect(isObfuscatedBelowThreshold(7)).toBe(false);
  });

  it('is false for non-obfuscated strings', () => {
    expect(isObfuscatedBelowThreshold('9,999')).toBe(false);
  });
});
