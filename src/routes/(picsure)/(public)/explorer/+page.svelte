<script lang="ts">
  import { branding } from '$lib/configuration';
  import Content from '$lib/components/Content.svelte';
  import Explorer from '$lib/components/explorer/Explorer.svelte';
  import authTour from '$lib/assets/authTourConfiguration.json';
  import { user } from '$lib/stores/User.ts';
  import { filters } from '$lib/stores/Filter.ts';
  import { get } from 'svelte/store';
  import type { Filter } from '$lib/models/Filter.ts';

  function filtersInvalidForUser(): boolean {
    const currentFilters: Filter[] = get(filters);
    const queryScopes: string[] = get(user).queryScopes || [];
    console.log('query scopes: ' + queryScopes);
    console.log('filters:' + currentFilters);

    if (currentFilters.length === 0) {
      return false;
    }

    let hasInvalidFilter: boolean = !!currentFilters.find((filter) => {
      console.log('Filter description: ' + filter.dataset);
      let filterHasValidQueryScope: boolean = !!queryScopes.find((qs) => {
        let filterMatchesQueryScope =
          (filter.dataset || '').length > 0 && qs.indexOf(filter.dataset || 'INVALID FILTER') >= 0;
        if (filterMatchesQueryScope) {
          console.log('Filter {' + filter.dataset + '} matches queryScope {' + qs + '}');
        }
        return filterMatchesQueryScope;
      });
      return !filterHasValidQueryScope;
    });
    return hasInvalidFilter;
  }
</script>

<svelte:head>
  <title>{branding.applicationName} | Explorer</title>
</svelte:head>

<Content full>
  {#if filtersInvalidForUser()}
    <div>Invalid filters</div>
  {:else}
    <Explorer tourConfig={authTour} />
  {/if}
</Content>
