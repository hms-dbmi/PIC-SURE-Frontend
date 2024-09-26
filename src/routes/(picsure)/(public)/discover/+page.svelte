<script lang="ts">
  import Content from '$lib/components/Content.svelte';
  import { branding } from '$lib/configuration';
  import Explorer from '$lib/components/explorer/Explorer.svelte';
  import {
    hasGenomicFilter,
    hasUnallowedFilter,
    removeGenomicFilters,
    removeUnallowedFilters,
  } from '$lib/stores/Filter.ts';
  import { goto } from '$app/navigation';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import openTour from '$lib/assets/openTourConfiguration.json';

  function resetQuery() {
    removeGenomicFilters();
    removeUnallowedFilters();
  }
</script>

<svelte:head>
  <title>{branding.applicationName} | Discover</title>
</svelte:head>

<Content full>
  {#if $hasGenomicFilter || $hasUnallowedFilter}
    <section id="discover-error-container" class="flex gap-9">
      <ErrorAlert
        title="Your selected filters contain stigmatizing variables and/or genomic filters, which are not supported with Discover"
      >
        <p>Would you like to remove the invalid filters or go back to explore?</p>
        <div class="dark">
          <button class="btn variant-filled" on:click={() => resetQuery()}
            >Remove Invalid Filters</button
          >
          <button class="btn variant-filled" on:click={() => goto('/explorer')}
            >Back to Explore</button
          >
        </div>
      </ErrorAlert>
    </section>
    <section id="discover-error-container2" class="flex gap-9 justify-center">
      <aside data-testid="error-alert" class="alert variant-soft-warning">
        <i class="fa-solid fa-triangle-exclamation text-4xl" aria-hidden="true"></i>
        <div class="alert-message">
          <h3 class="h3 text-left">Your selected filters contain stigmatizing variables and/or genomic filters, </h3>
          <h3 class="h3 text-left">which are not supported with Discover</h3>
          <p>Would you like to remove the invalid filters or go back to explore?</p>
          <div>
            <button class="btn variant-ghost" on:click={() => resetQuery()}
            >Remove Invalid Filters</button
            >
            <button class="btn variant-soft" on:click={() => goto('/explorer')}
            >Back to Explore</button
            >
            <button class="btn variant-ringed" on:click={() => goto('/explorer')}
            >Button 3</button
            >
            <button class="btn variant-filled" on:click={() => goto('/explorer')}
            >Button 4</button
            >
          </div>
          <div class="dark">
            <button class="btn variant-ghost" on:click={() => resetQuery()}
            >Remove Invalid Filters</button
            >
            <button class="btn variant-soft" on:click={() => goto('/explorer')}
            >Back to Explore</button
            >
            <button class="btn variant-ringed" on:click={() => goto('/explorer')}
            >Button 3</button
            >
            <button class="btn variant-filled" on:click={() => goto('/explorer')}
            >Button 4</button
            >
          </div>
        </div>
      </aside>
    </section>
  {:else}
    <Explorer tourConfig={openTour} />
  {/if}
</Content>
