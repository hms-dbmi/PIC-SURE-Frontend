export const CONSENT_DENIED_MESSAGE = 'You no longer have consent for this saved result';

/**
 * - `consent_denied`: a 403 for a saved result the user no longer has consent for; the session stays.
 * - `unauthorized`: a 401; the session has been ended.
 * - `forbidden`: a 403 that isn't a consent denial; the session has been ended.
 * - `http`: every other failure, including a 401 on an anonymous `open` request, which ends
 *   nothing.
 */
export type ApiErrorCode = 'consent_denied' | 'unauthorized' | 'forbidden' | 'http';

export class ApiError extends Error {
  override readonly name = 'ApiError';

  /**
   * `body` is the response body, parsed as JSON when it is JSON. `message` is the raw response
   * text, except for a consent denial, where it is the message to show the user.
   */
  constructor(
    readonly status: number,
    readonly code: ApiErrorCode,
    readonly body: unknown,
    message: string,
  ) {
    super(message);
  }
}

export function consentDeniedMessage(e: unknown): string | undefined {
  return e instanceof ApiError && e.code === 'consent_denied' ? e.message : undefined;
}

export function isAbortError(e: unknown): boolean {
  return (e as Error | undefined)?.name === 'AbortError';
}
