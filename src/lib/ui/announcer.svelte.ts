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
  #pending: ReturnType<typeof setTimeout> | undefined;
  #clear: ReturnType<typeof setTimeout> | undefined;
  #settle: ((shown: boolean) => void) | undefined;
  readonly #options: AnnouncerOptions;

  constructor(options: AnnouncerOptions = {}) {
    this.#options = options;
  }

  /** Resolves true once the message is in the region, false if a later call or cancel() replaced it. */
  announce(text: string): Promise<boolean> {
    this.cancel();
    const { delay = 0, repeat = false } = this.#options;
    return new Promise((resolve) => {
      this.#settle = resolve;
      this.#pending = setTimeout(() => {
        if (text !== this.message) return this.#show(text);
        if (!repeat) return this.#finish(true);
        this.message = '';
        this.#pending = setTimeout(() => this.#show(text), REPEAT_GAP_MS);
      }, delay);
    });
  }

  /** Drops a pending message; what the region already says stays until clearAfter. */
  cancel() {
    clearTimeout(this.#pending);
    this.#finish(false);
  }

  /** Stops every timer, including the pending clear. */
  destroy() {
    this.cancel();
    clearTimeout(this.#clear);
  }

  #show(text: string) {
    const { clearAfter } = this.#options;
    this.message = text;
    this.#finish(true);
    clearTimeout(this.#clear);
    if (clearAfter !== undefined) this.#clear = setTimeout(() => (this.message = ''), clearAfter);
  }

  #finish(shown: boolean) {
    this.#settle?.(shown);
    this.#settle = undefined;
  }
}

/** An Announcer whose timers stop with the component that creates it. Call during component init. */
export function createAnnouncer(options?: AnnouncerOptions): Announcer {
  const announcer = new Announcer(options);
  onDestroy(() => announcer.destroy());
  return announcer;
}
