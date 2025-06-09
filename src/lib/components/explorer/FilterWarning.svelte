<script lang="ts">
  import { Modal } from '@skeletonlabs/skeleton-svelte';

  import { goto } from '$app/navigation';

  import { panelOpen } from '$lib/stores/SidePanel';
  import {
    removeGenomicFilters,
    removeUnallowedFilters,
    removeInvalidFilters,
    filterWarning,
  } from '$lib/stores/Filter.ts';

  import ErrorAlert from '$lib/components/ErrorAlert.svelte';

  let { open = $bindable(false) }: { open: boolean } = $props();

  interface Warning {
    message: string;
    backTo: string;
    path: string;
    back: string;
    resetQuery: () => void;
  }

  const filterWarnings: { [key: string]: Warning } = {
    stigmatizing: {
      message:
        'Your selected filters contain stigmatizing variables and/or genomic filters, which are not supported with Discover',
      backTo: 'Explore',
      path: '/discover',
      back: '/explorer',
      resetQuery: () => {
        removeGenomicFilters();
        removeUnallowedFilters();
      },
    },
    notAuthorized: {
      message:
        'You are not authorized to access the data in Explore based on your selected filters.',
      backTo: 'Discover',
      path: '/explorer',
      back: '/discover',
      resetQuery: () => removeInvalidFilters(),
    },
    undefined: {
      message: '',
      backTo: '',
      path: '/',
      back: '/',
      resetQuery: () => {},
    },
  };

  const warning: Warning = $derived(filterWarnings[$filterWarning || 'undefined']);

  function goBack() {
    const back = warning.back;
    filterWarning.set(undefined);
    open = false;
    goto(back);
  }

  function reset() {
    const path = warning.path;
    warning.resetQuery();
    panelOpen.set(false);
    filterWarning.set(undefined);
    open = false;
    goto(path);
  }
</script>

<Modal
  {open}
  onOpenChange={(e) => (open = e.open)}
  contentBase="overflow-auto max-w-screen w-1/2 max-h-screen"
  backdropClasses="backdrop-blur-sm"
  ids={{ content: 'modal-component' }}
>
  {#snippet content()}
    <ErrorAlert data-testid="sendfilter-warning" color="warning">
      <p>{warning.message}</p>
      <p>Would you like to remove the invalid filters or go back to {warning.backTo}?</p>
      <div>
        <button
          class="btn preset-outlined-warning-500 hover:preset-filled-warning-500"
          onclick={reset}
        >
          Remove Invalid Filters
        </button>
        <button
          class="btn preset-outlined-warning-500 hover:preset-filled-warning-500"
          onclick={goBack}
        >
          Back to {warning.backTo}
        </button>
      </div>
    </ErrorAlert>
  {/snippet}
</Modal>
