import { writable, type Writable } from 'svelte/store';

import { Option } from '$lib/models/GenomeFilter';

/**
 * Which genomic filtering method is being built - gene with variant, a specific variant, or
 * nothing chosen yet.
 *
 * Module-level, like `selectedGenes` and `selectedSNPs`, because the interface that sets it
 * lives on a route: leaving that route unmounts everything holding page-local state. A
 * method held there would die with the page while the selections made under it survived,
 * which is a half-remembered filter - genes still selected, and a method chooser on screen
 * instead of them.
 *
 * `None` only ever shows where both query types are enabled, which is the only case with a
 * choice to hold open. Where configuration allows one method, it decides, and this is not
 * consulted.
 */
export const filterMethod: Writable<Option> = writable(Option.None);
