// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { get } from 'svelte/store';

const mockState = vi.hoisted(() => ({
  features: { enableGENEQuery: true, enableSNPQuery: false },
}));

vi.mock('$app/environment', () => ({ browser: false }));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/paths', () => ({ resolve: (path: string) => path }));

vi.mock('$lib/configuration.svelte', () => ({
  config: {
    get features() {
      return mockState.features;
    },
    branding: {
      applicationName: 'PIC-SURE',
      help: { popups: { genomicFilter: { consequence: 'consequence help', frequency: 'freq' } } },
    },
  },
  resetConfig: () => {},
}));

vi.mock('$lib/logger', () => ({
  log: vi.fn(),
  createLog: vi.fn(),
  getPageContext: vi.fn(),
}));

vi.mock('$lib/api', () => ({ get: vi.fn().mockResolvedValue({ results: [], total: 0, page: 1 }) }));
vi.mock('$lib/toaster', () => ({ toaster: { error: vi.fn() } }));

vi.mock('$lib/stores/Filter', () => ({ addFilter: vi.fn() }));

vi.mock('$lib/stores/Search', async () => {
  const { writable } = await import('svelte/store');
  return { searchTerm: writable('') };
});

vi.mock('$lib/stores/SidePanel', async () => {
  const { writable } = await import('svelte/store');
  return { panelOpen: writable(false) };
});

import GenotypesTab from '../../src/routes/(picsure)/(public)/explorer/genotypes/+page.svelte';
import { goto } from '$app/navigation';
import { Option } from '$lib/models/GenomeFilter';
import { addFilter } from '$lib/stores/Filter';
import { clearGeneFilters, selectedFrequency, selectedGenes } from '$lib/stores/GeneFilter';
import { filterMethod } from '$lib/stores/GenomicFilterMethod';
import { searchTerm } from '$lib/stores/Search';
import { panelOpen } from '$lib/stores/SidePanel';
import { clearSnpFilters, selectedSNPs } from '$lib/stores/SNPFilter';

/** Both flags on is NHANES; GENE alone is BDC. Neither is unreachable - the load redirects. */
function enable(gene: boolean, snp: boolean) {
  mockState.features = { enableGENEQuery: gene, enableSNPQuery: snp };
}

const geneOption = () => screen.queryByTestId('gene-variant-option');
const snpOption = () => screen.queryByTestId('snp-option');
const addFilterBtn = () => screen.getByTestId('add-filter-btn');

describe('the Genotypes tab', () => {
  beforeEach(() => {
    enable(true, false);
    clearGeneFilters();
    clearSnpFilters();
    filterMethod.set(Option.None);
    searchTerm.set('');
    panelOpen.set(false);
    vi.mocked(goto).mockClear();
    vi.mocked(addFilter).mockClear();
  });

  // The tab bar is the navigation now, so the page-level title and back button that
  // /explorer/genome-filter carried would be a second, redundant one.
  it('has no page title and no back button', () => {
    render(GenotypesTab);
    expect(screen.queryByRole('heading', { name: 'Genomic Filtering' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument();
  });

  describe('on a BDC configuration, with GENE enabled alone', () => {
    it('opens straight onto the gene-variant panels, with no method chooser', () => {
      render(GenotypesTab);

      expect(geneOption()).not.toBeInTheDocument();
      expect(snpOption()).not.toBeInTheDocument();
      expect(document.getElementById('gene-search')).toBeInTheDocument();
      expect(screen.getByTestId('search-for-gene-with-variant')).toBeInTheDocument();
      expect(screen.getByTestId('select-calculated-consequence')).toBeInTheDocument();
      expect(screen.getByTestId('select-variant-frequency')).toBeInTheDocument();
      expect(screen.getByTestId('summary-of-selected-filters')).toBeInTheDocument();
    });

    // Configuration decides here, so the remembered method must not get a vote - a method
    // left over from somewhere else cannot strand BDC on an interface it has not enabled.
    it('ignores a remembered method that configuration does not allow', () => {
      filterMethod.set(Option.SNP);
      render(GenotypesTab);

      expect(document.getElementById('gene-search')).toBeInTheDocument();
      expect(document.getElementById('snp-search')).not.toBeInTheDocument();
    });
  });

  describe('on an NHANES configuration, with both enabled', () => {
    beforeEach(() => enable(true, true));

    it('shows the chooser and neither interface until a method is picked', () => {
      render(GenotypesTab);

      expect(geneOption()).toBeInTheDocument();
      expect(snpOption()).toBeInTheDocument();
      expect(document.getElementById('gene-search')).not.toBeInTheDocument();
      expect(document.getElementById('snp-search')).not.toBeInTheDocument();
      expect(screen.queryByTestId('add-filter-btn')).not.toBeInTheDocument();
    });

    it.each([
      { label: 'Gene', testid: 'gene-variant-option', revealed: 'gene-search' },
      { label: 'SNP', testid: 'snp-option', revealed: 'snp-search' },
    ])('reveals the $label interface when $label is chosen', async ({ testid, revealed }) => {
      render(GenotypesTab);

      await fireEvent.click(screen.getByTestId(testid));

      expect(document.getElementById(revealed)).toBeInTheDocument();
    });
  });

  describe('the action button', () => {
    it('is disabled, and says why, until a gene is selected', async () => {
      render(GenotypesTab);

      expect(addFilterBtn()).toBeDisabled();
      expect(addFilterBtn()).toHaveAttribute('title', 'A gene is required');

      selectedGenes.set(['IL33']);
      await Promise.resolve();

      expect(addFilterBtn()).toBeEnabled();
      expect(addFilterBtn()).toHaveAttribute('title', 'Add Filter');
    });

    // A frequency or a consequence on its own is not a filter: the gene is the required field.
    it('stays disabled when only a frequency is selected', async () => {
      render(GenotypesTab);

      selectedFrequency.set(['Rare']);
      await Promise.resolve();

      expect(addFilterBtn()).toBeDisabled();
    });

    it('is disabled, and says why, until a variant is saved', async () => {
      enable(false, true);
      render(GenotypesTab);

      expect(addFilterBtn()).toBeDisabled();
      expect(addFilterBtn()).toHaveAttribute('title', 'A SNP is required');

      selectedSNPs.set([{ search: 'chr17,35269878,GT,A', constraint: '0/1' }]);
      await Promise.resolve();

      expect(addFilterBtn()).toBeEnabled();
    });
  });

  describe('adding the filter', () => {
    it('creates it, clears the working state and returns to Phenotypes', async () => {
      selectedGenes.set(['IL33']);
      selectedFrequency.set(['Rare']);
      render(GenotypesTab);

      await fireEvent.click(addFilterBtn());

      expect(addFilter).toHaveBeenCalledOnce();
      expect(vi.mocked(addFilter).mock.calls[0][0]).toMatchObject({
        filterType: 'genomic',
        Gene_with_variant: ['IL33'],
        Variant_frequency_as_text: ['Rare'],
      });
      expect(get(selectedGenes)).toEqual([]);
      expect(get(selectedFrequency)).toEqual([]);
      expect(get(filterMethod)).toBe(Option.None);
      // The filter has to be on screen when the user lands back on Phenotypes.
      expect(get(panelOpen)).toBe(true);
      expect(goto).toHaveBeenCalledWith('/explorer');
    });

    // Otherwise the address bar stops agreeing with the results the user comes back to.
    it('carries the active search back to Phenotypes', async () => {
      searchTerm.set('age at exam');
      selectedGenes.set(['IL33']);
      render(GenotypesTab);

      await fireEvent.click(addFilterBtn());

      expect(goto).toHaveBeenCalledWith('/explorer?search=age%20at%20exam');
    });

    it('creates a variant filter from the saved variants', async () => {
      enable(false, true);
      const snp = { search: 'chr17,35269878,GT,A', constraint: '0/1' };
      selectedSNPs.set([snp]);
      render(GenotypesTab);

      await fireEvent.click(addFilterBtn());

      expect(vi.mocked(addFilter).mock.calls[0][0]).toMatchObject({
        filterType: 'snp',
        snpValues: [snp],
      });
      expect(get(selectedSNPs)).toEqual([]);
    });
  });

  // The whole reason the method is a module-level store: Genotypes is a route, so leaving
  // for Phenotypes unmounts this page.
  describe('leaving the tab mid-edit', () => {
    it('keeps the chosen method and the gene selection across an unmount', async () => {
      enable(true, true);
      const { unmount } = render(GenotypesTab);
      await fireEvent.click(screen.getByTestId('gene-variant-option'));
      selectedGenes.set(['IL33']);

      unmount();
      render(GenotypesTab);

      expect(document.getElementById('gene-search')).toBeInTheDocument();
      expect(screen.getByTestId('summary-of-selected-filters')).toHaveTextContent('IL33');
      expect(addFilterBtn()).toBeEnabled();
    });

    it('keeps the saved variants and the SNP method across an unmount', async () => {
      enable(true, true);
      const { unmount } = render(GenotypesTab);
      await fireEvent.click(screen.getByTestId('snp-option'));
      selectedSNPs.set([{ search: 'chr17,35269878,GT,A', constraint: '0/1' }]);

      unmount();
      render(GenotypesTab);

      expect(document.getElementById('snp-search')).toBeInTheDocument();
      expect(addFilterBtn()).toBeEnabled();
    });
  });
});
