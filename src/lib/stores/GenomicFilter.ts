import { derived, get, writable, type Readable, type Writable } from 'svelte/store';

import * as api from '$lib/api';
import { resources } from '$lib/configuration';
import { Option, Genotype } from '$lib/models/GemoneFilter';
import { createGenomicFilter, createSnpFilter } from '$lib/models/Filter';
import variantData from '$lib/components/explorer/gemone-filter/variant-data.json';

const severityKeys = variantData.map((sev) => sev.key);

const selectedGenes: Writable<string[]> = writable([]);
const selectedFrequency: Writable<string[]> = writable([]);
const selectedConsequence: Writable<string[]> = writable([]);
const consequences: Readable<string[]> = derived(selectedConsequence, ($c) =>
  $c.filter((cons) => !severityKeys.includes(cons)),
);

const snpSearch: Writable<string> = writable('');
const snpConstraint: Writable<string> = writable('');

function generateFilter(option: Option) {
  let filter;
  if (option === Option.Name) {
    const genes = get(selectedGenes);
    const freq = get(selectedFrequency);
    const cons = get(consequences);
    filter = createGenomicFilter({
      Gene_with_variant: genes.length > 0 ? genes : undefined,
      Variant_consequence_calculated: cons.length > 0 ? cons : undefined,
      Variant_frequency_as_text: freq.length > 0 ? freq : undefined,
    });
  } else {
    filter = createSnpFilter(get(snpSearch), get(snpSearch), get(snpConstraint).split(','));
  }
  return filter;
}

function clearGeneFilters() {
  selectedGenes.set([]);
  selectedFrequency.set([]);
  selectedConsequence.set([]);
}

function clearSnpFilters() {
  snpSearch.set('');
  snpConstraint.set('');
}

async function setSnpWithCounts(search: string) {
  // Search for results with Heterozygous or Homozygous variants. If there are none, then we know that this
  // snp isn't set anywhere and the user doesn't need to include or exclude it.
  const response: number = await api.post('/picsure/query/sync', {
    resourceUUID: resources.hpds,
    query: {
      categoryFilters: { [search]: [Genotype.Homozygous, Genotype.Heterozygous] },
      numericFilters: {},
      requiredFields: [],
      anyRecordOf: [],
      variantInfoFilters: [{ categoryVariantInfoFilters: {}, numericVariantInfoFilters: {} }],
      expectedResultType: 'COUNT',
    },
  });
  if (response > 0) {
    snpSearch.set(search);
  }
  return response;
}

export default {
  selectedGenes,
  selectedFrequency,
  selectedConsequence,
  consequences,
  snpSearch,
  snpConstraint,
  generateFilter,
  clearGeneFilters,
  clearSnpFilters,
  setSnpWithCounts,
};
