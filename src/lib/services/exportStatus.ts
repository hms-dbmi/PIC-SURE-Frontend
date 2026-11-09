import * as api from '$lib/api';
import { Picsure } from '$lib/paths';
import { withBackoff } from '$lib/utilities/backoff';

const EXPORT_FAILED = 'Export failed with status: ERROR';

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
 * Polls the status of an export until its result can be fetched.
 *
 * Makes up to 15 attempts, waiting 500 ms after the first and doubling up to 60 s. A failed
 * status request counts as an attempt and is retried.
 *
 * @param queryId The id of the query whose export is awaited.
 * @returns A promise that resolves once the status is SUCCESS or AVAILABLE.
 * @throws An error matching {@link isExportFailure} as soon as the status is ERROR, or the last
 * error seen once the attempts run out.
 */
export function waitUntilAvailable(queryId: string | undefined): Promise<void> {
  return withBackoff(
    async () => {
      const res = (await api.get(`${Picsure.Query}/${queryId}/status`)) as ExportStatusResponse;

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
    (error) => !isExportFailure(error),
  );
}

/**
 * Fetches an export result, waiting for it once if the server answers that it is not ready.
 *
 * @param queryId The id of the query whose result is fetched.
 * @param fetchResult The request for the result or its signed URL.
 * @returns What `fetchResult` resolved with, from the first attempt or from the single retry.
 * @throws Whatever `fetchResult` rejects with when that is not a not-ready answer, the
 * {@link waitUntilAvailable} error when the export never becomes available, or the retry's own
 * error, a second not-ready answer included.
 */
export async function fetchWhenReady<T>(
  queryId: string | undefined,
  fetchResult: () => Promise<T>,
): Promise<T> {
  try {
    return await fetchResult();
  } catch (e) {
    if (!api.isResultNotReady(e)) {
      throw e;
    }
  }
  await waitUntilAvailable(queryId);
  return fetchResult();
}
