<script lang="ts">
  import { resolve } from '$app/paths';

  import { goto } from '$app/navigation';

  import { panelOpen } from '#lib/explorer/panel.ts';
  import {
    removeGenomicFilters,
    removeUnallowedFilters,
    removeInvalidFilters,
    filterWarning,
  } from '#lib/query/filters.ts';

  import AlertDialog from '#lib/ui/dialog/AlertDialog.svelte';
  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';
  import Button from '#lib/ui/Button.svelte';

  let { open = $bindable(false) }: { open: boolean } = $props();

  type ExplorePath = 'discover' | 'explorer' | '';

  interface Warning {
    message: string;
    backTo: string;
    path: ExplorePath;
    back: ExplorePath;
    resetQuery: () => void | Promise<void>;
  }

  const filterWarnings: { [key: string]: Warning } = {
    stigmatizing: {
      message:
        'Your selected filters contain stigmatizing variables and/or genomic filters, which are not supported with Discover',
      backTo: 'Explore',
      path: 'discover',
      back: 'explorer',
      resetQuery: () => {
        removeGenomicFilters();
        removeUnallowedFilters();
      },
    },
    notAuthorized: {
      message:
        'You are not authorized to access the data in Explore based on your selected filters.',
      backTo: 'Discover',
      path: 'explorer',
      back: 'discover',
      resetQuery: () => removeInvalidFilters(),
    },
    undefined: {
      message: '',
      backTo: '',
      path: '',
      back: '',
      resetQuery: () => {},
    },
  };

  const warning: Warning = $derived(filterWarnings[$filterWarning || 'undefined']);

  function goBack() {
    const back = warning.back;
    filterWarning.set(undefined);
    open = false;
    goto(resolve(back));
  }

  async function reset() {
    const path = warning.path;
    await warning.resetQuery();
    panelOpen.set(false);
    filterWarning.set(undefined);
    open = false;
    goto(resolve(path));
  }
</script>

<AlertDialog bind:open aria-label="Filter warning" size="half">
  <ErrorAlert data-testid="explorer-filter-warning" color="warning">
    <p>{warning.message}</p>
    <p>Would you like to remove the invalid filters or go back to {warning.backTo}?</p>
  </ErrorAlert>
  {#snippet actions()}
    <Button variant="outlined-warning" onclick={reset}>Remove Invalid Filters</Button>
    <Button variant="outlined-warning" onclick={goBack}>
      Back to {warning.backTo}
    </Button>
  {/snippet}
</AlertDialog>
