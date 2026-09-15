import { get, writable, type Writable } from 'svelte/store';

import * as api from '$lib/api';
import { Picsure } from '$lib/paths';
import { Genotype, type SNP } from '$lib/models/GenomeFilter';
import { createSnpsFilter, type SnpFilterInterface } from '$lib/models/Filter.svelte';
import type { GenomicFilterInterfacev3 } from '$lib/models/query/Query';
import type { QueryRequestInterfaceV3 } from '$lib/models/api/Request';
import { getBlankQueryRequestV3 } from '$lib/utilities/QueryBuilder';

export const selectedSNPs: Writable<SNP[]> = writable([]);

/**
 * Bumped whenever something outside the variant panel replaces the whole variant selection -
 * loading an applied filter into it, or clearing it.
 *
 * The panel keeps the variant being constrained in component-local state, which nothing
 * outside it can see, so it has to be told when the selection behind it is replaced. This is
 * the same arrangement as `geneDraftRevision`, for the same reason: state that is read once
 * and then owned locally cannot notice being overtaken.
 */
export const snpDraftRevision: Writable<number> = writable(0);

/** A copy of the variants, owing nothing to whoever held them. See `populateFromSNPFilter`. */
const copyOf = (snps: SNP[]) => snps.map((snp) => ({ ...snp }));

export function generateSNPFilter() {
  // Copied on the way out as well as on the way in, so the filter this becomes owns its
  // variants and the panels cannot reach into it afterwards.
  return createSnpsFilter(copyOf(get(selectedSNPs)));
}

export function populateFromSNPFilter(filter: SnpFilterInterface) {
  // Copied, not assigned. The array this arrives in belongs to the applied filter, and a
  // draft holding that same array edits the cohort's filter in place: without a store write,
  // without recomputing the uuid that its description and the Genotypes tab's "already loaded
  // from" marker both key on, and whether or not the user ever pressed Update Filter. The
  // query would then use the edit while every copy of the filter still described the original.
  selectedSNPs.set(copyOf(filter.snpValues || []));
  snpDraftRevision.update((revision) => revision + 1);
}

export function clearSnpFilters() {
  selectedSNPs.set([]);
  snpDraftRevision.update((revision) => revision + 1);
}

function snpRequest(snp: SNP): Promise<number> {
  const filter: GenomicFilterInterfacev3 = {
    key: snp.search,
    values: [Genotype.Heterozygous, Genotype.Homozygous],
  };
  const searchRequest: QueryRequestInterfaceV3 = getBlankQueryRequestV3();
  searchRequest.query.genomicFilters.push(filter);
  return api.post(Picsure.QueryV3Sync, searchRequest);
}

export async function getSNPCounts(check: SNP): Promise<{ count: number; errors: number }> {
  return snpRequest(check)
    .then((count) => ({ count: count || 0, errors: 0 }))
    .catch(() => ({ count: 0, errors: 1 }));
}

export function saveSNP(newSNP: SNP) {
  const snps = get(selectedSNPs);
  // Replaced into a new array rather than written into the existing one. An in-place write is
  // invisible to everything that holds the array - which has included the applied filter -
  // and a store whose subscribers cannot see a change may as well not have changed.
  if (snps.some((snp) => snp.search === newSNP.search)) {
    selectedSNPs.set(snps.map((snp) => (snp.search === newSNP.search ? newSNP : snp)));
  } else {
    selectedSNPs.set([...snps, newSNP]);
  }
}

export function deleteSNP(trash: SNP) {
  const existingSNPs = get(selectedSNPs);
  const newSNPS = existingSNPs.filter((snp) => snp.search !== trash.search);
  selectedSNPs.set(newSNPS);
}
