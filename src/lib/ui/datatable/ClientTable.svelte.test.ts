// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, within } from '@testing-library/svelte';

vi.mock('$app/env', () => ({ browser: true }));
import ClientTable from '#lib/ui/datatable/ClientTable.svelte';

const data = Array.from({ length: 30 }, (_, i) => ({ name: `Row ${i}` }));
const columns = [{ dataElement: 'name' as const, label: 'Name', sort: true }];

function renderTable(tableName: string) {
  const { container } = render(ClientTable, {
    tableName,
    rows: data,
    columns,
    showPagination: true,
  });
  return within(container as HTMLElement);
}

describe('ClientTable rows per page', () => {
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

describe('ClientTable rows', () => {
  it('keeps its sort when the rows change', async () => {
    const view = render(ClientTable, { tableName: 'Sorted', rows: data, columns });
    const table = within(view.container as HTMLElement);
    await fireEvent.click(table.getByRole('button', { name: /Name/ }));
    await fireEvent.click(table.getByRole('button', { name: /Name/ }));
    expect(table.getAllByRole('row')[1]).toHaveTextContent('Row 9');

    await view.rerender({ rows: [...data, { name: 'Row 99' }] });

    expect(table.getAllByRole('row')[1]).toHaveTextContent('Row 99');
    expect(table.getAllByRole('row')[2]).toHaveTextContent('Row 9');
  });

  it('goes back to the first page when the rows change', async () => {
    const view = render(ClientTable, { tableName: 'Paged', rows: data.slice(0, 11), columns });
    const table = within(view.container as HTMLElement);
    await fireEvent.click(table.getByRole('button', { name: 'Page 2' }));
    expect(table.getAllByRole('row')[1]).toHaveTextContent('Row 10');

    await view.rerender({ rows: data.slice(0, 10) });

    expect(table.getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');
    expect(table.getAllByRole('row')[1]).toHaveTextContent('Row 0');
  });
});
