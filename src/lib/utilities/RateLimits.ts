import type { ApiRateLimits } from '$lib/types';

/** The published per-key limits, or undefined unless both numbers are configured. */
export function rateLimitText(limits?: ApiRateLimits): string | undefined {
  const { perMinute, perDay } = limits ?? {};
  if (!isLimit(perMinute) || !isLimit(perDay)) return undefined;
  return (
    `${perMinute.toLocaleString('en-US')} requests per minute and ` +
    `${perDay.toLocaleString('en-US')} requests per day per key. ` +
    'The daily limit resets at midnight UTC.'
  );
}

function isLimit(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}
