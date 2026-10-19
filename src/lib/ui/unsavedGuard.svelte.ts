import { browser } from '$app/env';
import { beforeNavigate, goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { appPath } from '#lib/api/paths.ts';
import { createContext, onDestroy } from 'svelte';

export interface NavigationTransition {
  kind: 'navigation';
  url: URL | null;
}

/** A request from the page around a guard, such as a tab change, that discarding goes on with. */
export interface LeaveRequest {
  kind: 'leave';
  /** Where the request goes, for the confirmation's wording. */
  destination: string;
  proceed: () => void;
}

export type GuardedTransition<T> = T | NavigationTransition | LeaveRequest;

interface RegisteredGuard {
  isDirty: () => boolean;
  confirm: (request: LeaveRequest) => void;
}

/**
 * The unsaved-changes guards inside one part of a page. The component that owns the part (the
 * configuration page around its tabs) creates it and provides it with `setUnsavedChanges`; every
 * guard created below it registers itself, so the owner can ask before switching away. A guard's
 * discard handler must call the `leave` request's `proceed()`, or the switch never happens.
 */
export class UnsavedChanges {
  #guards: RegisteredGuard[] = [];

  register(guard: RegisteredGuard): () => void {
    this.#guards.push(guard);
    return () => {
      this.#guards = this.#guards.filter((registered) => registered !== guard);
    };
  }

  /**
   * Runs `proceed` now when no guard has unsaved changes. Otherwise the guard with changes asks
   * first, and runs it if they're discarded.
   */
  request(destination: string, proceed: () => void) {
    const dirty = this.#guards.find((guard) => guard.isDirty());
    if (dirty) dirty.confirm({ kind: 'leave', destination, proceed });
    else proceed();
  }
}

const [getUnsavedChanges, setUnsavedChanges, hasUnsavedChanges] = createContext<UnsavedChanges>();
export { setUnsavedChanges };

export interface UnsavedGuard<T> {
  /** Whether a transition is pending confirmation. Settable to false so a Dialog can bind to it. */
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
 * Must be created during component initialisation: it registers beforeNavigate, cleans up its
 * beforeunload listener with onDestroy, and joins the UnsavedChanges provided above it, if any.
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

  if (hasUnsavedChanges()) {
    onDestroy(
      getUnsavedChanges().register({
        isDirty,
        confirm: (request) => (pending = request),
      }),
    );
  }

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
        await goto(resolve(appPath(path)));
      } finally {
        bypass = false;
      }
    },
  };
}
