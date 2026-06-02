import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

import { isIndexable, flatIndex } from '$lib/utilities/Objects';
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
});
