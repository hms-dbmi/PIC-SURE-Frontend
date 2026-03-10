<script lang="ts">
  import type { QueryV2, QueryV3 } from '$lib/models/query/Query';
  import { loadQuerySummaryData } from './QueryConverters';

  import FiltersSummary from '$lib/components/query/FiltersSummary.svelte';
  import SelectedVariablesSummary from '$lib/components/query/SelectedVariablesSummary.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import Loading from '$lib/components/Loading.svelte';

  let {
    query,
    version,
    uuid,
  }: {
    query: QueryV2 | QueryV3;
    version: string;
    uuid?: string;
  } = $props();
</script>

{#await loadQuerySummaryData(query, version)}
  <Loading />
{:then data}
  <section id="detail-filters-container" class="my-4">
    <h2 class="text-left h4 mb-2 mt-6">Filters Applied</h2>
    <FiltersSummary filterTree={data.filterTree} genomicFilters={data.genomicFilters} />
  </section>
  <SelectedVariablesSummary paths={data.fields} />
{:catch}
  <ErrorAlert title="API Error">
    An error occurred while retrieving filter information for {uuid
      ? `saved dataset ${uuid}`
      : 'this saved dataset'}.
  </ErrorAlert>
{/await}
