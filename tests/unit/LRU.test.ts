import { describe, it, expect } from 'vitest';
import { LRU } from '$lib/utilities/LRU';

describe('LRU', () => {
  it('returns undefined for a missing key', () => {
    const lru = new LRU<string, number>(2);
    expect(lru.get('a')).toBeUndefined();
  });

  it('stores and retrieves a value by key', () => {
    const lru = new LRU<string, number>(2);
    lru.set('a', 1);
    expect(lru.get('a')).toBe(1);
  });

  it('overwrites an existing key without growing size', () => {
    const lru = new LRU<string, number>(2);
    lru.set('a', 1);
    lru.set('a', 2);
    expect(lru.size).toBe(1);
    expect(lru.get('a')).toBe(2);
  });

  it('evicts the oldest entry when capacity is exceeded', () => {
    const lru = new LRU<string, number>(2);
    lru.set('a', 1);
    lru.set('b', 2);
    lru.set('c', 3);
    expect(lru.get('a')).toBeUndefined();
    expect(lru.get('b')).toBe(2);
    expect(lru.get('c')).toBe(3);
  });

  it('bumps a recently-read key so it is not the next eviction target', () => {
    const lru = new LRU<string, number>(2);
    lru.set('a', 1);
    lru.set('b', 2);
    // Reading 'a' bumps it; 'b' is now oldest.
    lru.get('a');
    lru.set('c', 3);
    expect(lru.get('a')).toBe(1);
    expect(lru.get('b')).toBeUndefined();
    expect(lru.get('c')).toBe(3);
  });

  it('clear() empties the cache', () => {
    const lru = new LRU<string, number>(2);
    lru.set('a', 1);
    lru.set('b', 2);
    lru.clear();
    expect(lru.size).toBe(0);
    expect(lru.get('a')).toBeUndefined();
  });
});
