import { beforeEach, describe, expect, it } from 'vitest';

import { explorerPanel } from '#lib/explorer/panel.svelte.ts';

describe('explorerPanel rows', () => {
  beforeEach(() => explorerPanel.closeRow());

  it('expands a row with the info view by default', () => {
    explorerPanel.toggleRow('a');

    expect(explorerPanel.isExpanded('a')).toBe(true);
    expect(explorerPanel.isExpanded('b')).toBe(false);
    expect(explorerPanel.activeView).toBe('info');
  });

  it('switches views on an expanded row, and collapses it when the same view is asked again', () => {
    explorerPanel.toggleRow('a', 'info');
    explorerPanel.toggleRow('a', 'filter');
    expect(explorerPanel.activeView).toBe('filter');

    explorerPanel.toggleRow('a', 'filter');
    expect(explorerPanel.activeRow).toBe('');
    expect(explorerPanel.activeView).toBe('info');
  });

  it('collapses a row clicked again whatever view it shows', () => {
    explorerPanel.toggleRow('a', 'hierarchy');
    explorerPanel.toggleRow('a');

    expect(explorerPanel.isExpanded('a')).toBe(false);
  });

  it('moves to another row', () => {
    explorerPanel.toggleRow('a', 'filter');
    explorerPanel.toggleRow('b');

    expect(explorerPanel.isExpanded('b')).toBe(true);
    expect(explorerPanel.activeView).toBe('info');
  });
});

describe('explorerPanel side panel', () => {
  it('opens, closes and toggles', () => {
    explorerPanel.show();
    expect(explorerPanel.open).toBe(true);
    expect(explorerPanel.toggle()).toBe(false);
    expect(explorerPanel.open).toBe(false);
    explorerPanel.hide();
    expect(explorerPanel.toggle()).toBe(true);
  });
});
