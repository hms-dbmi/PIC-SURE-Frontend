import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NavigationEvent } from '@sveltejs/kit';

const logger = vi.hoisted(() => ({ log: vi.fn(), createLog: vi.fn() }));
vi.mock('#lib/telemetry/logger.ts', () => logger);
const { goto, invalidateAll, session } = vi.hoisted(() => ({
  goto: vi.fn(),
  invalidateAll: vi.fn(),
  session: { connect: vi.fn() },
}));
vi.mock('$app/navigation', () => ({ goto, invalidateAll }));
vi.mock('$app/paths', () => ({ resolve: (path: string) => `/base/${path}` }));
const navigating = vi.hoisted(() => ({ complete: null as Promise<void> | null }));
vi.mock('$app/state', () => ({
  navigating,
  page: { url: new URL('https://picsure.test/explorer?q=1') },
}));
vi.mock('#lib/auth/session.svelte.ts', () => ({ session }));

import { handleError, init } from './hooks.client';
import type { SessionShell } from '#lib/auth/session.svelte.ts';

const event = { route: { id: '/explorer' } } as unknown as NavigationEvent;

beforeEach(() => {
  logger.log.mockReset();
  logger.createLog.mockReset().mockImplementation((type, action, metadata) => ({
    event_type: type,
    action,
    metadata,
  }));
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('client handleError', () => {
  it('sends unexpected errors to telemetry', async () => {
    await handleError({ kind: 'unknown', error: new Error('boom'), event });

    expect(logger.log).toHaveBeenCalledWith(
      {
        event_type: 'ERROR',
        action: 'client.error',
        metadata: { kind: 'unknown', message: 'boom', route: '/explorer' },
      },
      { keepalive: true },
    );
  });

  it('sends framework errors with their status', async () => {
    await handleError({ kind: 'framework', error: { status: 404, message: 'Not Found' }, event });

    expect(logger.createLog).toHaveBeenCalledWith('ERROR', 'client.error', {
      kind: 'framework',
      status: 404,
      message: 'Not Found',
      route: '/explorer',
    });
    expect(logger.log).toHaveBeenCalledWith(expect.anything(), { keepalive: true });
  });

  it('never throws, even when logging fails', () => {
    logger.createLog.mockImplementation(() => {
      throw new Error('no sessionStorage');
    });

    expect(
      () => void handleError({ kind: 'unknown', error: new Error('boom'), event }),
    ).not.toThrow();
  });
});

describe('client init', () => {
  it('lets the session navigate within the app and read the page on screen', async () => {
    await init();
    const shell: SessionShell = session.connect.mock.calls[0][0];

    await shell.navigate('/login?redirectTo=%2Fexplorer');

    expect(goto).toHaveBeenCalledWith('/base/login?redirectTo=%2Fexplorer');
    expect(shell.currentUrl()).toMatchObject({ pathname: '/explorer', search: '?q=1' });
  });

  it('lets the session run the guards again, settling once a navigation that replaced them has', async () => {
    await init();
    const shell: SessionShell = session.connect.mock.calls[0][0];
    let completeNavigation = () => {};
    navigating.complete = new Promise<void>((resolve) => (completeNavigation = resolve));
    let settled = false;

    const rerun = shell.rerunGuards().then(() => (settled = true));
    await Promise.resolve();
    await Promise.resolve();
    expect(invalidateAll).toHaveBeenCalledOnce();
    expect(settled).toBe(false);

    completeNavigation();
    await rerun;
    expect(settled).toBe(true);
  });
});
