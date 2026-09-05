import { browser } from '$app/environment';
import { beforeNavigate, goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { onDestroy } from 'svelte';

export interface NavigationTransition {
  kind: 'navigation';
  url: URL | null;
}

export type GuardedTransition<T> = T | NavigationTransition;

export interface UnsavedGuard<T> {
  /** Whether a transition is pending confirmation. Settable to false so a Modal can bind to it. */
  open: boolean;
  readonly pending: GuardedTransition<T> | null;
  /**
   * Ask to run a transition. Returns true when it was intercepted for confirmation;
   * false means there are no unsaved changes and the caller should proceed directly.
   */
  intercept(transition: T): boolean;
  /** Close the confirmation and return the transition that was pending, if any. */
  take(): GuardedTransition<T> | null;
  /** Navigate without re-triggering the guard. */
  navigate(target: URL | string): Promise<void>;
}

/**
 * Must be created during component initialisation: it registers beforeNavigate
 * and cleans up its beforeunload listener with onDestroy.
 */
export function createUnsavedGuard<T extends { kind: string } = never>(
  isDirty: () => boolean,
): UnsavedGuard<T> {
  let pending: GuardedTransition<T> | null = $state(null);
  let bypass = false;

  beforeNavigate(({ to, cancel, willUnload }) => {
    // Unload navigations are handled by the beforeunload listener; a modal cannot
    // be shown once the page is being torn down.
    if (bypass || willUnload || !isDirty()) return;
    cancel();
    pending = { kind: 'navigation', url: to?.url ?? null };
  });

  if (browser) {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isDirty()) event.preventDefault();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    onDestroy(() => window.removeEventListener('beforeunload', handleBeforeUnload));
  }

  return {
    get open() {
      return pending !== null;
    },
    set open(value: boolean) {
      if (!value) pending = null;
    },
    get pending() {
      return pending;
    },
    intercept(transition: T): boolean {
      if (!isDirty()) return false;
      pending = transition;
      return true;
    },
    take() {
      const transition = pending;
      pending = null;
      return transition;
    },
    async navigate(target: URL | string) {
      const path =
        typeof target === 'string' ? target : `${target.pathname}${target.search}${target.hash}`;
      bypass = true;
      try {
        await goto(resolve(path as '/'));
      } finally {
        bypass = false;
      }
    },
  };
}
