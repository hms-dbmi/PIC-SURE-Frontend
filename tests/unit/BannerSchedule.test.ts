import { describe, expect, it } from 'vitest';

import { formatInstantAsLocalMinute, resolveLocalMinute } from '$lib/utilities/BannerSchedule';

describe('banner local schedule resolution', () => {
  it('resolves an ordinary local minute to one explicit UTC instant', () => {
    expect(resolveLocalMinute('2026-08-28T09:15', 'America/New_York')).toEqual({
      status: 'resolved',
      options: [{ instant: '2026-08-28T13:15:00.000Z', offset: '-04:00' }],
    });
  });

  it('rejects a nonexistent spring-forward local minute', () => {
    expect(resolveLocalMinute('2026-03-08T02:30', 'America/New_York')).toEqual({
      status: 'nonexistent',
      options: [],
    });
  });

  it('requires one of both explicit offsets for an ambiguous fall-back minute', () => {
    expect(resolveLocalMinute('2026-11-01T01:30', 'America/New_York')).toEqual({
      status: 'ambiguous',
      options: [
        { instant: '2026-11-01T05:30:00.000Z', offset: '-04:00' },
        { instant: '2026-11-01T06:30:00.000Z', offset: '-05:00' },
      ],
    });
  });

  it('rejects values that do not have exact minute precision', () => {
    expect(resolveLocalMinute('2026-08-28T09:15:30', 'America/New_York')).toEqual({
      status: 'invalid',
      options: [],
    });
  });

  it('formats an authoritative instant for a local minute input', () => {
    expect(formatInstantAsLocalMinute('2026-08-28T13:15:00Z', 'America/New_York')).toBe(
      '2026-08-28T09:15',
    );
  });
});
