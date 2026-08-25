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

// The real ExpandableRow store eagerly imports explorer components that touch
// localStorage at module load, which isn't available in this environment. We
// only need the store contract the datatable consumes, so provide a minimal stub.
vi.mock('$lib/stores/ExpandableRow', () => {
  const make = (value: unknown) => {
    let current = value;
    const subscribers = new Set<(v: unknown) => void>();
    return {
      subscribe(fn: (v: unknown) => void) {
        fn(current);
        subscribers.add(fn);
        return () => subscribers.delete(fn);
      },
      set(next: unknown) {
        current = next;
        subscribers.forEach((fn) => fn(current));
      },
    };
  };
  return {
    activeTable: make(''),
    activeRow: make(''),
    activeComponent: make(undefined),
    setActiveRow: vi.fn(),
    closeActiveRow: vi.fn(),
  };
});

import { TableHandler as ServerTableHandler } from '@vincjo/datatables/server';

import RemoteTable from '$lib/components/datatable/RemoteTable.svelte';
import { isTextEntryField } from '$lib/components/datatable/keyboard';
import { activeTable, activeRow, activeComponent, closeActiveRow } from '$lib/stores/ExpandableRow';
import KeyButtonCell from './fixtures/KeyButtonCell.svelte';
import PanelInputCell from './fixtures/PanelInputCell.svelte';

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

function renderTable(rowCount = 7, onAction?: () => void, expandable = false) {
  const handler = new TableHandler(makeRows(rowCount, onAction), { rowsPerPage: 5 });
  const result = render(RemoteTable, {
    tableName: 'KbdTest',
    handler,
    columns,
    cellOverides: { id: KeyButtonCell },
    isClickable: true,
    expandable,
  });
  return { handler, ...result };
}

function rows(container: HTMLElement): HTMLTableRowElement[] {
  return Array.from(container.querySelectorAll('tr[id^="row-"]'));
}

afterEach(() => {
  vi.clearAllMocks();
  activeTable.set('');
  activeRow.set('');
  activeComponent.set(undefined);
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
    expect(document.activeElement?.id).toBe('row-1');

    await fireEvent.keyDown(document.activeElement!, { key: 'ArrowUp' });
    expect(document.activeElement?.id).toBe('row-0');

    await fireEvent.keyDown(document.activeElement!, { key: 'End' });
    expect(document.activeElement?.id).toBe('row-4');

    await fireEvent.keyDown(document.activeElement!, { key: 'Home' });
    expect(document.activeElement?.id).toBe('row-0');
  });

  it('advances to the next page from the last row and focuses its first row', async () => {
    const { container, handler } = renderTable(7);
    const pageRows = rows(container);
    pageRows[4].focus();

    await fireEvent.keyDown(pageRows[4], { key: 'ArrowDown' });

    await waitFor(() => {
      expect(handler.currentPage).toBe(2);
      expect(document.activeElement?.id).toBe('row-0');
    });
    // Second page has rows 5 and 6 of the 7-row dataset.
    expect(document.activeElement?.textContent).toContain('Row 5');

    // ArrowUp on the first row of page 2 returns to the last row of page 1.
    await fireEvent.keyDown(document.activeElement!, { key: 'ArrowUp' });
    await waitFor(() => {
      expect(handler.currentPage).toBe(1);
      expect(document.activeElement?.id).toBe('row-4');
    });
  });

  it('does not page past the boundaries', async () => {
    const { container, handler } = renderTable(3);
    const pageRows = rows(container);
    pageRows[0].focus();

    await fireEvent.keyDown(pageRows[0], { key: 'ArrowUp' });
    expect(handler.currentPage).toBe(1);
    expect(document.activeElement?.id).toBe('row-0');

    await fireEvent.keyDown(document.activeElement!, { key: 'End' });
    await fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
    expect(handler.currentPage).toBe(1);
    expect(document.activeElement?.id).toBe('row-2');
  });

  it('reaches row action buttons with ArrowRight and returns with ArrowLeft', async () => {
    const { container } = renderTable();
    const pageRows = rows(container);
    pageRows[0].focus();

    await fireEvent.keyDown(pageRows[0], { key: 'ArrowRight' });
    expect(document.activeElement?.tagName).toBe('BUTTON');
    expect(document.activeElement?.getAttribute('data-key')).toBe('x');

    await fireEvent.keyDown(document.activeElement!, { key: 'ArrowLeft' });
    expect(document.activeElement?.id).toBe('row-0');
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
    const allRows = makeRows(7);
    const handler = new ServerTableHandler(makeRows(0), { rowsPerPage: 5 });
    handler.load(async (state) => {
      handler.totalRows = allRows.length;
      const start = (state.currentPage - 1) * state.rowsPerPage;
      return allRows.slice(start, start + state.rowsPerPage);
    });
    handler.invalidate();

    const { container } = render(RemoteTable, {
      tableName: 'KbdTest',
      handler,
      columns,
      cellOverides: { id: KeyButtonCell },
      isClickable: true,
    });
    await waitFor(() => expect(rows(container)).toHaveLength(5));

    const pageRows = rows(container);
    pageRows[4].focus();
    await fireEvent.keyDown(pageRows[4], { key: 'ArrowDown' });

    await waitFor(() => {
      expect(document.activeElement?.id).toBe('row-0');
      expect(document.activeElement?.textContent).toContain('Row 5');
    });
  });

  it('closes an expanded row with Escape and keeps focus on the opener row', async () => {
    const { container } = renderTable(7, undefined, true);
    activeTable.set('KbdTest');
    activeRow.set('ds-0');

    await waitFor(() => expect(container.querySelector('tr.expandable-row')).not.toBeNull());
    const pageRows = rows(container);
    pageRows[0].focus();

    await fireEvent.keyDown(pageRows[0], { key: 'Escape' });
    expect(vi.mocked(closeActiveRow)).toHaveBeenCalledTimes(1);
    expect(document.activeElement?.id).toBe('row-0');
  });

  it('Escape from a text field steps back to the owner row first, then closes on repeat', async () => {
    const { container } = renderTable(7, undefined, true);
    activeTable.set('KbdTest');
    activeRow.set('ds-0');
    activeComponent.set(PanelInputCell);

    await waitFor(() => expect(container.querySelector('tr.expandable-row input')).not.toBeNull());
    const input = container.querySelector<HTMLInputElement>('tr.expandable-row input')!;
    input.focus();

    await fireEvent.keyDown(input, { key: 'Escape' });
    expect(vi.mocked(closeActiveRow)).not.toHaveBeenCalled();
    expect(document.activeElement?.id).toBe('row-0');

    await fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    expect(vi.mocked(closeActiveRow)).toHaveBeenCalledTimes(1);
  });

  it('leaves focus alone when Escape closes a panel owned by a different row', async () => {
    const { container } = renderTable(7, undefined, true);
    activeTable.set('KbdTest');
    activeRow.set('ds-0');

    await waitFor(() => expect(container.querySelector('tr.expandable-row')).not.toBeNull());
    const pageRows = rows(container);
    pageRows[2].focus();

    await fireEvent.keyDown(pageRows[2], { key: 'Escape' });
    expect(vi.mocked(closeActiveRow)).toHaveBeenCalledTimes(1);
    expect(document.activeElement?.id).toBe('row-2');
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
