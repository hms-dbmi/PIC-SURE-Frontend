import { afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { resetConfig } from '$lib/configuration.svelte';

// Config is a module-scope singleton (see src/lib/configuration.svelte.ts), so a
// test that seeds features/settings/branding would otherwise leak into the next
// test in the same file/worker. Reset it after every test.
afterEach(() => resetConfig());

// Node 22+ ships a built-in Web Storage API that exposes `globalThis.localStorage`
// as a getter returning `undefined` unless `--localstorage-file` is passed. On
// Node 26 this built-in shadows the `localStorage` that happy-dom would otherwise
// install, so component tests that touch storage crash. Install a small in-memory
// Storage when the environment doesn't provide a working one. No-op on Node <=24,
// where happy-dom already supplies localStorage.
if (typeof globalThis.localStorage === 'undefined') {
  class MemoryStorage implements Storage {
    #store = new Map<string, string>();
    get length(): number {
      return this.#store.size;
    }
    clear(): void {
      this.#store.clear();
    }
    getItem(key: string): string | null {
      return this.#store.has(key) ? this.#store.get(key)! : null;
    }
    key(index: number): string | null {
      return [...this.#store.keys()][index] ?? null;
    }
    removeItem(key: string): void {
      this.#store.delete(key);
    }
    setItem(key: string, value: string): void {
      this.#store.set(key, String(value));
    }
  }
  Object.defineProperty(globalThis, 'localStorage', {
    value: new MemoryStorage(),
    configurable: true,
    writable: true,
  });
}
