<script lang="ts">
  import Content from '$lib/components/Content.svelte';
  import { branding } from '$lib/configuration';
  import Explorer from '$lib/components/explorer/Explorer.svelte';
  import {filters, hasGenomicFilter, hasStigmatizedFilter} from "$lib/stores/Filter.ts";
  import {goto} from "$app/navigation";
  import ErrorAlert from "$lib/components/ErrorAlert.svelte";
  import {page} from "$app/stores";

  function isValidDiscoverQuery(): boolean {
    return !(hasGenomicFilter || hasStigmatizedFilter);
  }
</script>

<svelte:head>
  <title>{branding.applicationName} | Discover</title>
</svelte:head>

<Content full>
  {#if isValidDiscoverQuery()}
    {() => filters.set($filters)}
    <Explorer />
  {:else}
    <section id="discover-error-container" class="flex gap-9">
      {#if hasGenomicFilter}
        <ErrorAlert title="Your selected filters contain stigmatizing variables which are not supported with Discover">
          <p>Please reset the query or go back to Explore.</p>
        </ErrorAlert>
      {/if}
      {#if hasStigmatizedFilter}
        <ErrorAlert title="Your selected filters contain genomic filters, which are not supported with Discover.">
          <p>Please reset the query or go back to Explore.</p>
        </ErrorAlert>
      {/if}
    </section>
  {/if}
</Content>
