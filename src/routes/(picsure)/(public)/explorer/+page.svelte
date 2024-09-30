<script lang="ts">
  import { branding } from '$lib/configuration';
  import Content from '$lib/components/Content.svelte';
  import Explorer from '$lib/components/explorer/Explorer.svelte';
  import authTour from '$lib/assets/authTourConfiguration.json';
  import type {user} from "$lib/stores/User.ts";
  import type {filters} from "$lib/stores/Filter.ts";



  function filtersValidForUser(): boolean {
    console.log("User: " + $user.queryScopes);
    console.log("Filters:" + $filters);
    return true;
  }
</script>

<svelte:head>
  <title>{branding.applicationName} | Explorer</title>
</svelte:head>

<Content full>
  {#if filtersValidForUser()}
    <div>Invalid filters</div>
  {:else}
    <Explorer tourConfig={authTour} />
  {/if}

</Content>
