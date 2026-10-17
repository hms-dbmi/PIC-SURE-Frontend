import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NavigationEvent } from '@sveltejs/kit';

const logger = vi.hoisted(() => ({ log: vi.fn(), createLog: vi.fn() }));
vi.mock('#lib/logger.ts', () => logger);

import { handleError } from './hooks.client';

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

    expect(logger.log).toHaveBeenCalledWith({
      event_type: 'ERROR',
      action: 'client.error',
      metadata: { kind: 'unknown', message: 'boom', route: '/explorer' },
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
