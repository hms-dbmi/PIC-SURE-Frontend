import { get, writable, type Writable } from 'svelte/store';

import * as api from '$lib/api';
import { Picsure } from '$lib/paths';
import { Genotype, type SNP } from '$lib/models/GenomeFilter';
import { createSnpsFilter, type SnpFilterInterface } from '$lib/models/Filter.svelte';
import type { GenomicFilterInterfacev3, QueryInterfaceV3 } from '$lib/models/query/Query';
import { getBlankQueryRequestV3 } from '$lib/utilities/QueryBuilder';

export const selectedSNPs: Writable<SNP[]> = writable([]);

export function generateSNPFilter() {
  const snps = get(selectedSNPs);
  return createSnpsFilter(snps);
}

export function populateFromSNPFilter(filter: SnpFilterInterface) {
  selectedSNPs.set(filter.snpValues);
}

export function clearSnpFilters() {
  selectedSNPs.set([]);
}

function snpRequest(snp: SNP): Promise<number> {
  const filter: GenomicFilterInterfacev3 = {
    key: snp.search,
    values: [Genotype.Heterozygous, Genotype.Homozygous],
  };
  const searchRequest: QueryInterfaceV3 = getBlankQueryRequestV3(false);
  searchRequest.genomicFilters.push(filter);
  return api.post(Picsure.QueryV3Sync, searchRequest);
}

export async function getSNPCounts(check: SNP): Promise<{ count: number; errors: number }> {
  // Single request: federation's fan-out is gone (ALS-11901), and the bare v3 Query carries no
  // resource UUID — the backend is selected by the path.
  return snpRequest(check)
    .then((count) => ({ count: count || 0, errors: 0 }))
    .catch(() => ({ count: 0, errors: 1 }));
}

export function saveSNP(newSNP: SNP) {
  const snps = get(selectedSNPs);
  const index = snps.findIndex((snp) => snp.search === newSNP.search);
  if (index >= 0) {
    snps[index] = newSNP;
    selectedSNPs.set(snps);
  } else {
    selectedSNPs.set([...snps, newSNP]);
  }
}

export function deleteSNP(trash: SNP) {
  const existingSNPs = get(selectedSNPs);
  const newSNPS = existingSNPs.filter((snp) => snp.search !== trash.search);
  selectedSNPs.set(newSNPS);
}
