<script lang="ts">
  import { branding } from '$lib/configuration';
  import Content from '$lib/components/Content.svelte';
  import Explorer from '$lib/components/explorer/Explorer.svelte';
  import authTour from '$lib/assets/authTourConfiguration.json';
  import type {User} from "$lib/models/User.ts";
  import type {user} from "$lib/stores/User.ts";
  import type {Filter} from "$lib/models/Filter.ts";
  import type {filters} from "$lib/stores/Filter.ts";



  function filtersValidForUser(user: User, filters: Filter[]): boolean {
    console.log(user.queryScopes);
    return true;
  }

  export const localUser = $user;
  export const localFilters = $filters;
</script>

<svelte:head>
  <title>{branding.applicationName} | Explorer</title>
</svelte:head>

<Content full>
  {#if filtersValidForUser(localUser, localFilters)}
    <div>Invalid filters</div>
  {:else}
    <Explorer tourConfig={authTour} />
  {/if}

</Content>
