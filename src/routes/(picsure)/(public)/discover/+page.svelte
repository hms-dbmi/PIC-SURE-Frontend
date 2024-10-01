<script lang="ts">
  import Content from '$lib/components/Content.svelte';
  import { branding } from '$lib/configuration';
  import Explorer from '$lib/components/explorer/Explorer.svelte';
  import {
    hasGenomicFilter,
    hasUnallowedFilter,
    removeGenomicFilters,
    removeUnallowedFilters,
    hasInvalidFilter,
  } from '$lib/stores/Filter.ts';
  import { goto } from '$app/navigation';
  import openTour from '$lib/assets/openTourConfiguration.json';

  function resetQuery() {
    removeGenomicFilters();
    removeUnallowedFilters();
  }

  import { beforeNavigate } from '$app/navigation';
  import { getModalStore } from '@skeletonlabs/skeleton';
  import FilterWarning from '$lib/components/FilterWarning.svelte';

  const modalStore = getModalStore();

  beforeNavigate((nav) => {
    console.log(nav);
    if ($hasInvalidFilter && nav?.to?.url.pathname.includes('/explorer')) {
      modalStore.trigger({
        type: 'component',
        component: 'modalWrapper',
        meta: { component: FilterWarning, width: 'w-3/4' },
      });
    } else if (($hasGenomicFilter || $hasUnallowedFilter) && nav?.to?.url.pathname.includes('/discover')) {
      modalStore.trigger({
          type: 'component',
          component: 'modalWrapper',
          meta: { component: FilterWarning, width: 'w-3/4' },
        });
      }
  });
</script>

<svelte:head>
  <title>{branding.applicationName} | Discover</title>
</svelte:head>

<Content full>
  {#if $hasGenomicFilter || $hasUnallowedFilter}
    <section id="discover-error-container" class="flex gap-9 justify-center">
      <aside data-testid="warning-alert" class="alert variant-ghost-warning">
        <i class="fa-solid fa-triangle-exclamation text-4xl" aria-hidden="true"></i>
        <div class="alert-message">
          <h3 class="h3 text-left">
            Your selected filters contain stigmatizing variables and/or genomic filters,
          </h3>
          <h3 class="h3 text-left">which are not supported with Discover</h3>
          <p>Would you like to remove the invalid filters or go back to explore?</p>
          <div>
            <div class="dark">
              <button
                class="btn variant-ringed hover:variant-filled-warning"
                on:click={() => resetQuery()}>Remove Invalid Filters</button
              >
              <button
                class="btn variant-ringed hover:variant-filled-warning"
                on:click={() => goto('/explorer')}>Back to Explore</button
              >
            </div>
          </div>
        </div>
      </aside>
    </section>
  {:else}
    <Explorer tourConfig={openTour} />
  {/if}
</Content>
