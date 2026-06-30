// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/svelte';

vi.mock('$lib/logger', () => ({
  log: vi.fn(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createLog: vi.fn((...args: any[]) => args),
  getPageContext: vi.fn(() => 'test-context'),
}));

// The real ExpandableRow store eagerly imports explorer components that touch
// localStorage at module load, which isn't available in this environment. We
// only need the store contract Row.svelte consumes, so provide a minimal stub.
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
  };
});

import Row from '$lib/components/datatable/Row.svelte';
import { createLog } from '$lib/logger';

const mockedCreateLog = vi.mocked(createLog);

const columns = [{ dataElement: 'name', label: 'Name' }];
const row = { name: 'Row A', dataset_id: 'ds-1' };

function rowClickActions(): string[] {
  return mockedCreateLog.mock.calls
    .filter((call) => call[0] === 'ACTION')
    .map((call) => call[1] as string);
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('Datatable Row', () => {
  it('does not emit search_result.row_click when a consumer provides its own click handler (e.g. dashboard)', async () => {
    const rowClickHandler = vi.fn();

    const { container } = render(Row, {
      tableName: 'ExplorerTable',
      columns,
      index: 0,
      row,
      isClickable: true,
      rowClickHandler,
    });

    await fireEvent.click(container.querySelector('#row-0')!);

    // The consumer's handler runs (the dashboard logs dashboard.row_click itself).
    expect(rowClickHandler).toHaveBeenCalledTimes(1);
    // The generic row must NOT also emit the search-result action.
    expect(rowClickActions()).not.toContain('search_result.row_click');
  });

  it('emits search_result.row_click for the search-results table that opts in via rowClickLogAction', async () => {
    const { container } = render(Row, {
      tableName: 'ExplorerTable',
      columns,
      index: 0,
      row,
      isClickable: true,
      expandable: true,
      rowClickLogAction: 'search_result.row_click',
    });

    await fireEvent.click(container.querySelector('#row-0')!);

    expect(rowClickActions()).toContain('search_result.row_click');
  });
});
