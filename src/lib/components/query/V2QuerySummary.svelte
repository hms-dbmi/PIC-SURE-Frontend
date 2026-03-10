<script lang="ts">
  import { QueryV2 } from '$lib/models/query/Query';
  import {
    type Filter,
    createCategoricalFilter,
    createNumericFilter,
    createGenomicFilter,
  } from '$lib/models/Filter';
  import type { SearchResult } from '$lib/models/Search';
  import { getConceptDetails } from '$lib/stores/Dictionary';
  import { QueryVersion } from '$lib/models/Dataset';

  import FiltersSummary from '$lib/components/query/FiltersSummary.svelte';
  import SelectedVariablesSummary from '$lib/components/query/SelectedVariablesSummary.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import Loading from '$lib/components/Loading.svelte';

  let { query }: { query: QueryV2 } = $props();

  const allFields = $derived(
    [
      ...(query?.fields || []),
      ...(query?.requiredFields || []),
      ...(query?.anyRecordOf || []),
      ...(query?.anyRecordOfMulti?.flat() || []),
      ...(query?.crossCountFields || []),
    ].filter((v, i, arr) => arr.indexOf(v) === i),
  );

  async function pathToSearchResult(
    path: string,
    type: SearchResult['type'] = 'Categorical',
  ): Promise<SearchResult> {
    const dataset = path.split('\\').filter(Boolean)[0] || path;
    const raw = await getConceptDetails(path, dataset).catch((err) => {
      console.error(err);
      return {} as SearchResult;
    });
    return {
      conceptPath: path,
      dataset,
      name: raw?.name || '',
      display: raw?.display || '',
      studyAcronym: raw?.studyAcronym || '',
      description: raw?.description || '',
      allowFiltering: raw?.allowFiltering || false,
      type,
    };
  }

  let filters: Filter[] = $state([]);
  let genomicFilters: Filter[] = $state([]);

  async function loadFilters() {
    const filterList: Filter[] = [];

    for (const [path, values] of Object.entries(
      query.categoryFilters as Record<string, string[]>,
    )) {
      const result = await pathToSearchResult(path);
      filterList.push(createCategoricalFilter(result, values));
    }

    for (const [path, range] of Object.entries(
      query.numericFilters as Record<string, { min?: string; max?: string }>,
    )) {
      const result = await pathToSearchResult(path, 'Continuous');
      filterList.push(createNumericFilter(result, range.min, range.max));
    }

    filters = filterList;

    const category = query.variantInfoFilters?.[0]?.categoryVariantInfoFilters;
    if (category && Object.values(category).some((cat) => cat?.length)) {
      genomicFilters = [
        createGenomicFilter({
          Gene_with_variant: category.Gene_with_variant,
          Variant_consequence_calculated: category.Variant_consequence_calculated,
          Variant_frequency_as_text: category.Variant_frequency_as_text,
        }),
      ];
    }
  }
</script>

{#await loadFilters()}
  <Loading />
{:then}
  <section id="detail-filters-container" class="my-4">
    <h2 class="text-left h4 mb-2 mt-6">Filters Applied</h2>
    <FiltersSummary version={QueryVersion.V2} {filters} {genomicFilters} />
  </section>
{:catch}
  <ErrorAlert title="API Error">
    An error occurred while retrieving filter information for this saved dataset.
  </ErrorAlert>
{/await}

<SelectedVariablesSummary paths={allFields} />
