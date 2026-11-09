/**
 * Utility function for implementing exponential backoff with jitter.
 * Useful for retrying operations that may fail due to temporary issues.
 */

/**
 * Gives the value an aborted operation rejects with.
 *
 * @param signal The signal that has aborted.
 * @returns The reason the signal carries, or an `AbortError` when it carries none.
 */
function abortReason(signal: AbortSignal): unknown {
  return signal.reason ?? new DOMException('The operation was aborted.', 'AbortError');
}

/**
 * Sleep for a specified number of milliseconds
 *
 * @param ms How long to sleep, in milliseconds.
 * @param signal Ends the sleep early when it aborts.
 * @returns A promise that resolves after the delay, or rejects with the abort reason when the
 * signal aborts first.
 */
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer);
      reject(abortReason(signal as AbortSignal));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/**
 * Generate exponential backoff delay with jitter
 * @param attempt - The current attempt number (0-based)
 * @param baseDelay - Base delay in milliseconds
 * @param maxDelay - Maximum delay in milliseconds
 * @param jitter - Whether to add random jitter (default: true)
 * @returns Delay in milliseconds
 */
function getBackoffDelay(
  attempt: number,
  baseDelay: number = 1000,
  maxDelay: number = 30000,
  jitter: boolean = true,
): number {
  const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  if (jitter) {
    // Add random jitter (±25% of the exponential delay)
    const jitterAmount = exponentialDelay * 0.25;
    return exponentialDelay + (Math.random() * 2 - 1) * jitterAmount;
  }
  return exponentialDelay;
}

/**
 * Retry a function with exponential backoff
 * @param fn - Function to retry (should return a Promise)
 * @param maxAttempts - Maximum number of attempts (including the first attempt)
 * @param baseDelay - Base delay in milliseconds for exponential backoff
 * @param maxDelay - Maximum delay in milliseconds
 * @param shouldRetry - Optional function to determine if an error should trigger a retry
 * @param signal Optional signal that stops the retries. Once it aborts no further attempt is
 * made, a pending delay ends at once, and the promise rejects with the abort reason.
 * @returns Promise that resolves with the function result or rejects after max attempts
 */
export async function withBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000,
  maxDelay: number = 30000,
  shouldRetry?: (error: unknown, attempt: number) => boolean,
  signal?: AbortSignal,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (signal?.aborted) {
      throw abortReason(signal);
    }
    try {
      return await fn();
    } catch (error) {
      if (signal?.aborted) {
        throw abortReason(signal);
      }
      console.warn('Backoff caught: ', error);
      lastError = error;

      // Check if we should retry this error
      if (shouldRetry && !shouldRetry(error, attempt)) {
        throw error;
      }

      // Don't delay after the last attempt
      if (attempt < maxAttempts - 1) {
        const delay = getBackoffDelay(attempt, baseDelay, maxDelay);
        await sleep(delay, signal);
      }
    }
  }

  throw lastError;
}

/**
 * Default retry condition - retry on any error for network-related operations
 */
export function defaultShouldRetry(error: unknown): boolean {
  // Retry on network errors, timeouts, and 5xx status codes
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('fetch') ||
      message.includes('connection')
    );
  }
  return true;
}
