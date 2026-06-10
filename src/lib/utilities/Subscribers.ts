import { type Readable, type Unsubscriber } from 'svelte/store';

/**
 * Subscribes to a store but skips the initial synchronous fire,
 * only calling `fn` on subsequent changes.
 */
export function subscribeOnChange<T>(store: Readable<T>, fn: (value: T) => void): Unsubscriber {
  let initialized = false;
  return store.subscribe((value) => {
    if (!initialized) {
      initialized = true;
      return;
    }
    fn(value);
  });
}
