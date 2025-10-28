import { get, writable, type Writable } from 'svelte/store';

import * as api from '$lib/api';
import { Picsure } from '$lib/paths';
import { Genotype, type SNP } from '$lib/models/GenomeFilter';
import { createSnpsFilter, type SnpFilterInterface } from '$lib/models/Filter';
import {
  loading as resourcesPromise,
  loadResources,
  getQueryResources,
} from '$lib/stores/Resources';
import type { QueryV2 } from '$lib/models/query/Query';
import { getBlankQueryRequestV2, updateConsentFilters } from '$lib/utilities/QueryBuilder';

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
  const searchQuery = getBlankQueryRequestV2(false, resource);
  const query = searchQuery.query as QueryV2;
  query.addCategoryFilter(snp.search, [Genotype.Heterozygous, Genotype.Homozygous]);
  searchQuery.query = updateConsentFilters(query);
  return api.post(Picsure.QueryV2Sync, searchQuery);
}

export async function getSNPCounts(check: SNP): Promise<{ count: number; errors: number }> {
  loadResources();
  await get(resourcesPromise);
  const resources = getQueryResources();
  const responses: Promise<number>[] = resources.map(({ uuid }) => snpRequest(check, uuid));
  return Promise.allSettled(responses)
    .then((results) => ({
      count: results
        .filter((result) => result.status === 'fulfilled')
        .map((result) => result.value || 0)
        .reduce((sum, value) => sum + value, 0),
      errors: results.filter((result) => result.status !== 'fulfilled').length,
    }))
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
