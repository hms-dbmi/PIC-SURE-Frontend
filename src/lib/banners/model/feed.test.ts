import { describe, expect, it } from 'vitest';
import { parseBannerFeed } from '#lib/banners/model/feed.ts';

const banner = {
  uuid: '11111111-1111-1111-1111-111111111111',
  htmlContent: '<p>Scheduled maintenance</p>',
  title: null,
  appearance: 'WARNING',
  icon: 'WARNING',
  dismissible: true,
  audience: 'EVERYONE',
  placement: 'SITE_TOP',
  pageTargets: [{ kind: 'ALL' }],
  priority: 1,
  presentationHash: 'abc123',
};

describe('parseBannerFeed', () => {
  it('rejects a feed that is not a list', () => {
    expect(() => parseBannerFeed({ banners: [] })).toThrow(
      'Banner feed returned an invalid response',
    );
  });

  it('keeps valid records in feed order', () => {
    const second = { ...banner, uuid: '22222222-2222-2222-2222-222222222222', priority: 2 };
    expect(parseBannerFeed([banner, second])).toEqual({ banners: [banner, second], malformed: 0 });
  });

  it.each([
    ['a record that is not an object', 'banner'],
    ['an unknown appearance', { ...banner, appearance: 'NEON' }],
    ['a non-finite priority', { ...banner, priority: Number.POSITIVE_INFINITY }],
    ['an empty page target list', { ...banner, pageTargets: [] }],
    ['a missing presentation hash', { ...banner, presentationHash: undefined }],
  ])('drops and counts %s', (_, record) => {
    expect(parseBannerFeed([record, banner])).toEqual({ banners: [banner], malformed: 1 });
  });

  it('drops a placement this app does not render without counting it as malformed', () => {
    expect(parseBannerFeed([{ ...banner, placement: 'LOGIN_ONLY' }])).toEqual({
      banners: [],
      malformed: 0,
    });
  });

  it('normalizes page target paths', () => {
    const { banners } = parseBannerFeed([
      { ...banner, pageTargets: [{ kind: 'EXACT', path: ' /help/ ', note: 'extra' }] },
    ]);
    expect(banners[0].pageTargets).toEqual([{ kind: 'EXACT', path: '/help' }]);
  });
});
