import { get, writable, type Writable } from 'svelte/store';

import * as api from '$lib/api';
import { resources } from '$lib/configuration';
import { Genotype, type SNP } from '$lib/models/GenomeFilter';
import { createSnpsFilter, type SnpFilterInterface } from '$lib/models/Filter';

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

export async function getSNPCounts(check: SNP) {
  // Search for results with Heterozygous or Homozygous variants. If there are none, then we know that this
  // snp isn't set anywhere and the user doesn't need to include or exclude it.
  const response: number = await api.post('/picsure/query/sync', {
    resourceUUID: resources.hpds,
    query: {
      categoryFilters: { [check.search]: [Genotype.Homozygous, Genotype.Heterozygous] },
      numericFilters: {},
      requiredFields: [],
      anyRecordOf: [],
      variantInfoFilters: [{ categoryVariantInfoFilters: {}, numericVariantInfoFilters: {} }],
      expectedResultType: 'COUNT',
    },
  });
  return response;
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