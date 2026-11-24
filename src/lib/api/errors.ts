export const CONSENT_DENIED_MESSAGE = 'You no longer have consent for this saved result';

/**
 * - `consent_denied`: a 403 for a saved result the user no longer has consent for; the session stays.
 * - `unauthorized`: a 401; the session has been ended.
 * - `terms_not_accepted`: PSAMA refuses the user until they accept the terms of service; the session
 *   stays, and the terms dialog asks them to.
 * - `forbidden`: a 403 that is neither a consent denial nor the terms; the session has been ended.
 * - `rate_limited`: a 429; the session stays.
 * - `http`: every other failure, including a 401 on an anonymous `open` request, which ends
 *   nothing.
 */
export type ApiErrorCode =
  | 'consent_denied'
  | 'unauthorized'
  | 'terms_not_accepted'
  | 'forbidden'
  | 'rate_limited'
  | 'http';

export class ApiError extends Error {
  override readonly name = 'ApiError';

  /**
   * `body` is the response body, parsed as JSON when it is JSON. `message` is the raw response
   * text, except for a consent denial or a 429, where it is the message to show the user.
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

/** The error's own message when it is written for the user (a consent denial or a 429), else `fallback`. */
export function userMessage(e: unknown, fallback: string): string {
  return e instanceof ApiError && (e.code === 'consent_denied' || e.code === 'rate_limited')
    ? e.message
    : fallback;
}

export function rateLimitMessage(e: unknown): string | undefined {
  return e instanceof ApiError && e.code === 'rate_limited' ? e.message : undefined;
}

export function isAbortError(e: unknown): boolean {
  return (e as Error | undefined)?.name === 'AbortError';
}
