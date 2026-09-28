// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';

const mockRetry = vi.fn();
vi.mock('$lib/openSession', () => ({ retryOpenSession: () => mockRetry() }));

import SessionChallenge from '$lib/components/SessionChallenge.svelte';
import Turnstile from '$lib/components/Turnstile.svelte';
import {
  challengeState,
  solveSessionChallenge,
  SILENT_SOLVE_TIMEOUT_MS,
} from '$lib/sessionChallenge';
import { get } from 'svelte/store';

const SESSION_SITEKEY = '0x-session-sitekey';
const SESSION_ACTION = 'open-access-session';

function removeScripts() {
  document.querySelectorAll('script[src*="challenges.cloudflare.com"]').forEach((s) => s.remove());
}

describe('SessionChallenge', () => {
  let renderOptions: TurnstileRenderOptions | undefined;
  const turnstileRender = vi.fn((_container: HTMLElement, options: TurnstileRenderOptions) => {
    renderOptions = options;
    return 'session-widget';
  });
  const turnstileExecute = vi.fn();
  const turnstileRemove = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    renderOptions = undefined;
    challengeState.set('idle');
    vi.stubGlobal('turnstile', {
      render: turnstileRender,
      remove: turnstileRemove,
      execute: turnstileExecute,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    removeScripts();
  });

  // wrapped, so the async function doesn't adopt the token promise and wait on it
  async function startSolve(): Promise<{ token: Promise<string> }> {
    const token = solveSessionChallenge(SESSION_SITEKEY, SESSION_ACTION);
    // cleanup's unmount abandons a solve a test left pending; that rejection is expected
    token.catch(() => {});
    await waitFor(() => expect(turnstileRender).toHaveBeenCalledTimes(1));
    return { token };
  }

  it('takes no space and says nothing until Cloudflare needs an interaction', () => {
    render(SessionChallenge);

    const panel = screen.getByTestId('session-challenge');
    expect(panel.className).toBe('');
    expect(panel.getAttribute('role')).toBeNull();
    expect(panel.textContent?.trim()).toBe('');
    expect(screen.getByTestId('session-challenge-widget')).toBeInTheDocument();
  });

  it('renders the Managed widget interaction-only and executes it', async () => {
    render(SessionChallenge);

    const { token } = await startSolve();
    await waitFor(() => expect(turnstileExecute).toHaveBeenCalledWith('session-widget'));
    expect(turnstileRender.mock.calls[0][0]).toBe(screen.getByTestId('session-challenge-widget'));
    expect(renderOptions).toMatchObject({
      sitekey: SESSION_SITEKEY,
      action: SESSION_ACTION,
      appearance: 'interaction-only',
      execution: 'execute',
    });

    renderOptions?.callback('turnstile-token');
    await expect(token).resolves.toBe('turnstile-token');
  });

  it('waits for the shell to mount before rendering', async () => {
    const token = solveSessionChallenge(SESSION_SITEKEY, SESSION_ACTION);
    await Promise.resolve();
    expect(turnstileRender).not.toHaveBeenCalled();

    render(SessionChallenge);
    await waitFor(() => expect(turnstileRender).toHaveBeenCalledTimes(1));
    renderOptions?.callback('turnstile-token');
    await expect(token).resolves.toBe('turnstile-token');
  });

  it('shows the panel while an interaction is needed, and hides it after', async () => {
    render(SessionChallenge);
    const { token } = await startSolve();

    renderOptions?.['before-interactive-callback']?.();
    expect(await screen.findByText("Confirm you're human to keep browsing")).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Browser check' })).toBeInTheDocument();

    renderOptions?.['after-interactive-callback']?.();
    await waitFor(() =>
      expect(screen.queryByText("Confirm you're human to keep browsing")).not.toBeInTheDocument(),
    );
    renderOptions?.callback('turnstile-token');
    await token;
    expect(screen.getByTestId('session-challenge').className).toBe('');
  });

  it('shows a real message and a retry when the check fails', async () => {
    render(SessionChallenge);
    const { token } = await startSolve();

    renderOptions?.['error-callback']();
    await expect(token).rejects.toThrow();
    expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't confirm you're human");

    await fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  it('explains an unsupported browser, with a retry', async () => {
    render(SessionChallenge);
    const { token } = await startSolve();

    renderOptions?.['unsupported-callback']?.();
    await expect(token).rejects.toThrow();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      "This browser can't complete the check",
    );
    await fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  it('turns off automatic retries, since the panel is the retry', async () => {
    render(SessionChallenge);
    await startSolve();

    expect(renderOptions?.retry).toBe('never');
  });

  it('fails a timed-out interactive challenge', async () => {
    render(SessionChallenge);
    const { token } = await startSolve();

    renderOptions?.['before-interactive-callback']?.();
    renderOptions?.['timeout-callback']?.();
    await expect(token).rejects.toThrow();
    expect(await screen.findByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('ignores callbacks from a widget whose solve has settled', async () => {
    render(SessionChallenge);
    const { token } = await startSolve();
    const finished = renderOptions;
    finished?.callback('turnstile-token');
    await token;

    finished?.['error-callback']();
    finished?.['before-interactive-callback']?.();

    expect(get(challengeState)).toBe('idle');
    expect(turnstileRemove).toHaveBeenCalledWith('session-widget');
  });

  it('moves focus to the panel when an interaction is needed', async () => {
    render(SessionChallenge);
    await startSolve();

    renderOptions?.['before-interactive-callback']?.();

    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByTestId('session-challenge')),
    );
  });

  it('fails a silent solve that never answers, so waiting requests can go keyless', async () => {
    vi.useFakeTimers();
    try {
      render(SessionChallenge);
      const token = solveSessionChallenge(SESSION_SITEKEY, SESSION_ACTION);
      const settled = token.then(
        () => 'resolved',
        () => 'rejected',
      );
      await vi.waitFor(() => expect(turnstileRender).toHaveBeenCalledTimes(1));

      await vi.advanceTimersByTimeAsync(SILENT_SOLVE_TIMEOUT_MS);

      expect(await settled).toBe('rejected');
    } finally {
      vi.useRealTimers();
    }
  });

  it('lets an interactive solve take as long as the visitor needs', async () => {
    vi.useFakeTimers();
    try {
      render(SessionChallenge);
      const token = solveSessionChallenge(SESSION_SITEKEY, SESSION_ACTION);
      await vi.waitFor(() => expect(turnstileRender).toHaveBeenCalledTimes(1));
      renderOptions?.['before-interactive-callback']?.();

      await vi.advanceTimersByTimeAsync(SILENT_SOLVE_TIMEOUT_MS * 4);
      renderOptions?.callback('turnstile-token');

      await expect(token).resolves.toBe('turnstile-token');
    } finally {
      vi.useRealTimers();
    }
  });

  it('fails when Turnstile renders nothing', async () => {
    turnstileRender.mockReturnValueOnce(undefined as unknown as string);
    render(SessionChallenge);

    await expect(solveSessionChallenge(SESSION_SITEKEY, SESSION_ACTION)).rejects.toThrow();
    expect(turnstileExecute).not.toHaveBeenCalled();
  });

  it('settles a pending solve and removes the widget on unmount', async () => {
    const { unmount } = render(SessionChallenge);
    const { token } = await startSolve();

    unmount();

    await expect(token).rejects.toThrow();
    expect(turnstileRemove).toHaveBeenCalledWith('session-widget');
  });

  it('shows the retry when the Turnstile script fails to load', async () => {
    vi.unstubAllGlobals();
    render(SessionChallenge);
    const token = solveSessionChallenge(SESSION_SITEKEY, SESSION_ACTION);
    const script = await waitFor(() => {
      const found = document.querySelector('script[src*="challenges.cloudflare.com"]');
      expect(found).not.toBeNull();
      return found as HTMLScriptElement;
    });

    script.dispatchEvent(new Event('error'));

    await expect(token).rejects.toThrow();
    expect(await screen.findByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('renders a fresh widget for each solve and removes the previous one', async () => {
    render(SessionChallenge);
    const { token: first } = await startSolve();
    renderOptions?.callback('first');
    await first;

    const second = solveSessionChallenge(SESSION_SITEKEY, SESSION_ACTION);
    await waitFor(() => expect(turnstileRender).toHaveBeenCalledTimes(2));
    expect(turnstileRemove).toHaveBeenCalledWith('session-widget');
    renderOptions?.callback('second');
    await expect(second).resolves.toBe('second');
  });
});

describe('the session widget next to the API page widget', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    removeScripts();
  });

  it('shares one api.js script', async () => {
    const turnstileRender = vi.fn(() => 'widget');
    render(Turnstile, { props: { sitekey: '0x-api-page-sitekey', onToken: vi.fn() } });
    render(SessionChallenge);
    const script = await waitFor(() => {
      const found = document.querySelector('script[src*="challenges.cloudflare.com"]');
      expect(found).not.toBeNull();
      return found as HTMLScriptElement;
    });
    const token = solveSessionChallenge(SESSION_SITEKEY, SESSION_ACTION);

    vi.stubGlobal('turnstile', { render: turnstileRender, remove: vi.fn(), execute: vi.fn() });
    script.dispatchEvent(new Event('load'));

    await waitFor(() => expect(turnstileRender).toHaveBeenCalledTimes(2));
    expect(document.querySelectorAll('script[src*="challenges.cloudflare.com"]')).toHaveLength(1);
    void token.catch(() => {});
  });
});
