import { writable, type Writable } from 'svelte/store';

import { Option } from '$lib/models/GenomeFilter';

/**
 * Which genomic filtering method the Genotypes tab is working in - gene with variant, a
 * specific variant, or nothing chosen yet.
 *
 * Module-level, the way the search stores are, because Genotypes is a route: switching to
 * Phenotypes unmounts the page. Held on the page, the method would die with it, and coming
 * back would drop the user out of the interface they were half way through - genes still
 * selected in `selectedGenes`, but a method chooser on screen instead of them. Those
 * selections already survive navigation; this was the one part of the working state that
 * did not.
 *
 * Only meaningful where both query types are enabled, which is the only case the chooser
 * renders in. A deployment with one of them has no choice to remember: the tab derives the
 * method from configuration and ignores this.
 */
export const filterMethod: Writable<Option> = writable(Option.None);
