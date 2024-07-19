import { derived, get, writable, type Readable, type Writable } from 'svelte/store';

import { createGenomicFilter, type GenomicFilterInterface } from '$lib/models/Filter';
import variantData from '$lib/components/explorer/gemone-filter/variant-data.json';

const severityKeys = variantData.map((sev) => sev.key);

export const selectedGenes: Writable<string[]> = writable([]);
export const selectedFrequency: Writable<string[]> = writable([]);
export const selectedConsequence: Writable<string[]> = writable([]);
export const consequences: Readable<string[]> = derived(selectedConsequence, ($c) =>
  $c.filter((cons) => !severityKeys.includes(cons)),
);

export function generateGenomicFilter() {
  const genes = get(selectedGenes);
  const freq = get(selectedFrequency);
  const cons = get(consequences);
  return createGenomicFilter({
    Gene_with_variant: genes.length > 0 ? genes : undefined,
    Variant_consequence_calculated: cons.length > 0 ? cons : undefined,
    Variant_frequency_as_text: freq.length > 0 ? freq : undefined,
  });
}

export function populateFromGeneFilter(filter: GenomicFilterInterface) {
  selectedGenes.set(filter?.Gene_with_variant || []);
  selectedConsequence.set(filter?.Variant_consequence_calculated || []);
  selectedFrequency.set(filter?.Variant_frequency_as_text || []);
}

export function clearGeneFilters() {
  selectedGenes.set([]);
  selectedFrequency.set([]);
  selectedConsequence.set([]);
}
