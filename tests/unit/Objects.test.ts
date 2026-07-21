import { describe, it, expect } from 'vitest';

import { isIndexable, flatIndex, deepMerge } from '$lib/utilities/Objects';
import type { Indexable } from '$lib/types';

describe('Object utilities', () => {
  describe('isIndexable', () => {
    it('returns false if array', () => {
      expect(isIndexable(['string', 'value'])).toBeFalsy();
      expect(isIndexable([2, 1])).toBeFalsy();
      expect(isIndexable([false, true])).toBeFalsy();
      expect(isIndexable([{ key: 'value' }])).toBeFalsy();
      expect(isIndexable([])).toBeFalsy();
    });
    it('returns false if string', () => {
      expect(isIndexable('string value')).toBeFalsy();
    });
    it('returns false if boolean', () => {
      expect(isIndexable(true)).toBeFalsy();
      expect(isIndexable(false)).toBeFalsy();
    });
    it('returns false if null', () => {
      expect(isIndexable(null)).toBeFalsy();
    });
    it('returns false if undefined', () => {
      expect(isIndexable(undefined)).toBeFalsy();
    });
    it('returns true if indexable', () => {
      const data: Indexable = {
        key: 'value',
        key2: {},
      };
      expect(isIndexable(data)).toBeTruthy();
    });
  });
  describe('flatIndex', () => {
    it('should return nested indexes as prefixed key,value pairs', () => {
      const testData: Indexable = {
        tree: 'green',
        rock: 'brown',
        flower: {
          rose: 'red',
          lilac: 'purple',
          'morning-glory': 'blue',
        },
      };
      const expected: Indexable = {
        tree: 'green',
        rock: 'brown',
        'flower.rose': 'red',
        'flower.lilac': 'purple',
        'flower.morning-glory': 'blue',
      };
      expect(flatIndex(testData)).toEqual(expect.objectContaining(expected));
    });
  });
  describe('deepMerge', () => {
    it('overrides matching top-level keys from B onto A', () => {
      const a = { name: 'default', count: 1 };
      const b = { name: 'custom' };
      expect(deepMerge(a, b)).toEqual({ name: 'custom', count: 1 });
    });

    it('keeps keys only present in A', () => {
      const a = { name: 'default', count: 1 };
      const b = {};
      expect(deepMerge(a, b)).toEqual({ name: 'default', count: 1 });
    });

    it('adds keys only present in B', () => {
      const a = { name: 'default' };
      const b = { extra: 'value' };
      expect(deepMerge(a, b)).toEqual({ name: 'default', extra: 'value' });
    });

    it('keeps A default when B explicitly has undefined for a key', () => {
      const a = { name: 'default' };
      const b = { name: undefined };
      expect(deepMerge(a, b)).toEqual({ name: 'default' });
    });

    it('recursively merges nested plain objects', () => {
      const a = { google: { analytics: '', tagManager: 'GTM-DEFAULT' } };
      const b = { google: { analytics: 'G-TEST123' } };
      expect(deepMerge(a, b)).toEqual({
        google: { analytics: 'G-TEST123', tagManager: 'GTM-DEFAULT' },
      });
    });

    it('merges deeply nested objects at multiple levels', () => {
      const a = { explorer: { flags: { allowExport: true, allowDownload: true } } };
      const b = { explorer: { flags: { allowExport: false } } };
      expect(deepMerge(a, b)).toEqual({
        explorer: { flags: { allowExport: false, allowDownload: true } },
      });
    });

    it('replaces arrays in A with arrays from B rather than merging elements', () => {
      const a = { tags: ['a', 'b', 'c'] };
      const b = { tags: ['z'] };
      expect(deepMerge(a, b)).toEqual({ tags: ['z'] });
    });

    it('lets B win outright when B value is a primitive replacing an A object', () => {
      const a = { setting: { nested: true } };
      const b = { setting: 'flat-string' };
      expect(deepMerge(a, b)).toEqual({ setting: 'flat-string' });
    });

    it('lets B win outright when B value is null', () => {
      const a = { setting: { nested: true } };
      const b = { setting: null };
      expect(deepMerge(a, b)).toEqual({ setting: null });
    });

    it('returns A unchanged when B is not a plain object (null)', () => {
      const a = { name: 'default' };
      expect(deepMerge(a, null)).toEqual(a);
    });

    it('returns A unchanged when B is not a plain object (array)', () => {
      const a = { name: 'default' };
      expect(deepMerge(a, ['not', 'an', 'object'])).toEqual(a);
    });

    it('returns A unchanged when B is not a plain object (primitive)', () => {
      const a = { name: 'default' };
      expect(deepMerge(a, 'string value')).toEqual(a);
      expect(deepMerge(a, 42)).toEqual(a);
      expect(deepMerge(a, undefined)).toEqual(a);
    });

    it('does not mutate the original A object, including nested objects', () => {
      const a = { google: { analytics: '', tagManager: 'GTM-DEFAULT' } };
      const b = { google: { analytics: 'G-TEST123' } };

      const result = deepMerge(a, b);

      expect(a).toEqual({ google: { analytics: '', tagManager: 'GTM-DEFAULT' } });
      expect(result).not.toBe(a);
      expect(result.google).not.toBe(a.google);
    });
  });
});
