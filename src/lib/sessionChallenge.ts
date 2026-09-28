import { writable, type Writable } from 'svelte/store';
import { loadTurnstile } from '$lib/turnstile';

// idle: nothing on screen. interactive: Cloudflare wants a click. error / unsupported: the solve
// failed and the panel says so, with a retry
export type ChallengeState = 'idle' | 'interactive' | 'error' | 'unsupported';

export const challengeState: Writable<ChallengeState> = writable('idle');

// a non-interactive solve that hasn't answered by then is treated as failed, so waiting requests
// go out keyless; an interactive one waits for the person, however long they take
export const SILENT_SOLVE_TIMEOUT_MS = 30_000;

let container: HTMLElement | undefined;
let widgetId: string | undefined;
let abandonPending: (() => void) | undefined;
let resolveContainer: (element: HTMLElement) => void = () => {};
let containerReady = nextContainer();

function nextContainer(): Promise<HTMLElement> {
  return new Promise((resolve) => {
    resolveContainer = resolve;
  });
}

function removeWidget() {
  if (widgetId) window.turnstile?.remove(widgetId);
  widgetId = undefined;
}

/**
 * Called by SessionChallenge.svelte when it mounts. A solve requested before then (a page's first
 * data request can run before the shell's onMount) waits for the container.
 */
export function attachChallengeContainer(element: HTMLElement): () => void {
  container = element;
  resolveContainer(element);
  return () => {
    abandonPending?.();
    removeWidget();
    container = undefined;
    containerReady = nextContainer();
  };
}

/**
 * Runs the session widget once and resolves with its token. The widget is Managed, rendered
 * interaction-only, so most visitors see nothing; the rest get the panel until they click.
 */
export async function solveSessionChallenge(sitekey: string, action: string): Promise<string> {
  const element = container ?? (await containerReady);
  const turnstile = await loadTurnstile().catch((error) => {
    challengeState.set('error');
    throw error;
  });
  // a fresh widget per solve; the previous one, if any, is finished
  removeWidget();

  return new Promise((resolve, reject) => {
    // filled in once render returns; the callbacks below may refer to it before then
    const solve: { settled: boolean; id?: string; silentTimer?: ReturnType<typeof setTimeout> } = {
      settled: false,
    };

    // settles once, and only for this solve's widget: a finished widget can still fire callbacks
    function settle(state: ChallengeState, outcome: () => void) {
      if (solve.settled) return;
      solve.settled = true;
      clearTimeout(solve.silentTimer);
      abandonPending = undefined;
      challengeState.set(state);
      if (widgetId === solve.id) removeWidget();
      outcome();
    }
    const fail = (state: ChallengeState, message: string) => () =>
      settle(state, () => reject(new Error(message)));

    abandonPending = fail('idle', 'The browser check was abandoned');
    solve.id = turnstile.render(element, {
      sitekey,
      action,
      theme: 'auto',
      appearance: 'interaction-only',
      execution: 'execute',
      // the panel's "Try again" is the retry; an automatic one would settle a solve already failed
      retry: 'never',
      callback: (token: string) => settle('idle', () => resolve(token)),
      // the token is spent on issuance straight away; a later expiry means nothing
      'expired-callback': () => {},
      'error-callback': fail('error', 'Turnstile could not verify this browser'),
      // the visitor didn't finish an interactive challenge in time; they can try again
      'timeout-callback': fail('error', 'The browser check timed out'),
      'unsupported-callback': fail('unsupported', 'This browser is not supported by Turnstile'),
      'before-interactive-callback': () => {
        if (solve.settled) return;
        clearTimeout(solve.silentTimer);
        challengeState.set('interactive');
      },
      'after-interactive-callback': () => {
        if (!solve.settled) challengeState.set('idle');
      },
    });
    if (!solve.id) {
      fail('error', 'Turnstile did not render')();
      return;
    }
    widgetId = solve.id;
    solve.silentTimer = setTimeout(
      fail('error', 'The browser check did not answer'),
      SILENT_SOLVE_TIMEOUT_MS,
    );
    turnstile.execute?.(solve.id);
  });
}
