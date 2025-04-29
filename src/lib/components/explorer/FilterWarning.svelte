<script lang="ts">
  import { goto } from '$app/navigation';

  import { panelOpen } from '$lib/stores/SidePanel';
  import {
    removeGenomicFilters,
    removeUnallowedFilters,
    removeInvalidFilters,
    filterWarning,
  } from '$lib/stores/Filter.ts';

  import ErrorAlert from '$lib/components/ErrorAlert.svelte';

  interface Warning {
    message: string;
    backTo: string;
    resetQuery: () => void;
  }

  const filterWarnings: { [key: string]: Warning } = {
    stigmatizing: {
      message:
        'Your selected filters contain stigmatizing variables and/or genomic filters, which are not supported with Discover',
      backTo: 'Explore',
      resetQuery: () => {
        panelOpen.set(false);
        removeGenomicFilters();
        removeUnallowedFilters();
        goto(`/discover`);
      },
    },
    notAuthorized: {
      message:
        'You are not authorized to access the data in Explore based on your selected filters.',
      backTo: 'Discover',
      resetQuery: () => {
        panelOpen.set(false);
        removeInvalidFilters();
        goto(`/explorer`);
      },
    },
    undefined: {
      message: '',
      backTo: '',
      resetQuery: () => {},
    },
  };

  const warning: Warning = $derived(filterWarnings[$filterWarning || 'undefined']);
  const message: string = $derived(warning.message);
  const backTo: string = $derived(warning.backTo);
  const resetQuery: () => void = $derived(warning.resetQuery);

  function goBack() {
    goto(`/${backTo.toLowerCase()}`);
    filterWarning.set(undefined);
  }

  function reset() {
    resetQuery();
    filterWarning.set(undefined);
  }
</script>

<section
  id="discover-error-container"
  class="flex gap-9 justify-center bg-surface-200 rounded-container"
>
  <ErrorAlert data-testid="warning-alert" color="warning">
    <p>{message}</p>
    <p>Would you like to remove the invalid filters or go back to {backTo}?</p>
    <div>
      <button class="btn preset-outlined hover:preset-filled-warning-500" onclick={reset}>
        Remove Invalid Filters
      </button>
      <button class="btn preset-outlined hover:preset-filled-warning-500" onclick={goBack}>
        Back to {backTo}
      </button>
    </div>
  </ErrorAlert>
</section>
