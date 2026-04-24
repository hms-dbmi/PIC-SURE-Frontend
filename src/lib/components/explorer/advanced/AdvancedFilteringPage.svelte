<script lang="ts">
  import { goto, beforeNavigate } from '$app/navigation';
  import { onMount, onDestroy } from 'svelte';
  import { branding } from '$lib/configuration';
  import Content from '$lib/components/Content.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import AdvancedFiltering from '$lib/components/explorer/advanced/AdvancedFiltering.svelte';
  import { panelOpen } from '$lib/stores/SidePanel';

  interface Props {
    backUrl: string;
    backTitle: string;
  }

  const { backUrl, backTitle }: Props = $props();

  let advancedFilteringRef: ReturnType<typeof AdvancedFiltering>;
  let showUnsavedModal = $state(false);
  let bypassGuard = false;

  onMount(() => {
    $panelOpen = false;
  });

  onDestroy(() => {
    $panelOpen = true;
  });

  beforeNavigate(({ cancel }) => {
    if (!bypassGuard && advancedFilteringRef?.hasUnsavedChanges()) {
      cancel();
      showUnsavedModal = true;
    }
  });

  function applyChanges() {
    advancedFilteringRef?.applyChanges();
  }

  function handleCancel() {
    showUnsavedModal = false;
  }

  function handleDiscard() {
    showUnsavedModal = false;
    bypassGuard = true;
    goto(backUrl);
  }

  function handleApplyAndLeave() {
    showUnsavedModal = false;
    advancedFilteringRef?.applyChanges();
  }

  function handleBeforeUnload(event: BeforeUnloadEvent) {
    if (advancedFilteringRef?.hasUnsavedChanges()) {
      event.preventDefault();
    }
  }
</script>

<svelte:window onbeforeunload={handleBeforeUnload} />

<svelte:head>
  <title>{branding.applicationName} | Advanced Query Builder</title>
</svelte:head>

<Modal bind:open={showUnsavedModal} title="Unsaved Changes" closeable={true} onclose={handleCancel}>
  <p class="mb-6">You have unsaved changes to your filters. What would you like to do?</p>
  <footer class="flex justify-end gap-2">
    <button class="btn border preset-tonal-error" onclick={handleDiscard}>Discard Changes</button>
    <button
      class="btn preset-filled-primary-500"
      title="Save changes to query"
      onclick={handleApplyAndLeave}
    >
      Apply Changes
    </button>
  </footer>
</Modal>

<Content {backUrl} {backTitle} title="Advanced Query Builder">
  <p class="text-center w-[70%] m-auto mb-4">
    The Advanced Query Builder allows you to take full control of your search criteria. Define
    whether your added filters should be combined with <strong>and</strong> or
    <strong>or</strong> logic and create nested subqueries to group related conditions.
  </p>
  <div class="flex flex-col justify-center items-center w-[70%] m-auto">
    <AdvancedFiltering bind:this={advancedFilteringRef} />
  </div>
  <div class="mt-4 flex justify-end w-[70%] mx-auto">
    <button
      class="btn preset-filled-primary-500"
      title="Save changes to query"
      onclick={applyChanges}
    >
      Apply Changes
    </button>
  </div>
</Content>
