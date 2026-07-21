import { get, writable, type Writable } from 'svelte/store';

import * as api from '$lib/api';
import { Picsure } from '$lib/paths';
import { Genotype, type SNP } from '$lib/models/GenomeFilter';
import { createSnpsFilter, type SnpFilterInterface } from '$lib/models/Filter.svelte';
import { getCountResource } from '$lib/stores/Resources';
import type { GenomicFilterInterfacev3 } from '$lib/models/query/Query';
import type { QueryRequestInterfaceV3 } from '$lib/models/api/Request';
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

function snpRequest(snp: SNP, resource: string): Promise<number> {
  const filter: GenomicFilterInterfacev3 = {
    key: snp.search,
    values: [Genotype.Heterozygous, Genotype.Homozygous],
  };
  const searchRequest: QueryRequestInterfaceV3 = getBlankQueryRequestV3(false, resource);
  searchRequest.query.genomicFilters.push(filter);
  return api.post(Picsure.QueryV3Sync, searchRequest);
}

export async function getSNPCounts(check: SNP): Promise<{ count: number; errors: number }> {
  return snpRequest(check, getCountResource().uuid)
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
