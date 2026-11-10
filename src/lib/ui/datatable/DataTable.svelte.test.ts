// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRawSnippet, type Snippet } from 'svelte';
import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { TableHandler } from '@vincjo/datatables';

import { TableHandler as ServerTableHandler } from '@vincjo/datatables/server';

import DataTable from '#lib/ui/datatable/DataTable.svelte';
import { isTextEntryField } from '#lib/ui/datatable/keyboard.ts';
import type { Column, RowExpansion } from '#lib/ui/datatable/types.ts';

interface TestRow {
  name: string;
  id: string;
  onAction?: () => void;
}

function makeRows(count: number, onAction?: () => void): TestRow[] {
  return Array.from({ length: count }, (_, i) => ({ name: `Row ${i}`, id: `ds-${i}`, onAction }));
}

const keyButton = createRawSnippet((row: () => TestRow) => ({
  render: () => '<button type="button" data-key="x" title="Act (x)">Act</button>',
  setup: (button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      row().onAction?.();
    });
  },
}));

const columns: Column<TestRow>[] = [
  { dataElement: 'name', label: 'Name' },
  { dataElement: 'id', label: 'Actions', cell: keyButton },
];

class Expansion implements RowExpansion {
  activeRow = $state('');
  toggleRow = (key: string) => {
    this.activeRow = this.activeRow === key ? '' : key;
  };
  closeRow = () => {
    this.activeRow = '';
  };
}
let expansion = new Expansion();

const panel = createRawSnippet(() => ({ render: () => '<div>panel</div>' }));
const panelWithInput = createRawSnippet(() => ({
  render: () => '<input type="text" aria-label="panel-input" />',
}));

function renderTable(rowCount = 7, onAction?: () => void, expandedRow?: Snippet<[TestRow]>) {
  const handler = new TableHandler(makeRows(rowCount, onAction), { rowsPerPage: 5 });
  const result = render(DataTable<TestRow>, {
    tableName: 'KbdTest',
    id: 'KbdTest',
    handler,
    columns,
    isClickable: true,
    rowKey: 'id',
    expansion,
    expandedRow,
  });
  return { handler, ...result };
}

function rows(container: HTMLElement): HTMLTableRowElement[] {
  return Array.from(container.querySelectorAll('tr[id^="KbdTest-row-"]'));
}

afterEach(() => {
  vi.clearAllMocks();
  expansion = new Expansion();
});

describe('Datatable keyboard navigation', () => {
  it('gives the table a grid role and a single roving tab stop on the first row', async () => {
    const { container } = renderTable();

    expect(container.querySelector('table')?.getAttribute('role')).toBe('grid');
    await waitFor(() => {
      const [first, second] = rows(container);
      expect(first.getAttribute('tabindex')).toBe('0');
      expect(second.getAttribute('tabindex')).toBe('-1');
      // Row action buttons are removed from the page tab order.
      expect(first.querySelector('button')?.getAttribute('tabindex')).toBe('-1');
    });
  });

  it('moves row focus with ArrowDown/ArrowUp and jumps with Home/End', async () => {
    const { container } = renderTable();
    const pageRows = rows(container);
    pageRows[0].focus();

    await fireEvent.keyDown(pageRows[0], { key: 'ArrowDown' });
    expect(document.activeElement?.id).toBe('KbdTest-row-1');

    await fireEvent.keyDown(document.activeElement!, { key: 'ArrowUp' });
    expect(document.activeElement?.id).toBe('KbdTest-row-0');

    await fireEvent.keyDown(document.activeElement!, { key: 'End' });
    expect(document.activeElement?.id).toBe('KbdTest-row-4');

    await fireEvent.keyDown(document.activeElement!, { key: 'Home' });
    expect(document.activeElement?.id).toBe('KbdTest-row-0');
  });

  it('advances to the next page from the last row and focuses its first row', async () => {
    const { container, handler } = renderTable(7);
    const pageRows = rows(container);
    pageRows[4].focus();

    await fireEvent.keyDown(pageRows[4], { key: 'ArrowDown' });

    await waitFor(() => {
      expect(handler.currentPage).toBe(2);
      expect(document.activeElement?.id).toBe('KbdTest-row-0');
    });
    // Second page has rows 5 and 6 of the 7-row dataset.
    expect(document.activeElement?.textContent).toContain('Row 5');

    // ArrowUp on the first row of page 2 returns to page 1, focusing its first row.
    await fireEvent.keyDown(document.activeElement!, { key: 'ArrowUp' });
    await waitFor(() => {
      expect(handler.currentPage).toBe(1);
      expect(document.activeElement?.id).toBe('KbdTest-row-0');
    });
  });

  it('focuses the first row when paging backwards, not the last', async () => {
    // Both directions land on the first row so focus agrees with where callers
    // scroll on a page change (Explorer scrolls the results back to the top via
    // onPageChange); focusing the last row would scroll the viewport to the
    // bottom of the table and undo it.
    const { container, handler } = renderTable(7);
    const pageRows = rows(container);
    pageRows[4].focus();

    await fireEvent.keyDown(pageRows[4], { key: 'ArrowDown' });
    await waitFor(() => expect(handler.currentPage).toBe(2));

    await fireEvent.keyDown(document.activeElement!, { key: 'ArrowUp' });

    await waitFor(() => {
      expect(handler.currentPage).toBe(1);
      expect(document.activeElement?.id).toBe('KbdTest-row-0');
      expect(document.activeElement?.textContent).toContain('Row 0');
    });
  });

  it('does not page past the boundaries', async () => {
    const { container, handler } = renderTable(3);
    const pageRows = rows(container);
    pageRows[0].focus();

    await fireEvent.keyDown(pageRows[0], { key: 'ArrowUp' });
    expect(handler.currentPage).toBe(1);
    expect(document.activeElement?.id).toBe('KbdTest-row-0');

    await fireEvent.keyDown(document.activeElement!, { key: 'End' });
    await fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
    expect(handler.currentPage).toBe(1);
    expect(document.activeElement?.id).toBe('KbdTest-row-2');
  });

  it('keeps the tab stop where a shorter page clamped it', async () => {
    const { container, handler } = renderTable(7);
    rows(container)[0].focus();
    await fireEvent.keyDown(rows(container)[0], { key: 'End' });

    handler.setPage(2);
    await waitFor(() => expect(rows(container)).toHaveLength(2));
    await waitFor(() => expect(rows(container)[1].getAttribute('tabindex')).toBe('0'));

    handler.setPage(1);
    await waitFor(() => expect(rows(container)).toHaveLength(5));
    expect(rows(container)[1].getAttribute('tabindex')).toBe('0');
    expect(rows(container)[4].getAttribute('tabindex')).toBe('-1');
  });

  it('reaches row action buttons with ArrowRight and returns with ArrowLeft', async () => {
    const { container } = renderTable();
    const pageRows = rows(container);
    pageRows[0].focus();

    await fireEvent.keyDown(pageRows[0], { key: 'ArrowRight' });
    expect(document.activeElement?.tagName).toBe('BUTTON');
    expect(document.activeElement?.getAttribute('data-key')).toBe('x');

    await fireEvent.keyDown(document.activeElement!, { key: 'ArrowLeft' });
    expect(document.activeElement?.id).toBe('KbdTest-row-0');
  });

  it('fires a row action via its single-letter shortcut', async () => {
    const onAction = vi.fn();
    const { container } = renderTable(7, onAction);
    const pageRows = rows(container);
    pageRows[0].focus();

    await fireEvent.keyDown(pageRows[0], { key: 'x' });
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('restores focus onto the new first row across an async server-side page change', async () => {
    // Mirrors the Explorer: currentPage updates synchronously, the fetch is
    // delayed, and a loading placeholder replaces (destroys) the focused row
    // DOM while the fetch is in flight.
    const allRows = makeRows(7);
    let resolvePageTwo!: (pageRows: ReturnType<typeof makeRows>) => void;
    const handler = new ServerTableHandler(makeRows(0), { rowsPerPage: 5 });
    handler.load((state) => {
      handler.totalRows = allRows.length;
      if (state.currentPage === 1) return Promise.resolve(allRows.slice(0, 5));
      return new Promise((resolve) => (resolvePageTwo = resolve));
    });
    handler.invalidate();

    const { container, rerender } = render(DataTable<TestRow>, {
      tableName: 'KbdTest',
      id: 'KbdTest',
      handler,
      columns,
      isClickable: true,
      isLoading: false,
    });
    await waitFor(() => expect(rows(container)).toHaveLength(5));

    const pageRows = rows(container);
    pageRows[4].focus();
    await fireEvent.keyDown(pageRows[4], { key: 'ArrowDown' });

    // Loading placeholder destroys the row DOM before the new page arrives.
    await rerender({ isLoading: true });
    expect(rows(container)).toHaveLength(0);

    // The handler dispatches the (debounced) fetch on a later task.
    await waitFor(() => expect(resolvePageTwo).toBeDefined());
    resolvePageTwo(allRows.slice(5));
    await waitFor(() => expect(handler.rows).toHaveLength(2));
    await rerender({ isLoading: false });

    await waitFor(() => {
      expect(document.activeElement?.id).toBe('KbdTest-row-0');
      expect(document.activeElement?.textContent).toContain('Row 5');
    });
  });

  it('closes an expanded row with Escape and keeps focus on the opener row', async () => {
    const { container } = renderTable(7, undefined, panel);
    expansion.toggleRow('ds-0');

    await waitFor(() => expect(container.querySelector('tr.expandable-row')).not.toBeNull());
    const pageRows = rows(container);
    pageRows[0].focus();

    await fireEvent.keyDown(pageRows[0], { key: 'Escape' });
    expect(expansion.activeRow).toBe('');
    expect(document.activeElement?.id).toBe('KbdTest-row-0');
  });

  it('Escape from a text field steps back to the owner row first, then closes on repeat', async () => {
    const { container } = renderTable(7, undefined, panelWithInput);
    expansion.toggleRow('ds-0');

    await waitFor(() => expect(container.querySelector('tr.expandable-row input')).not.toBeNull());
    const input = container.querySelector<HTMLInputElement>('tr.expandable-row input')!;
    input.focus();

    await fireEvent.keyDown(input, { key: 'Escape' });
    expect(expansion.activeRow).toBe('ds-0');
    expect(document.activeElement?.id).toBe('KbdTest-row-0');

    await fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    expect(expansion.activeRow).toBe('');
  });

  it('leaves focus alone when Escape closes a panel owned by a different row', async () => {
    const { container } = renderTable(7, undefined, panel);
    expansion.toggleRow('ds-0');

    await waitFor(() => expect(container.querySelector('tr.expandable-row')).not.toBeNull());
    const pageRows = rows(container);
    pageRows[2].focus();

    await fireEvent.keyDown(pageRows[2], { key: 'Escape' });
    expect(expansion.activeRow).toBe('');
    expect(document.activeElement?.id).toBe('KbdTest-row-2');
  });

  it("leaves focus alone when Escape arrives from another row's action button", async () => {
    const { container } = renderTable(7, undefined, panel);
    expansion.toggleRow('ds-0');

    await waitFor(() => expect(container.querySelector('tr.expandable-row')).not.toBeNull());
    const pageRows = rows(container);
    pageRows[2].focus();
    await fireEvent.keyDown(pageRows[2], { key: 'ArrowRight' });
    const action = document.activeElement!;
    expect(action.tagName).toBe('BUTTON');

    await fireEvent.keyDown(action, { key: 'Escape' });
    expect(expansion.activeRow).toBe('');
    expect(document.activeElement).toBe(action);
  });
});

describe('Datatable rows', () => {
  it("expands a clicked row through the owner's expansion, and collapses it on a second click", async () => {
    const { container } = renderTable(7, undefined, panel);
    const first = rows(container)[0];

    await fireEvent.click(first);
    expect(expansion.activeRow).toBe('ds-0');
    await waitFor(() => expect(container.querySelector('#KbdTest-active-row-0')).not.toBeNull());
    expect(first.getAttribute('aria-expanded')).toBe('true');

    await fireEvent.click(first);
    expect(expansion.activeRow).toBe('');
  });

  it('reports a search term once typing pauses', async () => {
    vi.useFakeTimers();
    const onsearch = vi.fn();
    const handler = new TableHandler(makeRows(3), { rowsPerPage: 5 });
    const { getByLabelText } = render(DataTable<TestRow>, {
      tableName: 'SearchTest',
      handler,
      columns,
      searchable: true,
      onsearch,
    });
    const input = getByLabelText('Search table');

    await fireEvent.input(input, { target: { value: 'Ro' } });
    await fireEvent.input(input, { target: { value: 'Row 1' } });
    expect(onsearch).not.toHaveBeenCalled();
    vi.advanceTimersByTime(500);

    expect(onsearch).toHaveBeenCalledExactlyOnceWith('Row 1');
    vi.useRealTimers();
  });
});

describe('isTextEntryField', () => {
  function element(html: string): Element {
    const host = document.createElement('div');
    host.innerHTML = html;
    return host.firstElementChild!;
  }

  it('reserves Escape only for controls with their own Escape semantics', () => {
    expect(isTextEntryField(element('<input type="text" />'))).toBe(true);
    expect(isTextEntryField(element('<input type="number" />'))).toBe(true);
    expect(isTextEntryField(element('<textarea></textarea>'))).toBe(true);
    expect(isTextEntryField(element('<select></select>'))).toBe(true);
    expect(isTextEntryField(element('<input type="checkbox" />'))).toBe(false);
    expect(isTextEntryField(element('<input type="radio" />'))).toBe(false);
    expect(isTextEntryField(element('<button></button>'))).toBe(false);
  });
});
