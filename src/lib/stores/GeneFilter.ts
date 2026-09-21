import { derived, get, writable, type Readable, type Writable } from 'svelte/store';

import { createGenomicFilter, type GenomicFilterInterface } from '$lib/models/Filter.svelte';
import variantData from '$lib/components/explorer/genome-filter/variant-data.json';

const severityKeys = variantData.map((sev) => sev.key);

export const selectedGenes: Writable<string[]> = writable([]);
export const selectedFrequency: Writable<string[]> = writable([]);
export const selectedConsequence: Writable<string[]> = writable([]);

/**
 * Bumped when the whole consequence selection is replaced from outside the consequence panel.
 * The panel builds its checkbox tree from the selection once and owns it afterwards -
 * rebuilding on every change would lose which severity groups the user had open.
 */
export const consequenceRevision: Writable<number> = writable(0);

export const consequences: Readable<string[]> = derived(selectedConsequence, ($c) =>
  $c.filter((cons) => !severityKeys.includes(cons)),
);

export function generateGenomicFilter() {
  const genes = [...get(selectedGenes)];
  const freq = [...get(selectedFrequency)];
  const cons = get(consequences);
  return createGenomicFilter({
    Gene_with_variant: genes.length > 0 ? genes : undefined,
    Variant_consequence_calculated: cons.length > 0 ? cons : undefined,
    Variant_frequency_as_text: freq.length > 0 ? freq : undefined,
  });
}

export function populateFromGeneFilter(filter: GenomicFilterInterface) {
  // Copy, do not alias: the applied filter's uuid is a hash of its contents, so a shared
  // array lets a draft edit the cohort's filter without recomputing its identity.
  selectedGenes.set([...(filter?.Gene_with_variant || [])]);
  selectedConsequence.set([...(filter?.Variant_consequence_calculated || [])]);
  selectedFrequency.set([...(filter?.Variant_frequency_as_text || [])]);
  consequenceRevision.update((revision) => revision + 1);
}

export function clearGeneFilters() {
  selectedGenes.set([]);
  selectedFrequency.set([]);
  selectedConsequence.set([]);
  consequenceRevision.update((revision) => revision + 1);
}

export function addConsquence(consequence: string) {
  selectedConsequence.set([...get(selectedConsequence), consequence]);
}

export function removeConsequence(consequence: string) {
  const filtered = get(selectedConsequence).filter((cons) => cons !== consequence);
  selectedConsequence.set(filtered);
}
