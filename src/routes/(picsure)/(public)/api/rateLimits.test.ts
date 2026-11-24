import { describe, expect, it } from 'vitest';

import { rateLimitText } from './rateLimits.ts';

describe('rateLimitText', () => {
  it('publishes both limits with the reset time', () => {
    expect(rateLimitText({ perMinute: 60, perDay: 3000 })).toBe(
      '60 requests per minute and 3,000 requests per day per key. The daily limit resets at midnight UTC.',
    );
  });

  it.each([
    ['neither is set', { perMinute: 0, perDay: 0 }],
    ['only the minute limit is set', { perMinute: 60, perDay: 0 }],
    ['only the daily limit is set', { perMinute: 0, perDay: 3000 }],
  ])('publishes nothing when %s', (_, limits) => {
    expect(rateLimitText(limits)).toBeUndefined();
  });
});
