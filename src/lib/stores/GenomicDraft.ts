import { get, writable, type Writable } from 'svelte/store';

import type { GenomicFilterInterface, SnpFilterInterface } from '$lib/models/Filter.svelte';
import { Option } from '$lib/models/GenomeFilter';
import { genomicFilterMethod } from '$lib/state/genomicFilterMethod.svelte';
import { clearGeneFilters, populateFromGeneFilter } from '$lib/stores/GeneFilter';
import { clearSnpFilters, populateFromSNPFilter } from '$lib/stores/SNPFilter';

/** At most one of each: `addFilter` replaces genomic filters by their fixed id. */
export type AppliedGenomicFilters = {
  gene?: GenomicFilterInterface;
  snp?: SnpFilterInterface;
};

/**
 * The uuid of the applied filter each draft was last loaded from, or `null` for "loaded while
 * none was applied". Arriving at the tab has to show the applied filter; returning mid-edit
 * must not overwrite the selections in progress. The drafts cannot tell those apart
 * themselves - they are module-level, and an empty draft reads like no draft.
 *
 * The panels' Clear buttons deliberately leave this alone: a user who cleared them must not
 * be handed the applied filter again on their way back.
 */
export const draftLoadedFrom: Writable<{ gene: string | null; snp: string | null }> = writable({
  gene: null,
  snp: null,
});

export function loadGenomicDrafts(applied: AppliedGenomicFilters) {
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
}

export function loadDraftForEditing(filter: GenomicFilterInterface | SnpFilterInterface) {
  if (filter.filterType === 'genomic') {
    populateFromGeneFilter(filter);
    draftLoadedFrom.update((from) => ({ ...from, gene: filter.uuid }));
    genomicFilterMethod.current = Option.Genomic;
    return;
  }
  populateFromSNPFilter(filter);
  draftLoadedFrom.update((from) => ({ ...from, snp: filter.uuid }));
  genomicFilterMethod.current = Option.SNP;
}
