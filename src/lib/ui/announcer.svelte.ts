import { onDestroy } from 'svelte';

export interface AnnouncerOptions {
  /** Waits this long before speaking, and restarts the wait on every call (a debounce). */
  delay?: number;
  /** Empties the region this long after speaking, so stale text doesn't linger. */
  clearAfter?: number;
  /** Speaks a message again when it equals the current one. Off: an identical message is dropped. */
  repeat?: boolean;
}

// Long enough for screen readers to notice the region emptied before the repeated text arrives.
const REPEAT_GAP_MS = 30;

/** The message a `LiveRegion` speaks: debounced, optionally repeated, optionally cleared. */
export class Announcer {
  message = $state('');
  // Mirrors `message` without tracking, so an effect that calls announce() doesn't depend on it.
  #current = '';
  #timer: ReturnType<typeof setTimeout> | undefined;
  #settle: ((shown: boolean) => void) | undefined;
  readonly #options: AnnouncerOptions;

  constructor(options: AnnouncerOptions = {}) {
    this.#options = options;
  }

  /** Resolves true once the message is in the region, false if a later call or cancel() replaced it. */
  announce(text: string): Promise<boolean> {
    this.cancel();
    const { delay = 0, clearAfter, repeat = false } = this.#options;
    return new Promise((resolve) => {
      this.#settle = resolve;
      this.#timer = setTimeout(() => {
        if (text !== this.#current) return this.#show(text, clearAfter);
        if (!repeat) return this.#finish(true);
        this.#set('');
        this.#timer = setTimeout(() => this.#show(text, clearAfter), REPEAT_GAP_MS);
      }, delay);
    });
  }

  /** Drops a pending message; what the region already says stays. */
  cancel() {
    clearTimeout(this.#timer);
    this.#finish(false);
  }

  #show(text: string, clearAfter: number | undefined) {
    this.#set(text);
    this.#finish(true);
    if (clearAfter !== undefined) this.#timer = setTimeout(() => this.#set(''), clearAfter);
  }

  #set(text: string) {
    this.#current = text;
    this.message = text;
  }

  #finish(shown: boolean) {
    this.#settle?.(shown);
    this.#settle = undefined;
  }
}

/** An Announcer whose timers stop with the component that creates it. Call during component init. */
export function createAnnouncer(options?: AnnouncerOptions): Announcer {
  const announcer = new Announcer(options);
  onDestroy(() => announcer.cancel());
  return announcer;
}
