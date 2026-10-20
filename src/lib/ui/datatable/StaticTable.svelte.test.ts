// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, within } from '@testing-library/svelte';

vi.mock('$app/env', () => ({ browser: true }));
vi.mock('#lib/telemetry/logger.ts', () => ({
  log: vi.fn(),
  createLog: vi.fn(),
  getPageContext: vi.fn(),
}));

import StaticTable from '#lib/ui/datatable/StaticTable.svelte';

const data = Array.from({ length: 30 }, (_, i) => ({ name: `Row ${i}` }));
const columns = [{ dataElement: 'name', label: 'Name' }];

function renderTable(tableName: string) {
  const { container } = render(StaticTable, { tableName, data, columns, showPagination: true });
  return within(container as HTMLElement);
}

describe('StaticTable rows per page', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('starts each table at its own stored page size', () => {
    localStorage.setItem('datatableSettings', JSON.stringify({ Second: 5 }));

    expect(renderTable('First').getAllByRole('row')).toHaveLength(11);
    expect(renderTable('Second').getAllByRole('row')).toHaveLength(6);
    expect(JSON.parse(localStorage.getItem('datatableSettings') ?? '')).toEqual({
      First: 10,
      Second: 5,
    });
  });

  it('changes one mounted table’s page size without touching another’s', async () => {
    // Svelte's select binding reads the chosen option through `:checked`, which happy-dom doesn't
    // match on <option>.
    const querySelector = HTMLSelectElement.prototype.querySelector;
    vi.spyOn(HTMLSelectElement.prototype, 'querySelector').mockImplementation(function (
      this: HTMLSelectElement,
      selector: string,
    ) {
      return selector === ':checked'
        ? (this.selectedOptions[0] ?? null)
        : querySelector.call(this, selector);
    });
    localStorage.setItem('datatableSettings', JSON.stringify({ Second: 5 }));
    const first = renderTable('First');
    const second = renderTable('Second');

    (first.getByRole('option', { name: '20' }) as HTMLOptionElement).selected = true;
    await fireEvent.change(first.getByRole('combobox', { name: 'Rows per page' }));

    expect(first.getAllByRole('row')).toHaveLength(21);
    expect(second.getAllByRole('row')).toHaveLength(6);
    expect(JSON.parse(localStorage.getItem('datatableSettings') ?? '')).toEqual({
      First: 20,
      Second: 5,
    });
  });

  it('falls back to the default when the stored settings are not an object', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem('datatableSettings', 'null');

    expect(renderTable('First').getAllByRole('row')).toHaveLength(11);
  });
});
