<script lang="ts">
  import Content from '$lib/components/Content.svelte';
  import { branding } from '$lib/configuration';
  import Explorer from '$lib/components/explorer/Explorer.svelte';
  import {filters, hasGenomicFilter, hasStigmatizedFilter, removeGenomicFilters} from "$lib/stores/Filter.ts";
  import {goto} from "$app/navigation";
  import ErrorAlert from "$lib/components/ErrorAlert.svelte";
  import {page} from "$app/stores";

  function isValidDiscoverQuery(): boolean {
    return !(hasGenomicFilter || hasStigmatizedFilter);
  }
  function resetQuery() {
    removeGenomicFilters();
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
      {#if hasStigmatizedFilter}
        <ErrorAlert title="Your selected filters contain stigmatizing variables which are not supported with Discover">
          <p>Please <a on:click={() => resetQuery()}>reset the query</a> or go back to <a href="/explorer">Explore</a>.</p>
        </ErrorAlert>
      {/if}
      {#if hasGenomicFilter}
        <ErrorAlert title="Your selected filters contain genomic filters, which are not supported with Discover.">
          <p>Please <a on:click={() => resetQuery()}>reset the query</a> or go back to <a href="/explorer">Explore</a>.</p>
        </ErrorAlert>
      {/if}
    </section>
  {/if}
</Content>
