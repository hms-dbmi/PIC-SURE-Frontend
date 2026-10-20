import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import type { State } from '@vincjo/datatables/server';

import FacetSideBar from '#lib/explorer/components/facets/FacetSideBar.svelte';
import { explorerSearch } from '#lib/explorer/search.svelte.ts';
import type { Facet, DictionaryFacetResult } from '#lib/api/picsure/dictionary.types.ts';

const mocks = vi.hoisted(() => ({ searchFacets: vi.fn() }));

vi.mock('$app/env', () => ({ browser: true }));
vi.mock('#lib/explorer/Dictionary.ts', () => ({
  searchDictionary: vi.fn().mockResolvedValue({ content: [], totalElements: 0 }),
  searchFacets: mocks.searchFacets,
}));
vi.mock('#lib/telemetry/logger.ts', () => ({
  log: vi.fn(),
  createLog: vi.fn(),
  getPageContext: vi.fn(),
}));

function facet(name: string, category: string, count = 1): Facet {
  return { name, display: `${name} display`, description: '', count, category };
}

function category(name: string, facetNames: string[]): DictionaryFacetResult {
  return {
    name,
    display: `${name} display`,
    description: '',
    facets: facetNames.map((f) => facet(f, name)),
  };
}

function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((res) => (resolve = res));
  return { promise, resolve };
}

const state = { currentPage: 1, rowsPerPage: 10, setTotalRows: vi.fn() } as unknown as State;
let load: (state: State) => Promise<unknown>;
let release: () => void;

async function settle() {
  await new Promise((r) => setTimeout(r));
}

beforeEach(() => {
  mocks.searchFacets.mockReset();
  vi.spyOn(console, 'debug').mockImplementation(() => {});
  const loadSpy = vi.spyOn(explorerSearch.table, 'load').mockImplementation((cb) => {
    load = cb as typeof load;
  });
  release = explorerSearch.start();
  loadSpy.mockRestore();
});

afterEach(() => {
  release();
  explorerSearch.reset();
  vi.mocked(console.debug).mockRestore();
});

describe('FacetSideBar', () => {
  it('shows the placeholder until the first facet response, then the categories', async () => {
    const response = deferred<DictionaryFacetResult[]>();
    mocks.searchFacets.mockReturnValueOnce(response.promise);
    render(FacetSideBar);

    await load(state);
    expect(screen.getAllByTestId('explorer-facet-placeholder')).not.toHaveLength(0);

    response.resolve([category('study', ['s1'])]);
    await settle();

    expect(screen.queryByTestId('explorer-facet-placeholder')).not.toBeInTheDocument();
    expect(screen.getByText('study display')).toBeInTheDocument();
  });

  it('keeps the rendered tree in place while a refetch runs', async () => {
    mocks.searchFacets
      .mockResolvedValueOnce([category('study', ['s1'])])
      .mockReturnValueOnce(deferred<DictionaryFacetResult[]>().promise);
    render(FacetSideBar);
    await load(state);
    await settle();
    const checkbox = screen.getByRole('checkbox', { name: /s1 display/ });

    explorerSearch.setFacets([facet('s1', 'study')]);
    await load(state);
    await settle();

    expect(screen.queryByTestId('explorer-facet-placeholder')).not.toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /s1 display/ })).toBe(checkbox);
  });

  it('shows an error when the facet request fails', async () => {
    mocks.searchFacets.mockRejectedValueOnce(new Error('boom'));
    render(FacetSideBar);

    await load(state);
    await settle();

    expect(screen.getByText('Something went wrong loading your search options.')).toBeVisible();
  });

  it('groups the selected facets by category when the response has none', async () => {
    mocks.searchFacets.mockResolvedValueOnce([]);
    const categoryRef = { name: 'study', display: 'Study', description: '' };
    explorerSearch.setFacets([
      { ...facet('a', 'study'), categoryRef },
      { ...facet('b', 'study'), categoryRef },
    ]);
    render(FacetSideBar);

    await load(state);
    await settle();

    expect(screen.getAllByText('Study')).toHaveLength(1);
  });

  it('keeps a category filter clearable after a refetch shrinks the category', async () => {
    const many = ['s1', 's2', 's3', 's4', 's5', 's6'];
    mocks.searchFacets
      .mockResolvedValueOnce([category('study', many)])
      .mockResolvedValueOnce([category('study', ['s1', 's2'])]);
    render(FacetSideBar);
    await load(state);
    await settle();

    await fireEvent.input(screen.getByPlaceholderText('Filter study display'), {
      target: { value: 's6' },
    });
    explorerSearch.setTerm('age');
    await load(state);
    await settle();

    expect(screen.getByPlaceholderText('Filter study display')).toHaveValue('s6');
  });
});
