<script lang="ts">
  import { goto, beforeNavigate } from '$app/navigation';
  import { branding } from '$lib/configuration';
  import Content from '$lib/components/Content.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import AdvancedFiltering from '$lib/components/explorer/advanced/AdvancedFiltering.svelte';

  interface Props {
    backUrl: string;
    backTitle: string;
  }

  const { backUrl, backTitle }: Props = $props();

  let advancedFilteringRef: ReturnType<typeof AdvancedFiltering>;
  let showUnsavedModal = $state(false);
  let bypassGuard = false;

  beforeNavigate(({ cancel }) => {
    if (!bypassGuard && advancedFilteringRef?.hasUnsavedChanges()) {
      cancel();
      showUnsavedModal = true;
    }
  });

  function applyAndReturn() {
    advancedFilteringRef?.applyChanges();
    goto(backUrl);
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
    bypassGuard = true;
    goto(backUrl);
  }

  function handleBeforeUnload(event: BeforeUnloadEvent) {
    if (advancedFilteringRef?.hasUnsavedChanges()) {
      event.preventDefault();
    }
  }
</script>

<svelte:window onbeforeunload={handleBeforeUnload} />

<svelte:head>
  <title>{branding.applicationName} | Advanced Filtering</title>
</svelte:head>

<Modal bind:open={showUnsavedModal} title="Unsaved Changes" closeable={true} onclose={handleCancel}>
  <p class="mb-6">You have unsaved changes to your filters. What would you like to do?</p>
  <footer class="flex justify-end gap-2">
    <button class="btn border preset-tonal-error" onclick={handleDiscard}>Discard Changes</button>
    <button class="btn preset-filled-primary-500" onclick={handleApplyAndLeave}>
      Apply Changes
    </button>
  </footer>
</Modal>

<Content {backUrl} {backTitle} title="Advanced Filtering">
  <AdvancedFiltering bind:this={advancedFilteringRef} />
  <div class="mt-4 flex justify-end">
    <button class="btn preset-filled-primary-500" onclick={applyAndReturn}>Apply Changes</button>
  </div>
</Content>
