import { describe, expect, it } from 'vitest';

import { rateLimitText } from '$lib/utilities/RateLimits';

describe('rateLimitText', () => {
  it('publishes both limits with the reset time', () => {
    expect(rateLimitText({ perMinute: 60, perDay: 3000 })).toBe(
      '60 requests per minute and 3,000 requests per day per key. The daily limit resets at midnight UTC.',
    );
  });

  it.each([
    ['not configured', undefined],
    ['missing the daily limit', { perMinute: 60 }],
    ['missing the minute limit', { perDay: 3000 }],
    ['zero', { perMinute: 0, perDay: 3000 }],
    ['not a number', { perMinute: '60', perDay: 3000 }],
  ])('publishes nothing when %s', (_, limits) => {
    expect(rateLimitText(limits as never)).toBeUndefined();
  });
});
