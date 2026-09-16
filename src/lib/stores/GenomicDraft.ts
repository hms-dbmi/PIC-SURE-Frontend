import { get, writable, type Writable } from 'svelte/store';

import type { GenomicFilterInterface, SnpFilterInterface } from '$lib/models/Filter.svelte';
import { Option } from '$lib/models/GenomeFilter';
import { clearGeneFilters, populateFromGeneFilter } from '$lib/stores/GeneFilter';
import { filterMethod } from '$lib/stores/GenomicFilterMethod';
import { clearSnpFilters, populateFromSNPFilter } from '$lib/stores/SNPFilter';

/**
 * The genomic filters a cohort has, at most one of each: `addFilter` replaces by id, and the
 * two ids are fixed - `genomic` for gene with variant, `snp-variant` for specific variants.
 */
export type AppliedGenomicFilters = {
  gene?: GenomicFilterInterface;
  snp?: SnpFilterInterface;
};

/**
 * Which applied filter each draft was last loaded from, by uuid - a hash of the filter's
 * contents, so it changes whenever the filter does - or `null` for "loaded while none was
 * applied".
 *
 * This is the only thing that tells a user arriving at the Genotypes tab from one returning
 * to it mid-edit, and the two need opposite treatment: arriving has to show the filter the
 * cohort already has, or the next Add Filter replaces it unseen, while returning has to keep
 * the selections in progress. The drafts cannot answer the question themselves - they are
 * module-level precisely so that switching search modes does not lose them, and a draft that
 * happens to be empty reads exactly like no draft at all.
 *
 * The panels' own Clear buttons empty a draft without touching this, which is deliberate: a
 * user who cleared the panels meant to, and a trip to Phenotypes and back must not hand them
 * the applied filter again. It leaves empty panels under a disabled Update Filter while the
 * filter is still applied, and that is the honest reading of it - the panels are a draft, not
 * a view of the cohort, which is on screen above them the whole time, and the filter's own
 * edit control loads it back whenever it is asked.
 *
 * Exported for tests, which need a tab that has never been opened.
 */
export const draftLoadedFrom: Writable<{ gene: string | null; snp: string | null }> = writable({
  gene: null,
  snp: null,
});

/**
 * Loads the gene and variant drafts from the filters the cohort already has, for a Genotypes
 * tab the user is arriving at. A draft already loaded from the same filter is left alone,
 * because that is a draft in progress.
 *
 * Called on every change to the applied filters, not only on mount, so that removing the
 * filter from its chip while the tab is open empties the panels it was loaded into.
 *
 * `chooseMethod` is for deployments offering both query types. There the method is the user's
 * to pick, except that a single applied filter picks it for them on arrival - it is the only
 * one of the two interfaces with anything to show. Two applied filters make any choice
 * arbitrary, so the chooser stays.
 *
 * Only on arrival, though, which is why this looks at whether a method has been picked at all.
 * Nothing that happens while the tab is open may move the user to another interface: removing
 * one of two applied filters has to leave them watching the panels it emptied and the button
 * going back to Add Filter, not hand them the other method's filter instead.
 */
export function loadGenomicDrafts(applied: AppliedGenomicFilters, chooseMethod = false) {
  const loadedFrom = get(draftLoadedFrom);
  const gene = applied.gene?.uuid ?? null;
  const snp = applied.snp?.uuid ?? null;
  if (loadedFrom.gene === gene && loadedFrom.snp === snp) return;

  if (loadedFrom.gene !== gene) {
    if (applied.gene) populateFromGeneFilter(applied.gene);
    else clearGeneFilters();
  }
  if (loadedFrom.snp !== snp) {
    if (applied.snp) populateFromSNPFilter(applied.snp);
    else clearSnpFilters();
  }
  draftLoadedFrom.set({ gene, snp });

  if (!chooseMethod || get(filterMethod) !== Option.None) return;
  if (applied.gene && !applied.snp) filterMethod.set(Option.Genomic);
  else if (applied.snp && !applied.gene) filterMethod.set(Option.SNP);
}

/**
 * Loads one draft from the filter the user asked to edit, whatever was in progress, and
 * selects the method that filter belongs to.
 *
 * The edit control on a filter chip names a filter, so it has to show that filter: unlike
 * arriving at the tab, which is ambiguous between a new filter and a return mid-edit, this is
 * an explicit request for one. It only replaces the draft of that filter's own method - the
 * other one is a separate set of stores and a separate interface.
 */
export function loadDraftForEditing(filter: GenomicFilterInterface | SnpFilterInterface) {
  if (filter.filterType === 'genomic') {
    populateFromGeneFilter(filter);
    draftLoadedFrom.update((from) => ({ ...from, gene: filter.uuid }));
    filterMethod.set(Option.Genomic);
    return;
  }
  populateFromSNPFilter(filter);
  draftLoadedFrom.update((from) => ({ ...from, snp: filter.uuid }));
  filterMethod.set(Option.SNP);
}
