import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { error } from '@sveltejs/kit';

const { get, notReady } = vi.hoisted(() => ({
  get: vi.fn(),
  notReady: { status: 409, body: { message: '{"errorType":"result_not_ready"}' } },
}));

type Refusal = { status?: number; body?: { message?: string; errorType?: string } } | undefined;

vi.mock('$lib/api', () => ({
  get,
  isResultNotReady: (e: unknown) => e === notReady,
  isSampleDisabled: (e: Refusal) =>
    e?.status === 400 && String(e.body?.message).includes('sample_disabled'),
  consentDeniedMessage: (e: Refusal) =>
    e?.status === 403 && e.body?.errorType === 'consent_denied' ? e.body.message : undefined,
}));

import {
  EXPORT_NOT_READY_MESSAGE,
  EXPORT_PREPARE_FAILED_MESSAGE,
  SAMPLE_DISABLED_MESSAGE,
  fetchWhenReady,
  isExportFailure,
  isSessionEnded,
  isStatusRefusal,
  statusWaitFailureMessage,
  trackNotReady,
  waitUntilAvailable,
} from '$lib/services/exportStatus';

function httpError(status: number, body: string | App.Error): unknown {
  try {
    error(status, body as string);
  } catch (e) {
    return e;
  }
}

const SAMPLE_DISABLED_BODY = '{"errorType":"sample_disabled","message":"Sampling is off"}';
const CONSENT_DENIED_BODY = { message: 'You no longer have consent', errorType: 'consent_denied' };

const STATUS_PATH = 'picsure/hpds/auth/query/query-1/status';
const LAST_ATTEMPT_AT_MS = 500 + 1000 + 2000 + 4000 + 8000 + 16000 + 32000 + 7 * 60000;

describe('waitUntilAvailable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('resolves when status becomes AVAILABLE', async () => {
    get
      .mockResolvedValueOnce({ status: 'PENDING' })
      .mockResolvedValueOnce({ status: 'QUEUED' })
      .mockResolvedValueOnce({ status: 'AVAILABLE' });

    const waiting = waitUntilAvailable('query-1');
    await vi.advanceTimersByTimeAsync(5000);

    await expect(waiting).resolves.toBeUndefined();
    expect(get).toHaveBeenCalledTimes(3);
    expect(get).toHaveBeenCalledWith('picsure/hpds/auth/query/query-1/status');
  });

  it('resolves at once when status is SUCCESS', async () => {
    get.mockResolvedValueOnce({ status: 'SUCCESS' });

    await expect(waitUntilAvailable('query-1')).resolves.toBeUndefined();
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('stops on ERROR', async () => {
    get.mockResolvedValue({ status: 'ERROR' });

    const failure = await waitUntilAvailable('query-1').catch((e: unknown) => e);

    expect(failure).toBeInstanceOf(Error);
    expect((failure as Error).message).toBe('Export failed with status: ERROR');
    expect(isExportFailure(failure)).toBe(true);
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('keeps polling after a failed status request', async () => {
    get.mockRejectedValueOnce(new Error('502')).mockResolvedValueOnce({ status: 'AVAILABLE' });

    const waiting = waitUntilAvailable('query-1');
    await vi.advanceTimersByTimeAsync(1000);

    await expect(waiting).resolves.toBeUndefined();
    expect(get).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['400 sample_disabled', () => httpError(400, SAMPLE_DISABLED_BODY)],
    ['400 bad_request', () => httpError(400, '{"errorType":"bad_request"}')],
    ['consent-denied 403', () => httpError(403, CONSENT_DENIED_BODY)],
    ['403 that ended the session', () => httpError(403, 'Forbidden')],
    ['404', () => httpError(404, 'Not Found')],
  ])('stops at once on a %s from the status request', async (_name, makeRefusal) => {
    const refusal = makeRefusal();
    get.mockRejectedValue(refusal);

    const failure = await waitUntilAvailable('query-1').catch((e: unknown) => e);

    expect(failure).toBe(refusal);
    expect(isStatusRefusal(failure)).toBe(true);
    expect(get).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(11 * 60000);
    expect(get).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('stops at once when a 401 logs the user out and the status request resolves with nothing', async () => {
    get.mockResolvedValue(undefined);

    const failure = await waitUntilAvailable('query-1').catch((e: unknown) => e);

    expect(isSessionEnded(failure)).toBe(true);
    expect(isExportFailure(failure)).toBe(false);
    expect(isStatusRefusal(failure)).toBe(false);
    expect(get).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(11 * 60000);
    expect(get).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('stops when the session ends on a later attempt', async () => {
    get.mockResolvedValueOnce({ status: 'PENDING' }).mockResolvedValue(undefined);

    const waiting = waitUntilAvailable('query-1').catch((e: unknown) => e);
    await vi.advanceTimersByTimeAsync(11 * 60000);

    expect(isSessionEnded(await waiting)).toBe(true);
    expect(get).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['null body', null],
    ['text body', 'not json'],
    ['object without a status', {}],
  ])('keeps polling after a %s and rejects with an ordinary error', async (_name, body) => {
    get.mockResolvedValue(body);

    const waiting = waitUntilAvailable('query-1').catch((e: unknown) => e);
    await vi.advanceTimersByTimeAsync(LAST_ATTEMPT_AT_MS * 2);
    const failure = await waiting;

    expect(failure).toBeInstanceOf(Error);
    expect(isSessionEnded(failure)).toBe(false);
    expect(get).toHaveBeenCalledTimes(15);
  });

  it.each([
    ['409', () => httpError(409, '{"errorType":"result_not_ready"}')],
    ['500', () => httpError(500, 'Server Error')],
    ['502', () => httpError(502, 'Bad Gateway')],
    ['network error', () => new TypeError('Failed to fetch')],
  ])('keeps polling after a %s from the status request', async (_name, makeFailure) => {
    const failure = makeFailure();
    get.mockRejectedValueOnce(failure).mockResolvedValueOnce({ status: 'AVAILABLE' });

    const waiting = waitUntilAvailable('query-1');
    await vi.advanceTimersByTimeAsync(1000);

    await expect(waiting).resolves.toBeUndefined();
    expect(isStatusRefusal(failure)).toBe(false);
    expect(get).toHaveBeenCalledTimes(2);
  });

  it('waits 500 ms after the first attempt and doubles up to a 60000 ms cap', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    get.mockResolvedValue({ status: 'PENDING' });

    const outcome = waitUntilAvailable('query-1').catch((e: unknown) => e);

    await vi.advanceTimersByTimeAsync(499);
    expect(get).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(get).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(63000);
    expect(get).toHaveBeenCalledTimes(8);
    await vi.advanceTimersByTimeAsync(59999);
    expect(get).toHaveBeenCalledTimes(8);
    await vi.advanceTimersByTimeAsync(1);
    expect(get).toHaveBeenCalledTimes(9);

    await vi.advanceTimersByTimeAsync(11 * 60000);
    await outcome;
  });

  it('gives up after 15 attempts and rejects with the last status error', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    get.mockResolvedValue({ status: 'PENDING' });
    let failure: unknown;
    void waitUntilAvailable('query-1').catch((e: unknown) => (failure = e));

    await vi.advanceTimersByTimeAsync(LAST_ATTEMPT_AT_MS - 1);
    expect(get).toHaveBeenCalledTimes(14);
    expect(failure).toBeUndefined();

    await vi.advanceTimersByTimeAsync(1);
    expect(get).toHaveBeenCalledTimes(15);
    expect(failure).toEqual(new Error('Export not ready. Status: PENDING'));
    expect(isExportFailure(failure)).toBe(false);

    await vi.advanceTimersByTimeAsync(11 * 60000);
    expect(get).toHaveBeenCalledTimes(15);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('rejects with the last request error when the attempts run out on a failed request', async () => {
    const unreachable = new Error('502');
    get.mockRejectedValue(unreachable);

    const outcome = waitUntilAvailable('query-1').catch((e: unknown) => e);
    await vi.advanceTimersByTimeAsync(11 * 60000);

    expect(await outcome).toBe(unreachable);
    expect(get).toHaveBeenCalledTimes(15);
  });

  it('stops polling when the signal aborts', async () => {
    const controller = new AbortController();
    get.mockResolvedValue({ status: 'PENDING' });

    const outcome = waitUntilAvailable('query-1', controller.signal).catch((e: unknown) => e);
    await vi.advanceTimersByTimeAsync(700);
    expect(get).toHaveBeenCalledTimes(2);
    controller.abort();

    expect(((await outcome) as Error).name).toBe('AbortError');
    await vi.advanceTimersByTimeAsync(11 * 60000);
    expect(get).toHaveBeenCalledTimes(2);
    expect(get).toHaveBeenCalledWith(STATUS_PATH, undefined, undefined, {
      signal: controller.signal,
    });
  });
});

describe('fetchWhenReady', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('sends no retry when the signal aborts during the status wait', async () => {
    const controller = new AbortController();
    const fetchResult = vi.fn().mockRejectedValue(notReady);
    get.mockResolvedValue({ status: 'PENDING' });

    const outcome = fetchWhenReady('query-1', fetchResult, controller.signal).catch(
      (e: unknown) => e,
    );
    await vi.advanceTimersByTimeAsync(100);
    controller.abort();

    expect(((await outcome) as Error).name).toBe('AbortError');
    await vi.advanceTimersByTimeAsync(11 * 60000);
    expect(fetchResult).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('sends no retry when the signal aborts as the export becomes available', async () => {
    const controller = new AbortController();
    const fetchResult = vi.fn().mockRejectedValue(notReady);
    get.mockImplementation(async () => {
      controller.abort();
      return { status: 'AVAILABLE' };
    });

    const failure = await fetchWhenReady('query-1', fetchResult, controller.signal).catch(
      (e: unknown) => e,
    );

    expect((failure as Error).name).toBe('AbortError');
    expect(fetchResult).toHaveBeenCalledTimes(1);
  });
});

describe('statusWaitFailureMessage', () => {
  it('shows the sample message for a 400 sample_disabled', () => {
    expect(statusWaitFailureMessage(httpError(400, SAMPLE_DISABLED_BODY))).toBe(
      SAMPLE_DISABLED_MESSAGE,
    );
  });

  it('shows the consent message for a consent-denied 403', () => {
    expect(statusWaitFailureMessage(httpError(403, CONSENT_DENIED_BODY))).toBe(
      'You no longer have consent',
    );
  });

  it.each([
    ['404', () => httpError(404, 'Not Found')],
    ['400 without sample_disabled', () => httpError(400, '{"errorType":"bad_request"}')],
    ['403 without a consent denial', () => httpError(403, 'Forbidden')],
    ['status of ERROR', () => new Error('Export failed with status: ERROR')],
  ])('shows the preparation failure for a %s', (_name, makeError) => {
    expect(statusWaitFailureMessage(makeError())).toBe(EXPORT_PREPARE_FAILED_MESSAGE);
  });

  it.each([
    ['status that never became ready', () => new Error('Export not ready. Status: PENDING')],
    ['502', () => httpError(502, 'Bad Gateway')],
    ['409', () => httpError(409, '{"errorType":"result_not_ready"}')],
  ])('shows the not ready message for a %s', (_name, makeError) => {
    expect(statusWaitFailureMessage(makeError())).toBe(EXPORT_NOT_READY_MESSAGE);
  });
});

describe('trackNotReady', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function failureOf(result: ReturnType<typeof trackNotReady>): Promise<unknown> {
    return fetchWhenReady('query-1', result.fetch).catch((e: unknown) => e);
  }

  it('shows the sample message when the result request answers 400 sample_disabled', async () => {
    const result = trackNotReady(vi.fn().mockRejectedValue(httpError(400, SAMPLE_DISABLED_BODY)));

    expect(result.failureMessage(await failureOf(result))).toBe(SAMPLE_DISABLED_MESSAGE);
    expect(get).not.toHaveBeenCalled();
  });

  it('shows no message for another 400 from the result request', async () => {
    const result = trackNotReady(vi.fn().mockRejectedValue(httpError(400, 'Status : ERROR')));

    expect(result.failureMessage(await failureOf(result))).toBeUndefined();
  });

  it.each([
    ['400 sample_disabled', () => httpError(400, SAMPLE_DISABLED_BODY), SAMPLE_DISABLED_MESSAGE],
    ['consent-denied 403', () => httpError(403, CONSENT_DENIED_BODY), 'You no longer have consent'],
    ['404', () => httpError(404, 'Not Found'), EXPORT_PREPARE_FAILED_MESSAGE],
  ])('maps a %s from the status wait', async (_name, makeRefusal, message) => {
    get.mockRejectedValue(makeRefusal());
    const fetchResult = vi.fn().mockRejectedValue(notReady);
    const result = trackNotReady(fetchResult);

    expect(result.failureMessage(await failureOf(result))).toBe(message);
    expect(get).toHaveBeenCalledTimes(1);
    expect(fetchResult).toHaveBeenCalledTimes(1);
  });

  it('shows no message and sends no retry when the session ends during the status wait', async () => {
    get.mockResolvedValue(undefined);
    const fetchResult = vi.fn().mockRejectedValue(notReady);
    const result = trackNotReady(fetchResult);

    const failure = await failureOf(result);

    expect(isSessionEnded(failure)).toBe(true);
    expect(result.failureMessage(failure)).toBeUndefined();
    expect(get).toHaveBeenCalledTimes(1);
    expect(fetchResult).toHaveBeenCalledTimes(1);
  });
});

describe('isSessionEnded', () => {
  it('is false for every other failure of the wait', () => {
    expect(isSessionEnded(new Error('Export not ready. Status: PENDING'))).toBe(false);
    expect(isSessionEnded(new TypeError('Cannot read properties of undefined'))).toBe(false);
    expect(isSessionEnded(httpError(403, 'Forbidden'))).toBe(false);
    expect(isSessionEnded(undefined)).toBe(false);
  });
});

describe('isExportFailure', () => {
  it('is false for a status that is only not ready yet', () => {
    expect(isExportFailure(new Error('Export not ready. Status: PENDING'))).toBe(false);
    expect(isExportFailure(undefined)).toBe(false);
  });
});
