import type { Settings } from '#lib/config/schema.ts';

/** The published per-key limits, or undefined unless both are set. */
export function rateLimitText({ perMinute, perDay }: Settings['rateLimits']): string | undefined {
  if (perMinute <= 0 || perDay <= 0) return undefined;
  return (
    `${perMinute.toLocaleString('en-US')} requests per minute and ` +
    `${perDay.toLocaleString('en-US')} requests per day per key. ` +
    'The daily limit resets at midnight UTC.'
  );
}
