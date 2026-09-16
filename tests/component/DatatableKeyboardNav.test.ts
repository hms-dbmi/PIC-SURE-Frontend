// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { TableHandler } from '@vincjo/datatables';

vi.mock('$lib/logger', () => ({
  log: vi.fn(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createLog: vi.fn((...args: any[]) => args),
  getPageContext: vi.fn(() => 'test-context'),
}));

import { TableHandler as ServerTableHandler } from '@vincjo/datatables/server';

import RemoteTable from '$lib/components/datatable/RemoteTable.svelte';
import { tableIdPrefix } from '$lib/components/datatable/keyboard';
import KeyButtonCell from './fixtures/KeyButtonCell.svelte';

const columns = [
  { dataElement: 'name', label: 'Name' },
  { dataElement: 'id', label: 'Actions' },
];

function makeRows(count: number, onAction?: () => void) {
  return Array.from({ length: count }, (_, i) => ({
    name: `Row ${i}`,
    dataset_id: `ds-${i}`,
    id: `ds-${i}`,
    onAction,
  }));
}

function renderTable(rowCount = 7, onAction?: () => void) {
  const handler = new TableHandler(makeRows(rowCount, onAction), { rowsPerPage: 5 });
  const result = render(RemoteTable, {
    tableName: 'KbdTest',
    handler,
    columns,
    cellOverides: { id: KeyButtonCell },
    isClickable: true,
  });
  return { handler, ...result };
}

function rows(container: HTMLElement): HTMLTableRowElement[] {
  return Array.from(container.querySelectorAll('tr[id^="KbdTest-row-"]'));
}

afterEach(() => {
  vi.clearAllMocks();
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

    const { container, rerender } = render(RemoteTable, {
      tableName: 'KbdTest',
      handler,
      columns,
      cellOverides: { id: KeyButtonCell },
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
});

describe('tableIdPrefix', () => {
  it('keeps selector-safe names intact and escapes the rest without collapsing them', () => {
    expect(tableIdPrefix('ActiveDatasets')).toBe('ActiveDatasets');
    expect(tableIdPrefix('Users-Site A')).toBe('Users-Site_20_A');
    expect(tableIdPrefix('Users-A/B')).not.toBe(tableIdPrefix('Users-A?B'));
    expect(tableIdPrefix('Users-"quoted"')).not.toContain('"');
  });
});
