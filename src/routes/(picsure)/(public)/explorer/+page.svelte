<script lang="ts">
  import { branding } from '$lib/configuration';
  import Content from '$lib/components/Content.svelte';
  import Explorer from '$lib/components/explorer/Explorer.svelte';
  import authTour from '$lib/assets/authTourConfiguration.json';
  import { user } from '$lib/stores/User.ts';
  import {hasInvalidFilter} from '$lib/stores/Filter.ts';
  import {get, type Readable} from 'svelte/store';

  function filtersInvalidForUser(): Readable<boolean> {
    const queryScopes: string[] = get(user).queryScopes || [];
    return hasInvalidFilter(queryScopes);
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
