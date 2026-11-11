<script lang="ts">
  import Button from '#lib/ui/Button.svelte';
  import { onDestroy, onMount, tick } from 'svelte';
  import BannerEditor from '#lib/banners/components/admin/BannerEditor.svelte';
  import BannerManagementRow from '#lib/banners/components/admin/BannerRow.svelte';
  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';
  import Loading from '#lib/ui/Loading.svelte';
  import ConfirmDialog from '#lib/ui/dialog/ConfirmDialog.svelte';
  import type { ManagedBanner } from '#lib/banners/model/banner.ts';
  import type { LifecycleTab } from '#lib/banners/model/list.ts';
  import { BannerQueue } from '#lib/banners/queue.svelte.ts';
  import SortableProvider from '#lib/ui/sortable/SortableProvider.svelte';
  import {
    DragOverlay,
    type DragStartEvent,
    type DragOverEvent,
    type DragEndEvent,
  } from '#lib/ui/sortable/sortable.ts';
  import SearchInput from '#lib/ui/SearchInput.svelte';
  import LiveRegion from '#lib/ui/LiveRegion.svelte';
  import Tabs from '#lib/ui/Tabs.svelte';
  import { createAnnouncer } from '#lib/ui/announcer.svelte.ts';
  import { createUnsavedGuard } from '#lib/ui/unsavedGuard.svelte.ts';

  type OrderTransition =
    | { kind: 'lifecycle-tab'; tab: LifecycleTab; focus: boolean }
    | { kind: 'create' }
    | { kind: 'edit'; banner: ManagedBanner };
  const lifecycleTabs = [
    { value: 'orderable' as const, label: 'Active & scheduled' },
    { value: 'saved' as const, label: 'Saved & disabled' },
    { value: 'expired' as const, label: 'Expired' },
  ];
  const ARRIVAL_HIGHLIGHT_MS = 1_800;

  const queue = new BannerQueue();
  let lifecycleTabList: ReturnType<typeof Tabs<LifecycleTab>> | undefined = $state();
  let openUuid: string | null = $state(null);
  let mode: 'list' | 'create' | 'edit' | 'restore' = $state('list');
  let editingBanner: ManagedBanner | null = $state(null);
  let arrivalUuid: string | null = $state(null);
  let arrivalTimeout: number | undefined;
  let activeDragUuid: string | null = $state(null);
  let dragStartOrder: string[] = [];
  let dragTargetUuid: string | null = null;
  const orderGuard = createUnsavedGuard<OrderTransition>(() => mode === 'list' && queue.orderDirty);

  function reorderDescription(uuid: string, position = queue.orderUuids.indexOf(uuid) + 1): string {
    return `${queue.actionLabels.get(uuid) ?? 'banner'}. Position ${position} of ${queue.orderUuids.length}.`;
  }

  function announceMove({ operation: { source, target } }: DragOverEvent) {
    if (!source || !target || source.id === target.id || String(target.id) === dragTargetUuid)
      return;
    const destination = queue.orderUuids.indexOf(String(target.id));
    if (destination < 0) return;
    // The plugin runs before handleDragOver applies the destination to the working order.
    return `Moved ${reorderDescription(String(source.id), destination + 1)}`;
  }

  const announcements = {
    dragstart: ({ operation: { source } }: DragStartEvent) =>
      source ? `Picked up ${reorderDescription(String(source.id))}` : undefined,
    dragover: announceMove,
    dragend: ({ operation: { source }, canceled }: DragEndEvent) =>
      source
        ? canceled
          ? `Reordering ${queue.actionLabels.get(String(source.id)) ?? 'banner'} canceled.`
          : `Dropped ${reorderDescription(String(source.id))}`
        : undefined,
  };

  const searchAnnouncer = createAnnouncer({ delay: 250 });
  $effect(() => {
    const query = queue.search.trim();
    const count = queue.visible.length;
    void searchAnnouncer.announce(
      `${count} ${count === 1 ? 'banner' : 'banners'} ${
        query ? (count === 1 ? 'matches this search.' : 'match this search.') : 'in this section.'
      }`,
    );
  });

  onMount(() => queue.load());

  onDestroy(() => {
    if (arrivalTimeout !== undefined) window.clearTimeout(arrivalTimeout);
  });

  function createBanner() {
    if (queue.savingOrder) return;
    if (orderGuard.intercept({ kind: 'create' })) return;
    openCreateEditor();
  }

  function openCreateEditor() {
    editingBanner = null;
    mode = 'create';
  }

  function editBanner(banner: ManagedBanner) {
    if (queue.savingOrder) return;
    if (orderGuard.intercept({ kind: 'edit', banner })) return;
    openEditor(banner);
  }

  function openEditor(banner: ManagedBanner) {
    editingBanner = banner;
    mode = 'edit';
  }

  function restoreBanner(banner: ManagedBanner) {
    // A pending order save still has a follow-up getManagedBanners() in flight. Letting a
    // restore commit underneath it would let that older response replace the authoritative
    // restore reconciliation with the archived source and drop the new occurrence.
    if (queue.savingOrder) return;
    editingBanner = banner;
    mode = 'restore';
  }

  function selectLifecycleTab(tab: LifecycleTab, focus = false) {
    if (tab === queue.tab) return;
    if (orderGuard.intercept({ kind: 'lifecycle-tab', tab, focus })) return;
    applyLifecycleTab(tab, focus);
  }

  function applyLifecycleTab(tab: LifecycleTab, focus = false) {
    queue.tab = tab;
    openUuid = null;
    if (focus) lifecycleTabList?.focusTab(tab);
  }

  async function discardOrderChanges() {
    const transition = orderGuard.take();
    queue.discardOrderChanges();
    if (!transition) return;

    if (transition.kind === 'leave') {
      transition.proceed();
    } else if (transition.kind === 'lifecycle-tab') {
      applyLifecycleTab(transition.tab, transition.focus);
    } else if (transition.kind === 'create') {
      openCreateEditor();
    } else if (transition.kind === 'edit') {
      openEditor(transition.banner);
    } else if (transition.url) {
      await orderGuard.navigate(transition.url);
    }
  }

  async function disable(uuid: string) {
    const disabled = await queue.disable(uuid);
    if (disabled && openUuid === disabled.uuid) openUuid = null;
  }

  async function archive(uuid: string) {
    const archived = await queue.archive(uuid);
    if (!archived) return;
    if (openUuid === archived) openUuid = null;
    if (editingBanner?.uuid === archived) {
      mode = 'list';
      editingBanner = null;
    }
  }

  async function showArrival(uuid: string) {
    arrivalUuid = uuid;
    await tick();
    document.querySelector(`[data-banner-row="${uuid}"]`)?.scrollIntoView({ block: 'center' });
    if (arrivalTimeout !== undefined) window.clearTimeout(arrivalTimeout);
    arrivalTimeout = window.setTimeout(() => {
      if (arrivalUuid === uuid) arrivalUuid = null;
    }, ARRIVAL_HIGHLIGHT_MS);
  }

  async function reconcileSuccess(
    banner: ManagedBanner,
    sourceUuid: string | null = null,
    openDetails = false,
  ) {
    queue.adopt(banner, sourceUuid);
    openUuid = openDetails ? banner.uuid : null;
    mode = 'list';
    editingBanner = null;
    await showArrival(banner.uuid);
  }

  async function handleSuccess(banner: ManagedBanner) {
    await reconcileSuccess(banner);
  }

  async function handleRestoreSuccess(banner: ManagedBanner) {
    await reconcileSuccess(banner, editingBanner?.uuid ?? null, true);
  }

  function handleDragStart(event: DragStartEvent) {
    const source = event?.operation?.source;
    if (!source || queue.savingOrder || !queue.ordering) return;
    activeDragUuid = String(source.id);
    dragStartOrder = [...queue.orderUuids];
    dragTargetUuid = activeDragUuid;
  }

  function handleDragOver(event: DragOverEvent) {
    if (queue.savingOrder || !activeDragUuid) return;
    const targetUuid = event?.operation?.target?.id;
    if (!targetUuid || targetUuid === activeDragUuid || targetUuid === dragTargetUuid) return;
    if (queue.move(activeDragUuid, String(targetUuid))) dragTargetUuid = String(targetUuid);
  }

  function handleDragEnd(event: DragEndEvent) {
    if (event.canceled) queue.orderUuids = dragStartOrder;
    activeDragUuid = null;
    dragTargetUuid = null;
    dragStartOrder = [];
  }
</script>

<ConfirmDialog
  bind:open={orderGuard.open}
  title="Unsaved Changes"
  closeable={false}
  cancelLabel="Keep ordering"
  confirmLabel="Discard order changes"
  tone="danger"
  oncancel={() => orderGuard.take()}
  onconfirm={discardOrderChanges}
>
  You have unsaved banner ordering. Discard it or keep ordering.
</ConfirmDialog>

{#if mode !== 'list'}
  <BannerEditor
    banner={editingBanner}
    {mode}
    onsuccess={mode === 'restore' ? handleRestoreSuccess : handleSuccess}
    oncancel={() => {
      mode = 'list';
      editingBanner = null;
    }}
  />
{:else}
  <section
    class="min-w-0"
    aria-labelledby="banner-management-title"
    style:--banner-arrival-duration={`${ARRIVAL_HIGHLIGHT_MS}ms`}
  >
    <header class="flex items-start justify-between gap-6">
      <div class="space-y-1">
        <h2 id="banner-management-title" class="m-0">Site banners</h2>
        <p class="m-0">Create and manage announcements across PIC-SURE.</p>
      </div>
      <Button disabled={queue.savingOrder} onclick={createBanner}>+ Create banner</Button>
    </header>

    {#if queue.broadOverlapCount >= 4}
      <div class="mt-5">
        <ErrorAlert
          data-testid="banner-overlap-warning"
          title="Broad banner overlap"
          color="warning"
        >
          {queue.broadOverlapCount} published banners currently target Everyone and All pages. They may
          appear together.
        </ErrorAlert>
      </div>
    {/if}

    {#if queue.loading}
      <Loading />
    {:else if queue.failed}
      <div class="mt-6">
        <ErrorAlert title="API Error">Site banners could not be loaded.</ErrorAlert>
      </div>
    {:else}
      <SortableProvider
        {announcements}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {#if queue.ordering && (queue.orderDirty || queue.savingOrder)}
          <div class="mt-5 flex justify-end gap-3">
            <Button
              variant="tint"
              disabled={queue.savingOrder}
              onclick={() => queue.discardOrderChanges()}
            >
              Cancel order changes
            </Button>
            <Button
              disabled={queue.savingOrder ||
                queue.disablingUuid !== null ||
                queue.archivingUuid !== null}
              onclick={() => queue.saveOrder()}
            >
              {queue.savingOrder ? 'Saving order...' : 'Save order'}
            </Button>
          </div>
        {/if}
        <Tabs
          class="mt-6"
          variant="section"
          label="Banner lifecycle states"
          data-testid="banner-lifecycle-tabs"
          tabs={lifecycleTabs}
          value={queue.tab}
          onchange={(tab, { focus }) => selectLifecycleTab(tab, focus)}
          bind:this={lifecycleTabList}
        >
          {#snippet tab({ value, label })}
            {label}
            <span class="ml-1 rounded-full bg-surface-200 px-2 py-1 text-xs"
              >{queue.counts[value]}</span
            >
          {/snippet}
          {#snippet panel(tab)}
            {#if tab === queue.tab}
              <SearchInput
                class="mt-5 w-full max-w-sm"
                placeholder="Search banner text"
                label="Search banner text"
                data-testid="banner-search"
                bind:value={queue.search}
              />

              <LiveRegion message={searchAnnouncer.message} aria-label="Banner search results" />

              <div class="mt-5 grid min-w-0 gap-3">
                {#if queue.visible.length === 0}
                  <p class="rounded border border-surface-300 p-6 text-center text-surface-600">
                    {queue.search.trim()
                      ? 'No banners match this search.'
                      : 'No banners in this section.'}
                  </p>
                {:else}
                  {#each queue.visible as banner (banner.uuid)}
                    <div
                      data-banner-row={banner.uuid}
                      class="min-w-0"
                      class:banner-arrival={arrivalUuid === banner.uuid}
                    >
                      <BannerManagementRow
                        {banner}
                        actionLabel={queue.actionLabels.get(banner.uuid)!}
                        open={openUuid === banner.uuid}
                        ontoggle={() => (openUuid = openUuid === banner.uuid ? null : banner.uuid)}
                        onedit={() => editBanner(banner)}
                        ondisable={() => disable(banner.uuid)}
                        onarchive={() => archive(banner.uuid)}
                        onrestore={() => restoreBanner(banner)}
                        orderable={queue.ordering &&
                          !queue.savingOrder &&
                          queue.orderUuids.includes(banner.uuid)}
                        position={queue.tab === 'orderable' &&
                        queue.orderUuids.includes(banner.uuid)
                          ? queue.orderUuids.indexOf(banner.uuid) + 1
                          : null}
                        index={queue.orderUuids.indexOf(banner.uuid)}
                        activeId={activeDragUuid}
                        busy={queue.savingOrder ||
                          queue.archivingUuid === banner.uuid ||
                          queue.disablingUuid === banner.uuid}
                        disableDisabled={queue.disablingUuid !== null}
                        restoreDisabled={queue.savingOrder}
                        archiveDisabled={queue.archivingUuid !== null}
                      />
                    </div>
                  {/each}
                {/if}
              </div>
            {/if}
          {/snippet}
        </Tabs>
        <DragOverlay>
          {#if activeDragUuid}
            {@const activeBanner = queue.records.find((banner) => banner.uuid === activeDragUuid)}
            {#if activeBanner}
              <BannerManagementRow
                banner={activeBanner}
                actionLabel={queue.actionLabels.get(activeBanner.uuid)!}
                open={false}
                ontoggle={() => {}}
                onedit={() => {}}
                ondisable={() => {}}
                onarchive={() => {}}
                onrestore={() => {}}
                orderable={true}
                position={queue.orderUuids.indexOf(activeBanner.uuid) + 1}
                index={queue.orderUuids.indexOf(activeBanner.uuid)}
                isOverlay={true}
              />
            {/if}
          {/if}
        </DragOverlay>
      </SortableProvider>
    {/if}
  </section>
{/if}

<style>
  .banner-arrival {
    animation: banner-highlight var(--banner-arrival-duration) ease-out;
  }

  @keyframes banner-highlight {
    0% {
      box-shadow: inset 0 0 0 3px var(--color-primary-500);
      background: color-mix(in srgb, var(--color-primary-500) 10%, transparent);
    }
    65% {
      box-shadow: inset 0 0 0 3px var(--color-primary-500);
      background: color-mix(in srgb, var(--color-primary-500) 10%, transparent);
    }
    100% {
      box-shadow: inset 0 0 0 transparent;
      background: transparent;
    }
  }
</style>
