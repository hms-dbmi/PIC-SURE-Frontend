import { get, writable, type Writable } from 'svelte/store';

import * as api from '$lib/api';
import { Picsure } from '$lib/paths';
import { Genotype, type SNP } from '$lib/models/GenomeFilter';
import { createSnpsFilter, type SnpFilterInterface } from '$lib/models/Filter';
import { getBlankQueryRequest, updateConsentFilters } from '$lib/utilities/QueryBuilder';

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
  try {
    const searchQuery = getBlankQueryRequest();
    searchQuery.query.addCategoryFilter(check.search, [Genotype.Heterozygous, Genotype.Homozygous]);
    searchQuery.query = updateConsentFilters(searchQuery.query);
    const response: number = await api.post(Picsure.QuerySync, searchQuery);
    return response;
  } catch (error) {
    console.error('Error fetching SNP counts:', error);
    throw error;
  }
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
