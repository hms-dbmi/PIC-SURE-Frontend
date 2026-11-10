import { isHttpError } from '@sveltejs/kit';
import * as api from '$lib/api';
import { Picsure } from '$lib/paths';
import { withBackoff } from '$lib/utilities/backoff';

const EXPORT_FAILED = 'Export failed with status: ERROR';
const REFUSED_STATUSES = [400, 403, 404] as const;

/** Shown when the server reports that preparing an export ended in ERROR. */
export const EXPORT_PREPARE_FAILED_MESSAGE =
  'An error occurred while preparing your dataset. Please try again. If this problem persists, please contact an administrator.';

/** Shown when an export is still not ready after the status wait and the single retry. */
export const EXPORT_NOT_READY_MESSAGE =
  'The export is not ready yet. Please try again in a few minutes.';

/** Shown when a sample is asked for while sampling is switched off on the server. */
export const SAMPLE_DISABLED_MESSAGE = 'Sample datasets are not available at this time';

/** Shown when a sample query is about to be saved as a named dataset. Nothing is sent. */
export const SAMPLE_SAVE_REFUSED_MESSAGE =
  'A sample query cannot be saved as a dataset. Save the full query instead.';

/**
 * Rejects a status wait whose request found the session over. A 401 makes the request log the
 * user out, start the redirect to the login page and resolve with nothing, so there is no
 * status to read and no later attempt can succeed.
 */
export class SessionEndedError extends Error {
  constructor() {
    super('The session ended while waiting for the export.');
    this.name = 'SessionEndedError';
  }
}

/**
 * Tells a wait that stopped because the session ended apart from every other failure. The login
 * page the user is sent to explains the logout, so a caller shows no message of its own.
 *
 * @param e The value a rejected {@link waitUntilAvailable} call rejected with.
 * @returns True when a status request was answered 401 and the user was logged out.
 */
export function isSessionEnded(e: unknown): boolean {
  return e instanceof SessionEndedError;
}

interface ExportStatusResponse {
  picsureResultId: string;
  status: string;
  resultMetadata: { picsureQueryId: string };
}

/**
 * Tells an export that ended in ERROR apart from one that is only not ready yet.
 *
 * @param e The value a rejected {@link waitUntilAvailable} call rejected with.
 * @returns True when the server reported the export as failed, which polling never fixes.
 */
export function isExportFailure(e: unknown): boolean {
  return e instanceof Error && e.message.includes(EXPORT_FAILED);
}

/**
 * Tells a status request the server refused apart from one that may succeed if sent again.
 * A 400, a 403 and a 404 are refusals: the request is wrong, the caller may not see the query
 * (and a 403 without a consent denial has already ended the session), or the query is unknown.
 *
 * @param e The value a rejected {@link waitUntilAvailable} call rejected with.
 * @returns True for an HTTP 400, 403 or 404, which polling never fixes.
 */
export function isStatusRefusal(e: unknown): boolean {
  return REFUSED_STATUSES.some((status) => isHttpError(e, status));
}

/**
 * Picks the message for an error {@link waitUntilAvailable} rejected with.
 *
 * @param error The value the status wait rejected with.
 * @returns The server's consent message for a consent denial, {@link SAMPLE_DISABLED_MESSAGE}
 * for a 400 `sample_disabled`, {@link EXPORT_PREPARE_FAILED_MESSAGE} when the export reported
 * ERROR or the status request was refused in any other way, and
 * {@link EXPORT_NOT_READY_MESSAGE} when the wait ran out of attempts. An error matching
 * {@link isSessionEnded} gets that last message too, so check for it first and show nothing.
 */
export function statusWaitFailureMessage(error: unknown): string {
  const consentMessage = api.consentDeniedMessage(error);
  if (consentMessage) {
    return consentMessage;
  }
  if (api.isSampleDisabled(error)) {
    return SAMPLE_DISABLED_MESSAGE;
  }
  return isExportFailure(error) || isStatusRefusal(error)
    ? EXPORT_PREPARE_FAILED_MESSAGE
    : EXPORT_NOT_READY_MESSAGE;
}

/**
 * Polls the status of an export until its result can be fetched.
 *
 * Makes up to 15 attempts, waiting 500 ms after the first and doubling up to 60 s. A status
 * request that fails with a 409, a 5xx or a network error counts as an attempt and is retried.
 *
 * @param queryId The id of the query whose export is awaited.
 * @param signal Stops the polling when it aborts. The status requests carry it too.
 * @returns A promise that resolves once the status is SUCCESS or AVAILABLE.
 * @throws An error matching {@link isExportFailure} as soon as the status is ERROR, an error
 * matching {@link isStatusRefusal} as soon as a status request answers 400, 403 or 404, an
 * error matching {@link isSessionEnded} as soon as a status request answers 401, the last error
 * seen once the attempts run out, or the abort reason once `signal` aborts.
 */
export function waitUntilAvailable(
  queryId: string | undefined,
  signal?: AbortSignal,
): Promise<void> {
  const path = `${Picsure.Query}/${queryId}/status`;
  return withBackoff(
    async () => {
      const res = (await (signal
        ? api.get(path, undefined, undefined, { signal })
        : api.get(path))) as ExportStatusResponse | undefined;

      if (res === undefined) {
        throw new SessionEndedError();
      }

      if (res.status === 'ERROR') {
        throw new Error(`Export failed with status: ${res.status}`);
      }

      if (res.status !== 'SUCCESS' && res.status !== 'AVAILABLE') {
        throw new Error(`Export not ready. Status: ${res.status}`);
      }
    },
    15,
    500,
    60000,
    (error) => !isExportFailure(error) && !isStatusRefusal(error) && !isSessionEnded(error),
    signal,
  );
}

/** A result request that counts its not-ready answers, made by {@link trackNotReady}. */
export interface NotReadyTracker<T> {
  /** Sends the wrapped request. Pass it to {@link fetchWhenReady}. */
  fetch: () => Promise<T>;
  /**
   * Tells whether the first request was answered not ready, so a status wait followed.
   *
   * @returns True once a not-ready answer has been counted.
   */
  waited: () => boolean;
  /**
   * Picks the message for an error {@link fetchWhenReady} rejected with.
   *
   * @param error The value the call rejected with.
   * @returns {@link SAMPLE_DISABLED_MESSAGE} for a 400 `sample_disabled` from the result
   * request or from the status wait, what {@link statusWaitFailureMessage} picks when the
   * status wait failed, {@link EXPORT_NOT_READY_MESSAGE} when the retry was answered not ready
   * again, and undefined for any other error, one matching {@link isSessionEnded} included.
   */
  failureMessage: (error: unknown) => string | undefined;
}

/**
 * Wraps a result request so the caller can tell afterwards why {@link fetchWhenReady} failed.
 *
 * @param fetchResult The request for the result or its signed URL.
 * @returns The counting request and the readers of what it counted.
 */
export function trackNotReady<T>(fetchResult: () => Promise<T>): NotReadyTracker<T> {
  let requests = 0;
  let notReadyAnswers = 0;
  return {
    fetch: async () => {
      requests += 1;
      try {
        return await fetchResult();
      } catch (e) {
        if (api.isResultNotReady(e)) {
          notReadyAnswers += 1;
        }
        throw e;
      }
    },
    waited: () => notReadyAnswers > 0,
    failureMessage: (error) => {
      if (isSessionEnded(error)) {
        return undefined;
      }
      if (api.isSampleDisabled(error)) {
        return SAMPLE_DISABLED_MESSAGE;
      }
      if (requests === 1 && notReadyAnswers === 1) {
        return statusWaitFailureMessage(error);
      }
      return notReadyAnswers === 2 ? EXPORT_NOT_READY_MESSAGE : undefined;
    },
  };
}

/**
 * Fetches an export result, waiting for it once if the server answers that it is not ready.
 *
 * @param queryId The id of the query whose result is fetched.
 * @param fetchResult The request for the result or its signed URL.
 * @param signal Stops the status wait when it aborts, and no retry is sent after that.
 * @returns What `fetchResult` resolved with, from the first attempt or from the single retry.
 * @throws Whatever `fetchResult` rejects with when that is not a not-ready answer, the
 * {@link waitUntilAvailable} error when the export never becomes available, the abort reason
 * once `signal` aborts, or the retry's own error, a second not-ready answer included.
 */
export async function fetchWhenReady<T>(
  queryId: string | undefined,
  fetchResult: () => Promise<T>,
  signal?: AbortSignal,
): Promise<T> {
  try {
    return await fetchResult();
  } catch (e) {
    if (!api.isResultNotReady(e)) {
      throw e;
    }
  }
  await waitUntilAvailable(queryId, signal);
  signal?.throwIfAborted();
  return fetchResult();
}
