<script lang="ts">
  import { untrack } from 'svelte';

  import { toaster } from '#lib/ui/toaster.ts';
  import type { SearchResult } from '#lib/explorer/types.ts';
  import type { Filter } from '#lib/query/filter.svelte.ts';
  import { getConceptDetails } from '#lib/explorer/Dictionary.ts';

  import Loading from '#lib/ui/Loading.svelte';
  import FilterForm from '#lib/explorer/components/FilterForm.svelte';

  interface Props {
    data?: SearchResult;
    existingFilter?: Filter;
    onadded: (filter: Filter) => void;
  }

  let { data = {} as SearchResult, existingFilter, onadded }: Props = $props();

  // A new categorical filter needs the concept's values, which only its details carry. Keyed on
  // the concept rather than the row object, so a re-rendered row keeps the form and its selection.
  let detailsKey = $derived(
    !existingFilter && data.type === 'Categorical' ? `${data.dataset}\n${data.conceptPath}` : '',
  );
  let concept: SearchResult | Promise<SearchResult> = $derived(
    detailsKey ? untrack(() => loadDetails(data)) : data,
  );

  async function loadDetails(row: SearchResult): Promise<SearchResult> {
    try {
      return await getConceptDetails(row.conceptPath, row.dataset);
    } catch (error) {
      console.error(error);
      toaster.error({
        title: 'An error occured while loading the filter. Please try again later.',
      });
      return row;
    }
  }
</script>

{#await concept}
  <div class="flex justify-center" data-testid="filter-component">
    <Loading ring size="medium" />
  </div>
{:then concept}
  <FilterForm {concept} {existingFilter} {onadded} />
{/await}
