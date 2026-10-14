import { describe, expect, it } from 'vitest';
import { getActiveEntry, type ScrollViewport } from '$lib/components/toc/activeEntry';

const viewport: ScrollViewport = { top: 80, scrollTop: 500, clientHeight: 800, scrollHeight: 3000 };
const sections = [
  { id: 'authentication', top: -180 },
  { id: 'workflow', top: 320 },
  { id: 'documentation', top: 970 },
];

describe('active ToC entry', () => {
  it.each([0, 4])(
    'keeps the first entry at scrollTop %s, even with later sections above the line',
    (scrollTop) => {
      expect(getActiveEntry({ ...viewport, scrollTop }, sections)).toBe('authentication');
    },
  );

  it('keeps the first entry while the hero is visible', () => {
    expect(getActiveEntry(viewport, [{ ...sections[0], top: 81 }, ...sections.slice(1)])).toBe(
      'authentication',
    );
  });

  it.each([
    [401, 'authentication'],
    [400, 'workflow'],
    [399, 'workflow'],
  ])('activates sections at the 40%% line: top %s selects %s', (top, expected) => {
    expect(getActiveEntry(viewport, [sections[0], { ...sections[1], top }, sections[2]])).toBe(
      expected,
    );
  });

  it('selects the last section that has crossed the line', () => {
    expect(getActiveEntry(viewport, [...sections.slice(0, 2), { ...sections[2], top: 400 }])).toBe(
      'documentation',
    );
  });

  it.each([
    [2195, 'workflow'],
    [2196, 'documentation'],
    [2200, 'documentation'],
  ])(
    'allows a short final section to activate at the bottom: scrollTop %s selects %s',
    (scrollTop, expected) => {
      expect(getActiveEntry({ ...viewport, scrollTop }, sections)).toBe(expected);
    },
  );

  it.each([0, 2])(
    'keeps the first entry when content fits or only overflows by %s pixels',
    (overflow) => {
      expect(
        getActiveEntry(
          { ...viewport, scrollTop: overflow, scrollHeight: 800 + overflow },
          sections,
        ),
      ).toBe('authentication');
    },
  );

  it('skips missing targets', () => {
    expect(
      getActiveEntry(viewport, [sections[0], { ...sections[1], top: null }, sections[2]]),
    ).toBe('authentication');
  });

  it('returns no active entry for an empty list', () => {
    expect(getActiveEntry(viewport, [])).toBe('');
  });
});
