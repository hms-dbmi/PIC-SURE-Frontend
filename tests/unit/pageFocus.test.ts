import { describe, expect, it } from 'vitest';

import { pendingPageFocusStatus } from '$lib/components/datatable/pageFocus';

describe('pendingPageFocusStatus', () => {
  const outgoing = [{ id: 1 }];
  const incoming = [{ id: 2 }];
  const pending = { page: 2, rowsAtRequest: outgoing };

  it('waits while the handler still holds the outgoing rows', () => {
    expect(pendingPageFocusStatus(pending, { rows: outgoing, currentPage: 2 }, false, 0)).toBe(
      'waiting',
    );
  });

  it('is stale when the page moved for some other reason', () => {
    expect(pendingPageFocusStatus(pending, { rows: incoming, currentPage: 1 }, false, 3)).toBe(
      'stale',
    );
  });

  it('waits on the loading placeholder, then gives up on an empty page', () => {
    const handler = { rows: incoming, currentPage: 2 };
    expect(pendingPageFocusStatus(pending, handler, true, 0)).toBe('waiting');
    expect(pendingPageFocusStatus(pending, handler, false, 0)).toBe('stale');
  });

  it('is ready once the new page has something to focus', () => {
    expect(pendingPageFocusStatus(pending, { rows: incoming, currentPage: 2 }, false, 3)).toBe(
      'ready',
    );
  });
});
