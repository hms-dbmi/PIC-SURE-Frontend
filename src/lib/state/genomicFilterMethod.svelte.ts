import { Option } from '$lib/models/GenomeFilter';

/**
 * Module-level, like `selectedGenes` and `selectedSNPs`: the Genotypes tab is a route, so
 * switching to Phenotypes unmounts it. A method held on the page would die while the
 * selections made under it survived.
 */
class GenomicFilterMethod {
  #current = $state<Option>(Option.None);

  get current(): Option {
    return this.#current;
  }

  set current(option: Option) {
    this.#current = option;
  }
}

export const genomicFilterMethod = new GenomicFilterMethod();
