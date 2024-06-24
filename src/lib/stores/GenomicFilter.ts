import { derived, get, writable, type Readable, type Writable } from 'svelte/store';

import * as api from '$lib/api';
import { resources } from '$lib/configuration';
import { Option, Genotype } from '$lib/models/GemoneFilter';
import { createGenomicFilter, createSnpFilter, type Filter } from '$lib/models/Filter';
import variantData from '$lib/components/explorer/gemone-filter/variant-data.json';

const severityKeys = variantData.map((sev) => sev.key);

const selectedOption: Writable<Option> = writable(Option.None);
const selectedGenes: Writable<string[]> = writable([]);
const selectedFrequency: Writable<string[]> = writable([]);
const selectedConsequence: Writable<string[]> = writable([]);
const consequences: Readable<string[]> = derived(selectedConsequence, ($c) =>
  $c.filter((cons) => !severityKeys.includes(cons)),
);
const snpSearch: Writable<string> = writable('');
const snpConstraint: Writable<string> = writable('');

function generateFilter() {
  const option = get(selectedOption);
  let filter: Filter;
  if (option === Option.Genomic) {
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

function populateFromFilter(filter: Filter) {
  if (filter.filterType === 'genomic') {
    selectedOption.set(Option.Genomic);
    selectedGenes.set(filter?.Gene_with_variant || []);
    selectedConsequence.set(filter?.Variant_consequence_calculated || []);
    selectedFrequency.set(filter?.Variant_frequency_as_text || []);
  } else if (filter.filterType === 'snp') {
    selectedOption.set(Option.SNP);
    snpSearch.set(filter.id);
    snpConstraint.set(filter.categoryValues.join(','));
  }
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

function clearFilters() {
  clearGeneFilters();
  clearSnpFilters();
  selectedOption.set(Option.None);
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
  selectedOption,
  selectedGenes,
  selectedFrequency,
  selectedConsequence,
  consequences,
  snpSearch,
  snpConstraint,
  generateFilter,
  populateFromFilter,
  clearGeneFilters,
  clearSnpFilters,
  clearFilters,
  setSnpWithCounts,
};
