import { get, writable, type Writable } from 'svelte/store';

import { runSyncQuery } from '#lib/api/picsure/query.ts';
import { Genotype, type SNP } from '#lib/query/genomic.ts';
import { createSnpsFilter, type SnpFilterInterface } from '#lib/query/filter.svelte.ts';
import type { GenomicFilterInterfacev3 } from '#lib/query/query.ts';
import type { QueryRequestInterfaceV3 } from '#lib/api/picsure/query.types.ts';
import { getBlankQueryRequestV3 } from '#lib/query/build.ts';

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

async function snpRequest(snp: SNP): Promise<number> {
  const filter: GenomicFilterInterfacev3 = {
    key: snp.search,
    values: [Genotype.Heterozygous, Genotype.Homozygous],
  };
  const searchRequest: QueryRequestInterfaceV3 = getBlankQueryRequestV3();
  searchRequest.query.genomicFilters.push(filter);
  const count = await runSyncQuery(searchRequest);
  if (typeof count !== 'number') throw new Error('Invalid SNP count response');
  return count;
}

export async function getSNPCounts(check: SNP): Promise<{ count: number; errors: number }> {
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
