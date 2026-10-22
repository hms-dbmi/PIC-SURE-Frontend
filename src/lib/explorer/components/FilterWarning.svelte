<script lang="ts">
  import { resolve } from '$app/paths';

  import { goto } from '$app/navigation';

  import { explorerPanel } from '#lib/explorer/panel.svelte.ts';
  import { filterState } from '#lib/query/filters.svelte.ts';

  import AlertDialog from '#lib/ui/dialog/AlertDialog.svelte';
  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';
  import Button from '#lib/ui/Button.svelte';

  interface Props {
    open: boolean;
    /** Refocused once the "Back to …" navigation has finished (Kit 3 blurs it when navigating). */
    returnFocus?: HTMLElement;
  }

  let { open = $bindable(false), returnFocus }: Props = $props();

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
        filterState.removeGenomic();
        filterState.removeUnallowed();
      },
    },
    notAuthorized: {
      message:
        'You are not authorized to access the data in Explore based on your selected filters.',
      backTo: 'Discover',
      path: 'explorer',
      back: 'discover',
      resetQuery: () => filterState.removeInvalid(),
    },
    undefined: {
      message: '',
      backTo: '',
      path: '',
      back: '',
      resetQuery: () => {},
    },
  };

  const warning: Warning = $derived(filterWarnings[filterState.warning || 'undefined']);

  async function goBack(event: MouseEvent) {
    const back = warning.back;
    const target = returnFocus;
    // A button pressed with Enter or Space clicks with detail 0. Firefox shows no focus ring on a
    // programmatic focus after Kit's focus reset unless asked, and mouse users shouldn't get one.
    const focusVisible = event.detail === 0;
    filterState.warning = undefined;
    open = false;
    await goto(resolve(back));
    target?.focus({ focusVisible });
  }

  async function reset() {
    const path = warning.path;
    await warning.resetQuery();
    explorerPanel.hide();
    filterState.warning = undefined;
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
