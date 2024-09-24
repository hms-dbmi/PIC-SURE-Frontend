<script lang="ts">
  import Content from '$lib/components/Content.svelte';
  import { branding } from '$lib/configuration';
  import Explorer from '$lib/components/explorer/Explorer.svelte';
  import {filters, hasGenomicFilter, hasStigmatizedFilter, removeGenomicFilters} from "$lib/stores/Filter.ts";
  import {goto} from "$app/navigation";
  import ErrorAlert from "$lib/components/ErrorAlert.svelte";
  import {page} from "$app/stores";

  function resetQuery() {
    removeGenomicFilters();
  }
</script>

<svelte:head>
  <title>{branding.applicationName} | Discover</title>
</svelte:head>

<Content full>
  {#if $hasGenomicFilter || $hasStigmatizedFilter}
    <section id="discover-error-container" class="flex gap-9">
      <ErrorAlert title="Your selected filters contain stigmatizing variables and/or genomic filters, which are not supported with Discover">
        <p>Would you like to <a on:click={() => resetQuery()}>remove the invalid filters</a> or go back to <a href="/explorer">Explore</a>?</p>
      </ErrorAlert>
    </section>
  {:else}
    <Explorer />
  {/if}
</Content>
