import { derived, get, writable, type Readable, type Writable } from 'svelte/store';

import { createGenomicFilter, type GenomicFilterInterface } from '$lib/models/Filter.svelte';
import variantData from '$lib/components/explorer/genome-filter/variant-data.json';

const severityKeys = variantData.map((sev) => sev.key);

export const selectedGenes: Writable<string[]> = writable([]);
export const selectedFrequency: Writable<string[]> = writable([]);
export const selectedConsequence: Writable<string[]> = writable([]);

/**
 * Bumped whenever something outside the gene panels replaces the whole selection above -
 * loading an applied filter into it, or clearing it.
 *
 * Two of those panels read the selection once, as they are built, and own what they made of
 * it afterwards: the consequence tree's checkboxes, and the list of genes the gene panel will
 * offer back if the user unselects one. Neither can notice being overtaken, and neither can
 * simply follow every change instead - rebuilding the tree on each click would throw away
 * which severity groups the user had open. So the two functions that do replace the selection
 * wholesale say so, and those panels rebuild on that alone.
 */
export const geneDraftRevision: Writable<number> = writable(0);

export const consequences: Readable<string[]> = derived(selectedConsequence, ($c) =>
  $c.filter((cons) => !severityKeys.includes(cons)),
);

/**
 * The gene options the list has loaded: the page of the values endpoint the infinite scroll
 * has reached, and the search those options answer to.
 *
 * Module-level, like the selections above, because the gene panel is on a route - the
 * Genotypes search mode - so moving to another mode unmounts it. Held on the component this
 * refetched page one on every return, threw away however far the user had scrolled, and
 * raised another failure toast each time when the values endpoint was unhealthy.
 *
 * `search` travels with the options because the two have to agree: restoring a searched list
 * under an empty search box shows a filtered list claiming to be the whole one.
 */
export type GeneOptions = {
  options: string[];
  search: string;
  /** The last page number the endpoint returned, which the next scroll continues from. */
  page: number;
  totalPages: number;
  /** Set once a page comes back short, meaning there is nothing left to scroll for. */
  allLoaded: boolean;
  /** False until the first load returns - what tells a remount from a first mount. */
  loaded: boolean;
};

export const emptyGeneOptions = (): GeneOptions => ({
  options: [],
  search: '',
  page: 0,
  totalPages: 1,
  allLoaded: false,
  loaded: false,
});

export const geneOptions: Writable<GeneOptions> = writable(emptyGeneOptions());

export function generateGenomicFilter() {
  // Copied on the way out, so the filter this becomes owns its values and the panels cannot
  // reach into it afterwards. All three, including the derived one: a derived caches, so two
  // filters generated with no selection change between them would otherwise be handed the
  // same array.
  const genes = [...get(selectedGenes)];
  const freq = [...get(selectedFrequency)];
  const cons = [...get(consequences)];
  return createGenomicFilter({
    Gene_with_variant: genes.length > 0 ? genes : undefined,
    Variant_consequence_calculated: cons.length > 0 ? cons : undefined,
    Variant_frequency_as_text: freq.length > 0 ? freq : undefined,
  });
}

export function populateFromGeneFilter(filter: GenomicFilterInterface) {
  // Copied, not assigned: these arrays belong to the applied filter, and a draft that shares
  // them would edit the cohort's filter in place - no store write, no new uuid, and no way for
  // anything holding the filter to notice. Nothing in these panels writes into an array today,
  // but it is the sharing that would make such a write invisible, so it stops here.
  selectedGenes.set([...(filter?.Gene_with_variant || [])]);
  selectedConsequence.set([...(filter?.Variant_consequence_calculated || [])]);
  selectedFrequency.set([...(filter?.Variant_frequency_as_text || [])]);
  geneDraftRevision.update((revision) => revision + 1);
}

export function clearGeneFilters() {
  selectedGenes.set([]);
  selectedFrequency.set([]);
  selectedConsequence.set([]);
  geneDraftRevision.update((revision) => revision + 1);
}

export function addConsquence(consequence: string) {
  selectedConsequence.set([...get(selectedConsequence), consequence]);
}

export function removeConsequence(consequence: string) {
  const filtered = get(selectedConsequence).filter((cons) => cons !== consequence);
  selectedConsequence.set(filtered);
}
