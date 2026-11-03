import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NavigationEvent } from '@sveltejs/kit';

const logger = vi.hoisted(() => ({ log: vi.fn(), createLog: vi.fn() }));
vi.mock('#lib/telemetry/logger.ts', () => logger);
const { goto, session } = vi.hoisted(() => ({
  goto: vi.fn(),
  session: { connect: vi.fn() },
}));
vi.mock('$app/navigation', () => ({ goto }));
vi.mock('$app/paths', () => ({ resolve: (path: string) => `/base/${path}` }));
vi.mock('$app/state', () => ({ page: { url: new URL('https://picsure.test/explorer?q=1') } }));
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
});
