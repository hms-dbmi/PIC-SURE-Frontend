// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, within } from '@testing-library/svelte';

vi.mock('$app/env', () => ({ browser: true }));
vi.mock('#lib/telemetry/logger.ts', () => ({
  log: vi.fn(),
  createLog: vi.fn(),
  getPageContext: vi.fn(),
}));
// The real store imports explorer components that touch localStorage at module load.
vi.mock('#lib/explorer/ExpandableRow.ts', async () => {
  const { writable } = await import('svelte/store');
  return {
    activeTable: writable(''),
    activeRow: writable(''),
    activeComponent: writable(undefined),
    setActiveRow: vi.fn(),
    closeActiveRow: vi.fn(),
  };
});

import StaticTable from '#lib/ui/datatable/StaticTable.svelte';
import { setDefaultRows } from '#lib/ui/datatable/rowsPerPage.ts';

const data = Array.from({ length: 30 }, (_, i) => ({ name: `Row ${i}` }));
const columns = [{ dataElement: 'name', label: 'Name' }];

function renderTable(tableName: string) {
  const { container } = render(StaticTable, { tableName, data, columns, showPagination: true });
  return within(container as HTMLElement);
}

describe('StaticTable rows per page', () => {
  beforeEach(() => localStorage.clear());

  it('starts each table at its own stored page size', () => {
    localStorage.setItem('datatableSettings', JSON.stringify({ Second: 5 }));

    expect(renderTable('First').getAllByRole('row')).toHaveLength(11);
    expect(renderTable('Second').getAllByRole('row')).toHaveLength(6);
    expect(JSON.parse(localStorage.getItem('datatableSettings') ?? '')).toEqual({
      First: 10,
      Second: 5,
    });
  });

  // happy-dom can't drive the rows-per-page <select> (no `:checked` on options), so this saves the
  // choice the way the select's change handler does.
  it('saves one table’s page size without touching another’s', () => {
    localStorage.setItem('datatableSettings', JSON.stringify({ First: 10, Second: 5 }));
    setDefaultRows('First', 20);

    expect(renderTable('First').getAllByRole('row')).toHaveLength(21);
    expect(renderTable('Second').getAllByRole('row')).toHaveLength(6);
  });
});
