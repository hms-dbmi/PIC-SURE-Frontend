// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/svelte';

import ClientTable from '#lib/ui/datatable/ClientTable.svelte';

const columns = [{ dataElement: 'name' as const, label: 'Name' }];
const row = { name: 'Row A', dataset_id: 'ds-1' };

afterEach(() => {
  vi.clearAllMocks();
});

describe('Datatable Row', () => {
  it('activates the row on Enter and Space through the same click path', async () => {
    const rowClickHandler = vi.fn();

    const { container } = render(ClientTable, {
      tableName: 'ExplorerTable',
      id: 'test-table',
      columns,
      rows: [row],
      isClickable: true,
      rowClickHandler,
    });

    const tr = container.querySelector('tr[id$="-row-0"]')!;
    await fireEvent.keyDown(tr, { key: 'Enter' });
    await fireEvent.keyDown(tr, { key: ' ' });

    expect(rowClickHandler).toHaveBeenCalledTimes(2);
  });

  it('treats configured rowClickKeys as row activation shortcuts', async () => {
    const rowClickHandler = vi.fn();

    const { container } = render(ClientTable, {
      tableName: 'ActiveDatasets',
      id: 'test-table',
      columns,
      rows: [row],
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

    const { container } = render(ClientTable, {
      tableName: 'ActiveDatasets',
      id: 'test-table',
      columns,
      rows: [row],
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

    const { container } = render(ClientTable, {
      tableName: 'ActiveDatasets',
      id: 'test-table',
      columns,
      rows: [row],
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

    const { container } = render(ClientTable, {
      tableName: 'ActiveDatasets',
      id: 'test-table',
      columns,
      rows: [row],
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
