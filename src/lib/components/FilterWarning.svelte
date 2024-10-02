<script lang="ts">
  import { removeGenomicFilters, removeUnallowedFilters } from '$lib/stores/Filter.ts';
  import { goto } from '$app/navigation';
  import {
    hasGenomicFilter,
    hasUnallowedFilter,
    hasInvalidFilter,
    removeInvalidFilters,
  } from '$lib/stores/Filter.ts';
  import { getModalStore } from '@skeletonlabs/skeleton';
  let message = '';
  let backTo = '';
  let resetQuery = () => {};

  const modalStore = getModalStore();

  function closedModal() {
    if ($modalStore[0]) {
      modalStore.close();
    }
  }

  function goBack() {
    goto(`/${backTo.toLowerCase()}`);
    closedModal();
  }

  if ($hasGenomicFilter || $hasUnallowedFilter) {
    message =
      'Your selected filters contain stigmatizing variables and/or genomic filters, which are not supported with Discover';
    backTo = 'Explorer';
    resetQuery = () => {
      removeGenomicFilters();
      removeUnallowedFilters();
      goto(`/discover`);
      closedModal()
    };
  } else if ($hasInvalidFilter) {
    message =
      'You are not authorized to access the data in Explore based on your selected filters.';
    backTo = 'Discover';
      resetQuery = () => {
        removeInvalidFilters();
        goto(`/explorer`);
        closedModal();
      };
    }
</script>

<section id="discover-error-container" class="flex gap-9 justify-center bg-surface-200 rounded-container-token">
  <aside data-testid="warning-alert" class="alert variant-ghost-warning">
    <i class="fa-solid fa-triangle-exclamation text-4xl" aria-hidden="true"></i>
    <div class="alert-message">
      <h3 class="h3 text-left">
        {message}
      </h3>
      <p>Would you like to remove the invalid filters or go back to {backTo}?</p>
      <div>
        <div class="dark">
          <button
            class="btn variant-ringed hover:variant-filled-warning"
            on:click={() => resetQuery()}>Remove Invalid Filters</button
          >
          <button
            class="btn variant-ringed hover:variant-filled-warning"
            on:click={() => goBack()}>Back to {backTo}</button
          >
        </div>
      </div>
    </div>
  </aside>
</section>
