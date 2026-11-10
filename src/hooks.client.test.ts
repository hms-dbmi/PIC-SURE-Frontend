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
  it('sends unexpected errors to telemetry with their name and stack', async () => {
    const error = new TypeError('boom');
    error.stack = 'TypeError: boom\n    at load (app.js:1:2)';
    await handleError({ kind: 'unknown', error, event });

    expect(logger.log).toHaveBeenCalledWith(
      {
        event_type: 'ERROR',
        action: 'client.error',
        metadata: {
          kind: 'unknown',
          name: 'TypeError',
          message: 'boom',
          stack: 'TypeError: boom\n    at load (app.js:1:2)',
          route: '/explorer',
        },
      },
      { keepalive: true },
    );
  });

  it('caps the stack so the logging service accepts the event', async () => {
    const error = new Error('boom');
    error.stack = 'x'.repeat(20_000);
    await handleError({ kind: 'unknown', error, event });

    expect(logger.createLog.mock.calls[0][2].stack).toHaveLength(4000);
  });

  it('logs thrown values that are not Errors as a message', async () => {
    await handleError({ kind: 'unknown', error: 'plain string', event });

    expect(logger.createLog).toHaveBeenCalledWith('ERROR', 'client.error', {
      kind: 'unknown',
      message: 'plain string',
      route: '/explorer',
    });
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

  it('lets the session run the guards again, settling with the navigations that replaced them', async () => {
    await init();
    const shell: SessionShell = session.connect.mock.calls[0][0];
    const first = Promise.withResolvers<void>();
    const second = Promise.withResolvers<void>();
    navigating.complete = first.promise;
    let settled = false;

    const rerun = shell.rerunGuards().then(() => (settled = true));
    await new Promise((resolve) => setTimeout(resolve));
    navigating.complete = second.promise;
    first.reject(new Error('navigation aborted'));
    await new Promise((resolve) => setTimeout(resolve));
    expect(invalidateAll).toHaveBeenCalledOnce();
    expect(settled).toBe(false);

    second.resolve();
    navigating.complete = null;
    await rerun;
    expect(settled).toBe(true);
  });
});
