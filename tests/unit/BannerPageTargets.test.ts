import { describe, expect, it } from 'vitest';
import {
  matchesBannerPageTargets,
  normalizeBannerPageTargets,
  parseBannerPageTargets,
  validateBannerPageTarget,
} from '$lib/utilities/BannerPageTargets';
import type { BannerPageTarget } from '$lib/models/Banner';

describe('normalizeBannerPageTargets', () => {
  it('normalizes, sorts, and removes duplicate targets', () => {
    expect(
      normalizeBannerPageTargets([
        { kind: 'SUBTREE', path: '/admin/' },
        { kind: 'EXACT', path: ' /removed-route/ ' },
        { kind: 'PARAMETERIZED', path: '/studies/[study]/participants/[participant]/' },
        { kind: 'EXACT', path: '/removed-route' },
      ]),
    ).toEqual([
      { kind: 'EXACT', path: '/removed-route' },
      { kind: 'PARAMETERIZED', path: '/studies/[study]/participants/[participant]' },
      { kind: 'SUBTREE', path: '/admin' },
    ]);
  });

  it('keeps All pages in its one canonical shape', () => {
    expect(normalizeBannerPageTargets([{ kind: 'ALL' }, { kind: 'ALL' }])).toEqual([
      { kind: 'ALL' },
    ]);
  });

  it('uses backend-compatible code-unit ordering instead of locale collation', () => {
    expect(
      normalizeBannerPageTargets([
        { kind: 'EXACT', path: '/a' },
        { kind: 'EXACT', path: '/Z' },
      ]),
    ).toEqual([
      { kind: 'EXACT', path: '/Z' },
      { kind: 'EXACT', path: '/a' },
    ]);
  });
});

describe('validateBannerPageTarget', () => {
  it.each([
    [{ kind: 'EXACT', path: '/help' }, null],
    [{ kind: 'EXACT', path: '/' }, null],
    [{ kind: 'SUBTREE', path: '/admin' }, null],
    [{ kind: 'PARAMETERIZED', path: '/studies/[study]' }, null],
    [{ kind: 'PARAMETERIZED', path: '/studies/[study]/participants/[participant]' }, null],
    [{ kind: 'EXACT', path: 'help' }, 'Enter an absolute path starting with /.'],
    [{ kind: 'EXACT', path: '\t/help' }, 'The pathname contains unsupported characters.'],
    [
      { kind: 'EXACT', path: '/help?topic=banners' },
      'Enter a pathname without a query or fragment.',
    ],
    [{ kind: 'SUBTREE', path: '/' }, 'Choose All pages instead of a root subtree.'],
    [{ kind: 'SUBTREE', path: '/admin/*' }, 'Do not add wildcard syntax to a subtree path.'],
    [{ kind: 'PARAMETERIZED', path: '/studies' }, 'Add at least one plain [name] segment.'],
    [
      { kind: 'PARAMETERIZED', path: '/studies/[[study]]' },
      'Only plain [name] parameter segments are supported.',
    ],
    [
      { kind: 'PARAMETERIZED', path: '/studies/[...study]' },
      'Only plain [name] parameter segments are supported.',
    ],
    [
      { kind: 'PARAMETERIZED', path: '/studies/[study=uuid]' },
      'Only plain [name] parameter segments are supported.',
    ],
  ] satisfies [BannerPageTarget, string | null][])('validates %o', (target, error) => {
    expect(validateBannerPageTarget(target)).toBe(error);
  });
});

describe('parseBannerPageTargets', () => {
  it('accepts and canonicalizes well-formed noncanonical feed values', () => {
    expect(
      parseBannerPageTargets([
        { kind: 'SUBTREE', path: '/admin/' },
        { kind: 'EXACT', path: '/help' },
        { kind: 'EXACT', path: '/help' },
      ]),
    ).toEqual([
      { kind: 'EXACT', path: '/help' },
      { kind: 'SUBTREE', path: '/admin' },
    ]);
  });

  const malformedFeedValues: unknown[] = [
    [],
    [{ kind: 'EXACT' }],
    [{ kind: 'EXACT', path: '/help', extra: true }],
    [{ kind: 'ALL' }, { kind: 'EXACT', path: '/help' }],
  ];

  it.each(malformedFeedValues)('rejects malformed feed value %j', (value) => {
    expect(parseBannerPageTargets(value)).toBeNull();
  });
});

describe('matchesBannerPageTargets', () => {
  it.each([
    [[{ kind: 'ALL' }], '/anything', true],
    [[{ kind: 'EXACT', path: '/help' }], '/help', true],
    [[{ kind: 'EXACT', path: '/help' }], '/help/', true],
    [[{ kind: 'EXACT', path: '/help' }], '/help/topic', false],
    [[{ kind: 'SUBTREE', path: '/help' }], '/help', true],
    [[{ kind: 'SUBTREE', path: '/help' }], '/help/topic', true],
    [[{ kind: 'SUBTREE', path: '/help' }], '/helper', false],
    [[{ kind: 'PARAMETERIZED', path: '/studies/[study]' }], '/studies/123', true],
    [[{ kind: 'PARAMETERIZED', path: '/studies/[study]' }], '/studies', false],
    [[{ kind: 'PARAMETERIZED', path: '/studies/[study]' }], '/studies/123/people', false],
    [
      [{ kind: 'PARAMETERIZED', path: '/studies/[study]/participants/[participant]' }],
      '/studies/abc/participants/42',
      true,
    ],
    [[{ kind: 'EXACT', path: '/help' }], '/help?topic=banners', true],
    [[{ kind: 'EXACT', path: '/help' }], '/help#links', true],
    [[{ kind: 'EXACT', path: '/help' }], '/help/?topic=banners#links', true],
    [[{ kind: 'EXACT', path: '/help' }], '/status?next=/help', false],
  ] satisfies [BannerPageTarget[], string, boolean][])('%j against %s', (targets, url, result) => {
    expect(matchesBannerPageTargets(targets, url)).toBe(result);
  });

  it('matches any target while retaining list order outside the matcher', () => {
    expect(
      matchesBannerPageTargets(
        [
          { kind: 'EXACT', path: '/status' },
          { kind: 'SUBTREE', path: '/admin' },
        ],
        '/admin/users',
      ),
    ).toBe(true);
  });
});
