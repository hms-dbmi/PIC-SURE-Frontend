<script lang="ts">
  import { removeGenomicFilters, removeUnallowedFilters } from '$lib/stores/Filter.ts';
  import { goto } from '$app/navigation';
  import { hasGenomicFilter, hasUnallowedFilter, hasInvalidFilter } from '$lib/stores/Filter.ts';

  let message = '';
  let backTo = '';
  let resetQuery = () => {};


  if ($hasGenomicFilter || $hasUnallowedFilter) {
    message = 'Your selected filters contain stigmatizing variables and/or genomic filters, which are not supported with Discover';
    backTo = 'Discover';
    resetQuery = () => {
      removeGenomicFilters();
      goto(`/${backTo.toLowerCase()}`);
    };
  } else if ($hasInvalidFilter) {
    message = 'Your selected filters contain invalid filters, which are not supported with Explorer';
    backTo = 'Explorer';
    resetQuery = () => {
      removeUnallowedFilters();
      goto(`/${backTo.toLowerCase()}`);
    };
  }
</script>

<section id="discover-error-container" class="flex gap-9 justify-center">
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
            on:click={() => goto(`/${backTo.toLowerCase()}`)}>Back to {backTo}</button
          >
        </div>
      </div>
    </div>
  </aside>
</section>
