<script lang="ts">
  import { branding } from '$lib/configuration';
  import Content from '$lib/components/Content.svelte';
  import Explorer from '$lib/components/explorer/Explorer.svelte';
  import authTour from '$lib/assets/authTourConfiguration.json';
  import {user} from "$lib/stores/User.ts";
  import {filters} from "$lib/stores/Filter.ts";
  import {derived, get, type Readable} from "svelte/store";
  import type {Filter} from "$lib/models/Filter.ts";



  function filtersValidForUser(): boolean {
    const currentFilters: Filter[] = get(filters);
    const queryScopes: string[] = get(user).queryScopes || [];
    console.log("query scopes: " + queryScopes);
    console.log("filters:" + currentFilters);

    if (currentFilters.length === 0) {
      return true;
    }

    let hasInvalidFilter : boolean = !!currentFilters.find((filter) => {
      let filterHasValidQueryScope: boolean = !!queryScopes.find((qs) => {
        (filter.description || '').indexOf(qs) >= 0;
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
  {#if filtersValidForUser()}
    <Explorer tourConfig={authTour} />
  {:else}
    <div>Invalid filters</div>
  {/if}

</Content>
