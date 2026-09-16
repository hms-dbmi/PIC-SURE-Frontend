// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { get } from 'svelte/store';

import Genes from '$lib/components/explorer/genome-filter/gene/Genes.svelte';
import * as api from '$lib/api';
import { emptyGeneOptions, geneOptions, selectedGenes } from '$lib/stores/GeneFilter';
import { optionsIn } from './helpers';

vi.mock('$app/environment', () => ({ browser: false }));

vi.mock('$lib/api', () => ({
  get: vi.fn(),
}));

vi.mock('$lib/logger', () => ({
  log: vi.fn(),
  createLog: vi.fn(),
  getPageContext: vi.fn(),
}));

vi.mock('$lib/toaster', () => ({
  toaster: { error: vi.fn() },
}));

const mockGet = vi.mocked(api.get);

const GENES = ['BRCA1', 'BRCA2', 'CFTR'];

// Await the loaded data itself: the component's containers render before the gene
// request resolves, so waiting on those would not prove the list is populated.
function genesHaveLoaded() {
  return screen.findByRole('checkbox', { name: GENES[0] });
}

function uncheck(gene: string) {
  const selected = document.getElementById('selected-options-container');
  const checkbox = selected?.querySelector(`input[value="${gene}"]`);
  if (!checkbox) throw new Error(`${gene} is not in the selected list`);
  return fireEvent.click(checkbox);
}

describe('Genes', () => {
  beforeEach(() => {
    mockGet.mockReset();
    selectedGenes.set([]);
    // The loaded options outlive the component on purpose - see the store - so each test
    // has to start from an empty list or it inherits the last one's.
    geneOptions.set(emptyGeneOptions());
    mockGet.mockResolvedValue({ results: GENES, total: GENES.length, page: 1 });
  });

  it('lists every unselected gene once on load', async () => {
    render(Genes);
    await genesHaveLoaded();

    expect(optionsIn('options-container')).toEqual(GENES);
  });

  it('moves a gene to the selected list when it is checked', async () => {
    render(Genes);
    await genesHaveLoaded();

    await fireEvent.click(screen.getByRole('checkbox', { name: 'BRCA1' }));

    expect(get(selectedGenes)).toEqual(['BRCA1']);
    expect(optionsIn('selected-options-container')).toEqual(['BRCA1']);
    expect(optionsIn('options-container')).toEqual(['BRCA2', 'CFTR']);
  });

  it('returns a gene to the options list exactly once when it is unchecked', async () => {
    render(Genes);
    await genesHaveLoaded();

    await fireEvent.click(screen.getByRole('checkbox', { name: 'BRCA1' }));
    await uncheck('BRCA1');

    expect(get(selectedGenes)).toEqual([]);
    expect(optionsIn('selected-options-container')).toEqual([]);
    expect(optionsIn('options-container')).toEqual(GENES);
  });

  it('keeps an unchecked gene from a saved filter in the options list', async () => {
    // A saved genomic filter can hold a gene that no page of search results contains.
    selectedGenes.set(['ZZZ3']);
    render(Genes);
    await genesHaveLoaded();

    await uncheck('ZZZ3');
    expect(optionsIn('options-container')).toEqual(['ZZZ3', ...GENES]);

    // Any later selection change recomputes the options list; ZZZ3 must survive it.
    await fireEvent.click(screen.getByRole('checkbox', { name: 'BRCA1' }));

    expect(optionsIn('options-container')).toEqual(['ZZZ3', 'BRCA2', 'CFTR']);
  });

  it('sends one search request for a burst of typing', async () => {
    render(Genes);
    await genesHaveLoaded();
    expect(mockGet).toHaveBeenCalledTimes(1); // the initial load

    const search = document.querySelector('input[type="search"]') as HTMLInputElement;
    for (const term of ['B', 'BR', 'BRC']) {
      await fireEvent.input(search, { target: { value: term } });
    }
    expect(mockGet).toHaveBeenCalledTimes(1);

    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(2), { timeout: 2000 });
    expect(mockGet.mock.calls[1][0]).toContain('query=BRC');
  });

  // The gene panel is on a route: every search-mode switch unmounts and remounts it. Loading
  // again would refetch page one, discard however far the user had scrolled, and - against an
  // unhealthy values endpoint - raise another failure toast every time.
  describe('across a remount, as a search-mode switch causes', () => {
    it('does not load the list again', async () => {
      const first = render(Genes);
      await genesHaveLoaded();
      expect(mockGet).toHaveBeenCalledTimes(1);

      first.unmount();
      render(Genes);

      expect(optionsIn('options-container')).toEqual(GENES);
      expect(mockGet).toHaveBeenCalledTimes(1);
    });

    it('keeps the scroll position, so the next page continues from it', async () => {
      // A full page back means there is more to scroll for; the cursor has to survive with
      // the options, or the next scroll asks for page 2 again.
      const pageOne = Array.from({ length: 20 }, (_, index) => `GENE${index}`);
      mockGet.mockResolvedValue({ results: pageOne, total: 40, page: 1 });
      const first = render(Genes);
      await screen.findByRole('checkbox', { name: 'GENE0' });

      first.unmount();
      mockGet.mockResolvedValue({ results: ['GENE20'], total: 40, page: 2 });
      render(Genes);

      const container = document.getElementById('options-container') as HTMLElement;
      await fireEvent.scroll(container);

      await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(2));
      expect(mockGet.mock.calls[1][0]).toContain('page=2');
    });

    it('restores the search box alongside the options it answers to', async () => {
      const searched = render(Genes);
      await genesHaveLoaded();

      const search = document.querySelector('input[type="search"]') as HTMLInputElement;
      mockGet.mockResolvedValue({ results: ['BRCA1'], total: 1, page: 1 });
      await fireEvent.input(search, { target: { value: 'BRC' } });
      await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(2), { timeout: 2000 });

      searched.unmount();
      render(Genes);

      // A searched list under an empty box would claim to be the whole list
      const restored = document.querySelector('input[type="search"]') as HTMLInputElement;
      expect(restored.value).toBe('BRC');
      expect(optionsIn('options-container')).toEqual(['BRCA1']);
      expect(mockGet).toHaveBeenCalledTimes(2);
    });
  });
});
