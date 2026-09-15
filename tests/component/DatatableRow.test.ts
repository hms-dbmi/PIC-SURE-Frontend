// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/svelte';

vi.mock('$lib/logger', () => ({
  log: vi.fn(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createLog: vi.fn((...args: any[]) => args),
  getPageContext: vi.fn(() => 'test-context'),
}));

import Row from '$lib/components/datatable/Row.svelte';
import { createLog } from '$lib/logger';

const mockedCreateLog = vi.mocked(createLog);

const columns = [{ dataElement: 'name', label: 'Name' }];
const row = { name: 'Row A', dataset_id: 'ds-1' };

// A stand-in for whatever a consumer opts in with. No table opts in today - Explore's
// results are cards, which log their own click - so naming a real action here would assert
// against nothing in the app.
const OPT_IN_ACTION = 'test_table.row_click';

function rowClickActions(): string[] {
  return mockedCreateLog.mock.calls
    .filter((call) => call[0] === 'ACTION')
    .map((call) => call[1] as string);
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('Datatable Row', () => {
  it('emits no ACTION log for a consumer that provides a click handler but no log action (e.g. dashboard)', async () => {
    const rowClickHandler = vi.fn();

    const { container } = render(Row, {
      tableName: 'ExplorerTable',
      columns,
      index: 0,
      row,
      isClickable: true,
      rowClickHandler,
    });

    await fireEvent.click(container.querySelector('tr[id$="-row-0"]')!);

    // The consumer's handler runs (the dashboard logs dashboard.row_click itself).
    expect(rowClickHandler).toHaveBeenCalledTimes(1);
    // The generic row must NOT log on its own behalf.
    expect(rowClickActions()).toEqual([]);
  });

  it('emits the action a consumer opts in to via rowClickLogAction', async () => {
    const { container } = render(Row, {
      tableName: 'SomeTable',
      columns,
      index: 0,
      row,
      isClickable: true,
      rowClickLogAction: OPT_IN_ACTION,
    });

    await fireEvent.click(container.querySelector('tr[id$="-row-0"]')!);

    expect(rowClickActions()).toEqual([OPT_IN_ACTION]);
  });

  it('activates the row on Enter and Space through the same click path (logging included)', async () => {
    const rowClickHandler = vi.fn();

    const { container } = render(Row, {
      tableName: 'SomeTable',
      columns,
      index: 0,
      row,
      isClickable: true,
      rowClickHandler,
      rowClickLogAction: OPT_IN_ACTION,
    });

    const tr = container.querySelector('tr[id$="-row-0"]')!;
    await fireEvent.keyDown(tr, { key: 'Enter' });
    await fireEvent.keyDown(tr, { key: ' ' });

    expect(rowClickHandler).toHaveBeenCalledTimes(2);
    expect(rowClickActions().filter((a) => a === OPT_IN_ACTION)).toHaveLength(2);
  });

  it('treats configured rowClickKeys as row activation shortcuts', async () => {
    const rowClickHandler = vi.fn();

    const { container } = render(Row, {
      tableName: 'ActiveDatasets',
      columns,
      index: 0,
      row,
      isClickable: true,
      rowClickHandler,
      rowClickKeys: ['v'],
    });

    const tr = container.querySelector('tr[id$="-row-0"]')!;
    await fireEvent.keyDown(tr, { key: 'v' });
    expect(rowClickHandler).toHaveBeenCalledTimes(1);

    // A letter with no configured shortcut and no matching action button is a no-op.
    await fireEvent.keyDown(tr, { key: 'z' });
    expect(rowClickHandler).toHaveBeenCalledTimes(1);
  });

  it('ignores shortcuts when a modifier key is held', async () => {
    const rowClickHandler = vi.fn();

    const { container } = render(Row, {
      tableName: 'ActiveDatasets',
      columns,
      index: 0,
      row,
      isClickable: true,
      rowClickHandler,
      rowClickKeys: ['v'],
    });

    const tr = container.querySelector('tr[id$="-row-0"]')!;
    await fireEvent.keyDown(tr, { key: 'v', ctrlKey: true });
    await fireEvent.keyDown(tr, { key: 'v', metaKey: true });
    await fireEvent.keyDown(tr, { key: 'v', shiftKey: true });
    expect(rowClickHandler).not.toHaveBeenCalled();
  });

  it('ignores keyboard activation entirely when the table is not clickable', async () => {
    const rowClickHandler = vi.fn();

    const { container } = render(Row, {
      tableName: 'ActiveDatasets',
      columns,
      index: 0,
      row,
      isClickable: false,
      rowClickHandler,
      rowClickKeys: ['v'],
    });

    const tr = container.querySelector('tr[id$="-row-0"]')!;
    await fireEvent.keyDown(tr, { key: 'Enter' });
    await fireEvent.keyDown(tr, { key: 'v' });
    expect(rowClickHandler).not.toHaveBeenCalled();
  });

  it('does not rapid-fire activations while a key is held (event.repeat)', async () => {
    const rowClickHandler = vi.fn();

    const { container } = render(Row, {
      tableName: 'ActiveDatasets',
      columns,
      index: 0,
      row,
      isClickable: true,
      rowClickHandler,
      rowClickKeys: ['v'],
    });

    const tr = container.querySelector('tr[id$="-row-0"]')!;
    await fireEvent.keyDown(tr, { key: 'v' });
    await fireEvent.keyDown(tr, { key: 'v', repeat: true });
    await fireEvent.keyDown(tr, { key: 'Enter', repeat: true });
    expect(rowClickHandler).toHaveBeenCalledTimes(1);
  });
});
