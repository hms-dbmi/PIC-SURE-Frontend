// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { get } from 'svelte/store';

import Genes from '#lib/explorer/genomic/gene/Genes.svelte';
import * as api from '#lib/api/client.ts';
import { selectedGenes } from '#lib/query/GeneFilter.ts';
import { optionsIn } from '../../../../../tests/support/helpers';

vi.mock('$app/env', () => ({ browser: false }));

vi.mock('#lib/api/client.ts', () => ({
  request: vi.fn(),
}));

vi.mock('#lib/telemetry/logger.ts', () => ({
  log: vi.fn(),
  createLog: vi.fn(),
  getPageContext: vi.fn(),
}));

vi.mock('#lib/ui/toaster.ts', () => ({
  toaster: { error: vi.fn() },
}));

const mockGet = vi.mocked(api.request);

const GENES = ['BRCA1', 'BRCA2', 'CFTR'];

// Await the loaded data itself: the component's containers render before the gene
// request resolves, so waiting on those would not prove the list is populated.
function genesHaveLoaded() {
  return screen.findByRole('checkbox', { name: GENES[0] });
}

function uncheck(gene: string) {
  const selected = screen.getByTestId('ui-options-selection-list-selected');
  const checkbox = selected.querySelector(`input[value="${gene}"]`);
  if (!checkbox) throw new Error(`${gene} is not in the selected list`);
  return fireEvent.click(checkbox);
}

describe('Genes', () => {
  beforeEach(() => {
    mockGet.mockReset();
    selectedGenes.set([]);
    mockGet.mockResolvedValue({ results: GENES, total: GENES.length, page: 1 });
  });

  it('lists every unselected gene once on load', async () => {
    render(Genes);
    await genesHaveLoaded();

    expect(optionsIn('available')).toEqual(GENES);
  });

  it('moves a gene to the selected list when it is checked', async () => {
    render(Genes);
    await genesHaveLoaded();

    await fireEvent.click(screen.getByRole('checkbox', { name: 'BRCA1' }));

    expect(get(selectedGenes)).toEqual(['BRCA1']);
    expect(optionsIn('selected')).toEqual(['BRCA1']);
    expect(optionsIn('available')).toEqual(['BRCA2', 'CFTR']);
  });

  it('returns a gene to the options list exactly once when it is unchecked', async () => {
    render(Genes);
    await genesHaveLoaded();

    await fireEvent.click(screen.getByRole('checkbox', { name: 'BRCA1' }));
    await uncheck('BRCA1');

    expect(get(selectedGenes)).toEqual([]);
    expect(optionsIn('selected')).toEqual([]);
    expect(optionsIn('available')).toEqual(GENES);
  });

  it('keeps an unchecked gene from a saved filter in the options list', async () => {
    // A saved genomic filter can hold a gene that no page of search results contains.
    selectedGenes.set(['ZZZ3']);
    render(Genes);
    await genesHaveLoaded();

    await uncheck('ZZZ3');
    expect(optionsIn('available')).toEqual(['ZZZ3', ...GENES]);

    // Any later selection change recomputes the options list; ZZZ3 must survive it.
    await fireEvent.click(screen.getByRole('checkbox', { name: 'BRCA1' }));

    expect(optionsIn('available')).toEqual(['ZZZ3', 'BRCA2', 'CFTR']);
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
    expect(mockGet.mock.calls[1][1]?.query).toMatchObject({ query: 'BRC' });
  });
});
