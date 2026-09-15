// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
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

vi.mock('$lib/stores/Filter', async () => {
  const { writable } = await import('svelte/store');
  return { addFilter: vi.fn(), genomicFilters: writable([]) };
});

vi.mock('$lib/stores/Search', async () => {
  const { writable } = await import('svelte/store');
  return { searchTerm: writable('') };
});

vi.mock('$lib/stores/ResultsSummaryPanel', async () => {
  const { writable } = await import('svelte/store');
  return { panelOpen: writable(false) };
});

import GenotypesTab from '../../src/routes/(picsure)/(public)/explorer/genotypes/+page.svelte';
import { goto } from '$app/navigation';
import { createGenomicFilter, createSnpsFilter, type Filter } from '$lib/models/Filter.svelte';
import { Option } from '$lib/models/GenomeFilter';
import { addFilter, genomicFilters } from '$lib/stores/Filter';
import { clearGeneFilters, selectedFrequency, selectedGenes } from '$lib/stores/GeneFilter';
import { draftLoadedFrom, loadDraftForEditing } from '$lib/stores/GenomicDraft';
import { filterMethod } from '$lib/stores/GenomicFilterMethod';
import { searchTerm } from '$lib/stores/Search';
import { panelOpen } from '$lib/stores/ResultsSummaryPanel';
import { clearSnpFilters, selectedSNPs } from '$lib/stores/SNPFilter';

/** Both flags on is NHANES; GENE alone is BDC. Neither is unreachable - the load redirects. */
function enable(gene: boolean, snp: boolean) {
  mockState.features = { enableGENEQuery: gene, enableSNPQuery: snp };
}

const geneOption = () => screen.queryByTestId('gene-variant-option');
const snpOption = () => screen.queryByTestId('snp-option');
const addFilterBtn = () => screen.getByTestId('add-filter-btn');
const summary = () => screen.getByTestId('summary-of-selected-filters');
/** The checkbox for a gene in the selected box, which unselects it when clicked. */
const selectedOption = (option: string) => {
  const box = document.querySelector<HTMLElement>(
    `#selected-options-container #option-${option.toLowerCase()} input`,
  );
  if (!box) throw new Error(`${option} is not in the selected box`);
  return box;
};
const consequenceBox = (severity: string, consequence: string) =>
  screen.queryByTestId(`checkbox:${severity}-${consequence}`);

const snp = { search: 'chr17,35269878,GT,A', constraint: '0/1' };

/**
 * What the real `addFilter` does with a genomic filter: replace the one with the same id, of
 * which there is at most one, or add it. Both genomic ids are fixed strings, which is why
 * Add and Update are the same call - and why a tab that showed none of the applied filter
 * could overwrite it unseen.
 */
function applyFilter(filter: Filter) {
  genomicFilters.update((applied) => [...applied.filter((f) => f.id !== filter.id), filter]);
}

/** The gene filter used as "already applied": a gene, a frequency and one consequence. */
function appliedGeneFilter() {
  return createGenomicFilter({
    Gene_with_variant: ['IL33'],
    Variant_frequency_as_text: ['Rare'],
    Variant_consequence_calculated: ['stop_lost'],
  });
}

describe('the Genotypes tab', () => {
  beforeEach(() => {
    enable(true, false);
    clearGeneFilters();
    clearSnpFilters();
    filterMethod.set(Option.None);
    searchTerm.set('');
    panelOpen.set(false);
    genomicFilters.set([]);
    // A tab that has never been opened: nothing has been loaded into the panels yet.
    draftLoadedFrom.set({ gene: null, snp: null });
    vi.mocked(goto).mockClear();
    vi.mocked(addFilter).mockClear();
    vi.mocked(addFilter).mockImplementation(applyFilter);
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
    it('creates it and returns to Phenotypes, with the panels still holding it', async () => {
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
      // Not cleared: the draft has become the filter, and the tab shows the applied filter,
      // so coming back to it has to find the panels holding what the cohort holds.
      expect(get(selectedGenes)).toEqual(['IL33']);
      expect(get(selectedFrequency)).toEqual(['Rare']);
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
      selectedSNPs.set([snp]);
      render(GenotypesTab);

      await fireEvent.click(addFilterBtn());

      expect(vi.mocked(addFilter).mock.calls[0][0]).toMatchObject({
        filterType: 'snp',
        snpValues: [snp],
      });
      expect(get(selectedSNPs)).toEqual([snp]);
    });
  });

  // There is only ever one filter of each method, so the tab has no separate edit mode: it
  // shows what the cohort holds. Ticket 06 opened it empty over a saved filter, and
  // `addFilter` replaces by id, so the next Add Filter overwrote that filter wholesale - the
  // frequency and consequences the user had chosen gone, with nothing on screen saying so.
  describe('arriving with a filter already applied', () => {
    it('loads all three gene panels from it, and offers Update Filter', () => {
      genomicFilters.set([appliedGeneFilter()]);

      render(GenotypesTab);

      expect(summary()).toHaveTextContent('IL33');
      expect(screen.getByLabelText('Rare')).toBeChecked();
      // Rendered at all only because its severity group opened around it, which is how the
      // tree announces a selection it was built from.
      expect(consequenceBox('High Severity', 'stop_lost')).toBeChecked();
      expect(addFilterBtn()).toHaveTextContent('Update Filter');
      expect(addFilterBtn()).toHaveAttribute('title', 'Update Filter');
      expect(addFilterBtn()).toBeEnabled();
    });

    // The gene panel takes its list of options from the page of the values endpoint it loads
    // plus whatever the draft holds as it mounts, so that a gene which came from the applied
    // filter - and which the endpoint's first page need not contain - can be unselected and
    // put back. It reads the draft once, while mounting, which is why the tab loads the drafts
    // as it initialises and not from an effect.
    it('offers a gene loaded from the filter back once the user unselects it', async () => {
      genomicFilters.set([appliedGeneFilter()]);
      render(GenotypesTab);
      await tick();

      selectedGenes.set([]);
      await tick();

      expect(document.getElementById('options-container')).toHaveTextContent('IL33');
    });

    // The same mount-time snapshot problem as the variant editor, in the gene panel: it takes
    // the genes it will offer back from the draft as it mounts. Loading a filter into a tab
    // already on screen - which is what the chip's edit control does - happens after that.
    it('offers a gene loaded by the chip edit control back once unselected', async () => {
      const applied = appliedGeneFilter();
      genomicFilters.set([applied]);
      // Already loaded once and taken elsewhere, so mounting loads nothing
      draftLoadedFrom.set({ gene: applied.uuid, snp: null });
      selectedGenes.set(['CHD8']);
      render(GenotypesTab);
      await tick();

      loadDraftForEditing(applied);
      await tick();
      // The user unselects the gene it just loaded
      selectedGenes.set([]);
      await tick();

      expect(document.getElementById('options-container')).toHaveTextContent('IL33');
    });

    it('loads the variant panel from an applied SNP filter, and picks that method', () => {
      enable(true, true);
      genomicFilters.set([createSnpsFilter([snp])]);

      render(GenotypesTab);

      // The chooser has nothing to ask: only one of the two interfaces has anything to show.
      expect(document.getElementById('snp-search')).toBeInTheDocument();
      expect(summary()).toHaveTextContent(snp.search);
      expect(addFilterBtn()).toHaveTextContent('Update Filter');
    });

    // The other half of the requirement, and the reason the applied filter cannot simply be
    // loaded on every mount: every trip to Phenotypes and back is a mount.
    it('leaves a draft in progress alone', async () => {
      genomicFilters.set([appliedGeneFilter()]);
      const { unmount } = render(GenotypesTab);
      selectedGenes.set(['CHD8']);
      selectedFrequency.set(['Common']);
      await tick();

      unmount();
      render(GenotypesTab);

      expect(get(selectedGenes)).toEqual(['CHD8']);
      expect(summary()).toHaveTextContent('CHD8');
      expect(summary()).not.toHaveTextContent('IL33');
      expect(screen.getByLabelText('Common')).toBeChecked();
      expect(screen.getByLabelText('Rare')).not.toBeChecked();
    });

    it('empties the panels and offers Add Filter again when the filter is removed', async () => {
      genomicFilters.set([appliedGeneFilter()]);
      render(GenotypesTab);

      // What the remove control on the filter's chip does, from the cohort panel above.
      genomicFilters.set([]);
      await tick();

      expect(summary()).not.toHaveTextContent('IL33');
      expect(screen.getByLabelText('Rare')).not.toBeChecked();
      // Closed again, and holding nothing: an open group with a checked child would still be
      // showing the selection the panels are supposed to have let go of.
      expect(consequenceBox('High Severity', 'stop_lost')).not.toBeInTheDocument();
      expect(consequenceBox('severity', 'High Severity')).not.toBePartiallyChecked();
      expect(addFilterBtn()).toHaveTextContent('Add Filter');
      expect(addFilterBtn()).toBeDisabled();
    });

    it('opens empty when no filter is applied', () => {
      render(GenotypesTab);

      expect(summary()).toHaveTextContent('None');
      expect(screen.getByLabelText('Rare')).not.toBeChecked();
      expect(addFilterBtn()).toHaveTextContent('Add Filter');
      expect(addFilterBtn()).toBeDisabled();
    });
  });

  // A draft loaded from an applied filter must not share an array with it: anything the panels
  // then wrote in place would rewrite the cohort's filter invisibly. The variant half of this
  // is in tests/unit/GenomicDraft.test.ts, where the edit can be made without depending on a
  // select binding to carry it.
  describe('the applied filter as an object', () => {
    it('is untouched by editing the genes and frequencies loaded from it', async () => {
      const applied = appliedGeneFilter();
      const appliedUuid = applied.uuid;
      genomicFilters.set([applied]);
      render(GenotypesTab);

      await fireEvent.click(screen.getByLabelText('Common'));
      await fireEvent.click(selectedOption('IL33'));
      await tick();

      expect(get(selectedFrequency)).toEqual(['Rare', 'Common']);
      expect(applied.Gene_with_variant).toEqual(['IL33']);
      expect(applied.Variant_frequency_as_text).toEqual(['Rare']);
      expect(applied.Variant_consequence_calculated).toEqual(['stop_lost']);
      expect(applied.uuid).toBe(appliedUuid);
    });
  });

  // The editor holds the variant being constrained in component-local state, where nothing
  // outside it can see or reset it - the same shape of problem as the consequence tree, and
  // it needs the same answer. The chip's edit control is the case that finds it: its target
  // is the route the user is already on, so nothing remounts.
  describe('the variant editor', () => {
    it('drops an unsaved variant when the chip reloads the filter', async () => {
      enable(false, true);
      const applied = createSnpsFilter([snp]);
      genomicFilters.set([applied]);
      render(GenotypesTab);

      // The applied variant put back in the editor, not saved: the search box is taken over
      // by it, and the genotype select and Save SNP are the editor itself
      await fireEvent.click(screen.getByTestId(`snp-edit-btn-${snp.search}`));
      expect(screen.getByTestId('snp-search-box')).toBeDisabled();
      expect(screen.getByTestId('snp-constraint')).toBeInTheDocument();

      // When the chip's edit control asks for this filter, from the tab it already leads to
      loadDraftForEditing(applied);
      await tick();

      // Then there is nothing left to save the unsaved variant into the draft with
      expect(screen.queryByTestId('snp-constraint')).not.toBeInTheDocument();
      expect(screen.queryByTestId('snp-save-btn')).not.toBeInTheDocument();
      expect(screen.getByTestId('snp-search-box')).toHaveValue('');
      expect(get(selectedSNPs)).toEqual([snp]);
    });
  });

  // Where both methods have a filter, the tab has two filters and one interface to show them
  // in, so it picks neither: any choice would be arbitrary. Both drafts still load, so
  // whichever the user picks opens onto its own filter.
  describe('with a filter applied to both methods', () => {
    beforeEach(() => enable(true, true));

    it('leaves the method to the user, and loads both drafts', () => {
      genomicFilters.set([appliedGeneFilter(), createSnpsFilter([snp])]);

      render(GenotypesTab);

      expect(geneOption()).toBeInTheDocument();
      expect(snpOption()).toBeInTheDocument();
      expect(get(filterMethod)).toBe(Option.None);
      expect(get(selectedGenes)).toEqual(['IL33']);
      expect(get(selectedSNPs)).toEqual([snp]);
    });

    // Removing one of the two must not move the user off the interface they are on: they are
    // owed the sight of the panels emptying and the button going back to Add Filter, not a
    // different method's filter appearing in front of them.
    it('leaves the user on the interface a removed filter has emptied', async () => {
      genomicFilters.set([appliedGeneFilter(), createSnpsFilter([snp])]);
      render(GenotypesTab);
      await fireEvent.click(geneOption()!);
      expect(document.getElementById('gene-search')).toBeInTheDocument();

      // What the remove control on the gene filter's chip does, from the panel above
      genomicFilters.set([createSnpsFilter([snp])]);
      await tick();

      expect(get(filterMethod)).toBe(Option.Genomic);
      expect(document.getElementById('gene-search')).toBeInTheDocument();
      expect(document.getElementById('snp-search')).not.toBeInTheDocument();
      expect(summary()).not.toHaveTextContent('IL33');
      expect(addFilterBtn()).toHaveTextContent('Add Filter');
      expect(addFilterBtn()).toBeDisabled();
      // And the variant draft it was not asked about is still there
      expect(get(selectedSNPs)).toEqual([snp]);
    });

    // The edit control names one filter, so it replaces one draft. The other method's draft
    // is a separate interface the user has not asked about.
    it('keeps the other draft when one filter is opened from its chip', async () => {
      const appliedGene = appliedGeneFilter();
      genomicFilters.set([appliedGene, createSnpsFilter([snp])]);
      render(GenotypesTab);

      // Both drafts taken somewhere else
      const draftSnp = { search: 'chr1,1234567,A,G', constraint: '1/1' };
      selectedGenes.set(['CHD8']);
      selectedSNPs.set([draftSnp]);
      await tick();

      loadDraftForEditing(appliedGene);

      expect(get(filterMethod)).toBe(Option.Genomic);
      expect(get(selectedGenes)).toEqual(['IL33']);
      expect(get(selectedSNPs)).toEqual([draftSnp]);
    });
  });

  describe('updating the applied filter', () => {
    it('replaces it in place, keeping the parts the user did not change', async () => {
      genomicFilters.set([appliedGeneFilter()]);
      render(GenotypesTab);

      // A different gene, with the frequency and the consequence left as they were found.
      selectedGenes.set(['CHD8']);
      await tick();
      await fireEvent.click(addFilterBtn());

      expect(vi.mocked(addFilter).mock.calls[0][0]).toMatchObject({
        filterType: 'genomic',
        Gene_with_variant: ['CHD8'],
        Variant_frequency_as_text: ['Rare'],
        Variant_consequence_calculated: ['stop_lost'],
      });
      expect(get(genomicFilters)).toHaveLength(1);
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
