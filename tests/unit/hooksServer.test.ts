import { afterEach, describe, expect, it, vi } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';
import { handleError } from '../../src/hooks.server';

function makeEvent(path: string, routeId: string | null): RequestEvent {
  return {
    request: new Request(`http://localhost${path}`, {
      method: 'POST',
      headers: { Authorization: 'Bearer secret-token' },
    }),
    url: new URL(`http://localhost${path}`),
    route: { id: routeId },
  } as unknown as RequestEvent;
}

describe('server handleError', () => {
  afterEach(() => vi.restoreAllMocks());

  it('logs an unexpected error with its request context but not the request headers', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const boom = new Error('boom');

    const result = handleError({
      kind: 'unknown',
      error: boom,
      event: makeEvent('/api/v1/log', '/api/v1/log'),
    });

    expect(result).toBeUndefined();
    expect(errorSpy).toHaveBeenCalledOnce();
    expect(errorSpy).toHaveBeenCalledWith('Server error: ', boom, {
      method: 'POST',
      path: '/api/v1/log',
      route: '/api/v1/log',
    });
  });

  it('logs expected and framework errors as a single line', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = handleError({
      kind: 'framework',
      error: { status: 404, message: 'Not Found' },
      event: makeEvent('/missing', null),
    });

    expect(result).toBeUndefined();
    expect(errorSpy).toHaveBeenCalledExactlyOnceWith(
      'Server error (framework): 404 Not Found at /missing',
    );
  });
});
