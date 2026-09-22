import { get, writable, type Writable } from 'svelte/store';

import * as api from '$lib/api';
import { Picsure } from '$lib/paths';
import { Genotype, type SNP } from '$lib/models/GenomeFilter';
import { createSnpsFilter, type SnpFilterInterface } from '$lib/models/Filter.svelte';
import type { GenomicFilterInterfacev3 } from '$lib/models/query/Query';
import type { QueryRequestInterfaceV3 } from '$lib/models/api/Request';
import { getBlankQueryRequestV3 } from '$lib/utilities/QueryBuilder';

export const selectedSNPs: Writable<SNP[]> = writable([]);

const blankSNP = (): SNP => ({ search: '', constraint: '' });

// The variant found by the search box and not yet saved. Held here rather than in
// SNPSearch.svelte so a trip to Phenotypes and back does not lose it.
export const pendingSNP: Writable<SNP> = writable(blankSNP());

const copyOf = (snps: SNP[]) => snps.map((snp) => ({ ...snp }));

export function generateSNPFilter() {
  return createSnpsFilter(copyOf(get(selectedSNPs)));
}

export function populateFromSNPFilter(filter: SnpFilterInterface) {
  // Copy, do not alias: the applied filter's uuid is a hash of its contents, so a shared
  // array lets a draft edit the cohort's filter without recomputing its identity.
  selectedSNPs.set(copyOf(filter.snpValues || []));
  pendingSNP.set(blankSNP());
}

export function clearSnpFilters() {
  selectedSNPs.set([]);
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
