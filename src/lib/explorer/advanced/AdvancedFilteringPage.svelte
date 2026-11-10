<script lang="ts">
  import Button from '#lib/ui/Button.svelte';
  import { onMount, onDestroy } from 'svelte';
  import { config } from '#lib/config/config.svelte.ts';
  import Content from '#lib/shell/Content.svelte';
  import Dialog from '#lib/ui/dialog/Dialog.svelte';
  import AdvancedFiltering from '#lib/explorer/advanced/AdvancedFiltering.svelte';
  import { panelOpen } from '#lib/explorer/panel.ts';
  import { createUnsavedGuard } from '#lib/ui/unsavedGuard.svelte.ts';

  interface Props {
    backUrl: string;
    backTitle: string;
  }

  const { backUrl, backTitle }: Props = $props();

  let advancedFilteringRef: ReturnType<typeof AdvancedFiltering>;
  const guard = createUnsavedGuard(() => advancedFilteringRef?.hasUnsavedChanges() ?? false);

  onMount(() => {
    $panelOpen = false;
  });

  onDestroy(() => {
    $panelOpen = true;
  });

  function applyChanges() {
    advancedFilteringRef?.applyChanges();
  }

  function handleCancel() {
    guard.take();
  }

  function handleDiscard() {
    guard.take();
    guard.navigate(backUrl);
  }

  function handleModalApply() {
    guard.take();
    advancedFilteringRef?.applyChanges();
  }
</script>

<svelte:head>
  <title>{config.branding.applicationName} | Advanced Query Builder</title>
</svelte:head>

<Dialog bind:open={guard.open} title="Unsaved Changes" onclose={handleCancel}>
  <p>You have unsaved changes to your filters. What would you like to do?</p>
  {#snippet footer()}
    <Button variant="soft-error-static" onclick={handleDiscard}>Discard Changes</Button>
    <Button title="Save changes to query" onclick={handleModalApply}>Apply Changes</Button>
  {/snippet}
</Dialog>

<Content {backUrl} {backTitle} title="Advanced Query Builder">
  <p class="text-center w-[70%] m-auto mb-4">
    The Advanced Query Builder allows you to take full control of your search criteria. Define
    whether your added filters should be combined with <strong>and</strong> or
    <strong>or</strong> logic and create nested subqueries to group related conditions. Have
    thoughts or feedback on Advanced Query Builder?
    <a
      class="anchor"
      href="https://hms-dbmi.atlassian.net/servicedesk/customer/portal/5/group/6/create/362"
      >Let us know</a
    >!
  </p>
  <div class="flex flex-col justify-center items-center w-[70%] m-auto">
    <AdvancedFiltering bind:this={advancedFilteringRef} />
  </div>
  <div class="mt-4 flex justify-end w-[70%] mx-auto">
    <Button title="Save changes to query" onclick={applyChanges}>Apply Changes</Button>
  </div>
</Content>
