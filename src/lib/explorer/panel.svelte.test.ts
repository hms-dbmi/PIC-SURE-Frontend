import { beforeEach, describe, expect, it } from 'vitest';

import { explorerPanel } from '#lib/explorer/panel.svelte.ts';

describe('explorerPanel rows', () => {
  beforeEach(() => explorerPanel.closeRow());

  it('expands a row in a table with the info view by default', () => {
    explorerPanel.toggleRow('a', { table: 'T' });

    expect(explorerPanel.isExpanded('T', 'a')).toBe(true);
    expect(explorerPanel.isExpanded('Other', 'a')).toBe(false);
    expect(explorerPanel.activeView).toBe('info');
  });

  it('switches views on an expanded row, and collapses it when the same view is asked again', () => {
    explorerPanel.toggleRow('a', { view: 'info', table: 'T' });
    explorerPanel.toggleRow('a', { view: 'filter', table: 'T' });
    expect(explorerPanel.activeView).toBe('filter');

    explorerPanel.toggleRow('a', { view: 'filter', table: 'T' });
    expect(explorerPanel.activeRow).toBe('');
    expect(explorerPanel.activeView).toBe('info');
  });

  it('collapses a row clicked again whatever view it shows', () => {
    explorerPanel.toggleRow('a', { view: 'hierarchy', table: 'T' });
    explorerPanel.toggleRow('a', { table: 'T' });

    expect(explorerPanel.isExpanded('T', 'a')).toBe(false);
  });

  it('moves to another row', () => {
    explorerPanel.toggleRow('a', { view: 'filter', table: 'T' });
    explorerPanel.toggleRow('b', { table: 'T' });

    expect(explorerPanel.isExpanded('T', 'b')).toBe(true);
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
