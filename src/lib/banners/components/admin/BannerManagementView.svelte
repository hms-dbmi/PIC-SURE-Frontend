<script lang="ts">
  import Button from '#lib/ui/Button.svelte';
  import { onDestroy, onMount, tick } from 'svelte';
  import BannerEditor from '#lib/banners/components/admin/BannerEditor.svelte';
  import BannerManagementRow from '#lib/banners/components/admin/BannerRow.svelte';
  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';
  import Loading from '#lib/ui/Loading.svelte';
  import ConfirmDialog from '#lib/ui/dialog/ConfirmDialog.svelte';
  import type { ManagedBanner, ManagementRecord } from '#lib/banners/model/banner.ts';
  import {
    archiveBanner,
    disableBanner,
    getManagedBanners,
    reorderBanners,
  } from '#lib/api/picsure/banners.ts';
  import {
    adoptCanonicalBannerOrder,
    bannerActionLabels,
    broadBannerOverlapCount,
    initialBannerListState,
    lifecycleTabCounts,
    lifecycleTabFor,
    reconcileBannerArchived,
    reconcileBannerDisabled,
    reconcileBannerSuccess,
    visibleBannerRecords,
    type BannerListState,
    type LifecycleTab,
  } from '#lib/banners/model/list.ts';
  import {
    Accessibility,
    defaultPreset,
    type DragStartEvent,
    type DragOverEvent,
    type DragEndEvent,
  } from '@dnd-kit/dom';
  import SearchInput from '#lib/ui/SearchInput.svelte';
  import LiveRegion from '#lib/ui/LiveRegion.svelte';
  import Tabs from '#lib/ui/Tabs.svelte';
  import { createAnnouncer } from '#lib/ui/announcer.svelte.ts';
  import { createUnsavedGuard } from '#lib/ui/unsavedGuard.svelte.ts';
  import { toaster } from '#lib/ui/toaster.ts';
  import {
    DragDropProvider,
    DragOverlay,
    KeyboardSensor,
    PointerSensor,
  } from '@dnd-kit-svelte/svelte';

  type OrderTransition =
    | { kind: 'configuration-tab'; destination: string }
    | { kind: 'lifecycle-tab'; tab: LifecycleTab; focus: boolean }
    | { kind: 'create' }
    | { kind: 'edit'; banner: ManagedBanner };
  const lifecycleTabs = [
    { value: 'orderable' as const, label: 'Active & scheduled' },
    { value: 'saved' as const, label: 'Saved & disabled' },
    { value: 'expired' as const, label: 'Expired' },
  ];
  const ARRIVAL_HIGHLIGHT_MS = 1_800;
  interface Props {
    ondirtychange?: (dirty: boolean) => void;
    tabchangerequest?: string | null;
    ontabchangerequestresolve?: (destination: string | null) => void;
  }

  let {
    ondirtychange = () => {},
    tabchangerequest = null,
    ontabchangerequestresolve = () => {},
  }: Props = $props();

  let records: ManagementRecord[] = $state([]);
  let loading = $state(true);
  let failed = $state(false);
  let activeTab: LifecycleTab = $state('orderable');
  let lifecycleTabList: ReturnType<typeof Tabs<LifecycleTab>> | undefined = $state();
  let search = $state('');
  let openUuid: string | null = $state(null);
  let mode: 'list' | 'create' | 'edit' | 'restore' = $state('list');
  let editingBanner: ManagedBanner | null = $state(null);
  let arrivalUuid: string | null = $state(null);
  let arrivalTimeout: number | undefined;
  let orderUuids: string[] = $state([]);
  let savedOrderUuids: string[] = $state([]);
  let activeDragUuid: string | null = $state(null);
  let dragStartOrder: string[] = [];
  let dragTargetUuid: string | null = null;
  let savingOrder = $state(false);
  const sensors = [KeyboardSensor, PointerSensor];
  const orderDirty = $derived(orderUuids.join() !== savedOrderUuids.join());
  let editorDirty = $state(false);
  let disablingUuid: string | null = $state(null);
  let archivingUuid: string | null = $state(null);
  const orderGuard = createUnsavedGuard<OrderTransition>(() => mode === 'list' && orderDirty);

  const actionLabels = $derived(bannerActionLabels(records));
  function reorderDescription(uuid: string, position = orderUuids.indexOf(uuid) + 1): string {
    return `${actionLabels.get(uuid) ?? 'banner'}. Position ${position} of ${orderUuids.length}.`;
  }

  function announceMove({ operation: { source, target } }: Parameters<DragOverEvent>[0]) {
    if (!source || !target || source.id === target.id || String(target.id) === dragTargetUuid)
      return;
    const destination = orderUuids.indexOf(String(target.id));
    if (destination < 0) return;
    // The plugin runs before handleDragOver applies the destination to the working order.
    return `Moved ${reorderDescription(String(source.id), destination + 1)}`;
  }

  const plugins = defaultPreset.plugins.map((plugin) =>
    plugin === Accessibility
      ? Accessibility.configure({
          announcements: {
            dragstart: ({ operation: { source } }: Parameters<DragStartEvent>[0]) =>
              source ? `Picked up ${reorderDescription(String(source.id))}` : undefined,
            dragover: announceMove,
            dragend: ({ operation: { source }, canceled }: Parameters<DragEndEvent>[0]) =>
              source
                ? canceled
                  ? `Reordering ${actionLabels.get(String(source.id)) ?? 'banner'} canceled.`
                  : `Dropped ${reorderDescription(String(source.id))}`
                : undefined,
          },
        })
      : plugin,
  );

  const counts = $derived(lifecycleTabCounts(records));
  const broadOverlapCount = $derived(broadBannerOverlapCount({ records, orderUuids }));
  const visibleRecords = $derived(visibleBannerRecords({ records, orderUuids }, activeTab, search));

  const searchAnnouncer = createAnnouncer({ delay: 250 });
  $effect(() => {
    const query = search.trim();
    const count = visibleRecords.length;
    void searchAnnouncer.announce(
      `${count} ${count === 1 ? 'banner' : 'banners'} ${
        query ? (count === 1 ? 'matches this search.' : 'match this search.') : 'in this section.'
      }`,
    );
  });

  function applyList(next: BannerListState) {
    records = next.records;
    orderUuids = next.orderUuids;
    savedOrderUuids = next.savedOrderUuids;
  }

  function currentList(): BannerListState {
    return { records, orderUuids, savedOrderUuids };
  }

  onMount(async () => {
    try {
      applyList(initialBannerListState(await getManagedBanners()));
    } catch {
      failed = true;
    } finally {
      loading = false;
    }
  });

  onDestroy(() => {
    if (arrivalTimeout !== undefined) window.clearTimeout(arrivalTimeout);
    ondirtychange(false);
  });

  $effect(() => {
    ondirtychange(mode === 'list' ? orderDirty : editorDirty);
  });

  $effect(() => {
    const request = tabchangerequest;
    if (!request || mode !== 'list') return;
    orderGuard.intercept({ kind: 'configuration-tab', destination: request });
  });

  function createBanner() {
    if (savingOrder) return;
    if (orderGuard.intercept({ kind: 'create' })) return;
    openCreateEditor();
  }

  function openCreateEditor() {
    editingBanner = null;
    mode = 'create';
  }

  function editBanner(banner: ManagedBanner) {
    if (savingOrder) return;
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
    if (savingOrder) return;
    editingBanner = banner;
    mode = 'restore';
  }

  function selectLifecycleTab(tab: LifecycleTab, focus = false) {
    if (tab === activeTab) return;
    if (orderGuard.intercept({ kind: 'lifecycle-tab', tab, focus })) return;
    applyLifecycleTab(tab, focus);
  }

  function applyLifecycleTab(tab: LifecycleTab, focus = false) {
    activeTab = tab;
    openUuid = null;
    if (focus) lifecycleTabList?.focusTab(tab);
  }

  function keepOrdering() {
    const transition = orderGuard.take();
    if (transition?.kind === 'configuration-tab') ontabchangerequestresolve(null);
  }

  async function discardOrderChanges() {
    const transition = orderGuard.take();
    orderUuids = [...savedOrderUuids];
    if (!transition) return;

    if (transition.kind === 'configuration-tab') {
      ontabchangerequestresolve(transition.destination);
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
    if (savingOrder || disablingUuid) return;
    disablingUuid = uuid;
    try {
      const disabled = await disableBanner(uuid);
      applyList(reconcileBannerDisabled(currentList(), disabled));
      if (openUuid === disabled.uuid) openUuid = null;
      toaster.success({ title: 'Banner disabled' });
    } catch {
      toaster.error({
        title: 'Banner could not be disabled',
        description: 'The banner is unchanged. Check your connection and try again.',
      });
    } finally {
      disablingUuid = null;
    }
  }

  async function archive(uuid: string) {
    if (savingOrder || archivingUuid) return;
    archivingUuid = uuid;
    try {
      const archived = await archiveBanner(uuid);
      applyList(reconcileBannerArchived(currentList(), archived.uuid));
      if (openUuid === archived.uuid) openUuid = null;
      if (editingBanner?.uuid === archived.uuid) {
        mode = 'list';
        editingBanner = null;
      }
      toaster.success({ title: 'Banner archived' });
    } catch {
      toaster.error({
        title: 'Banner could not be archived',
        description: 'The banner is unchanged. Check your connection and try again.',
      });
    } finally {
      archivingUuid = null;
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
    applyList(reconcileBannerSuccess(currentList(), banner, sourceUuid));
    activeTab = lifecycleTabFor(banner.lifecycle);
    search = '';
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

  function handleDragStart(event: Parameters<DragStartEvent>[0]) {
    const source = event?.operation?.source;
    if (!source || savingOrder || activeTab !== 'orderable' || search.trim()) return;
    activeDragUuid = String(source.id);
    dragStartOrder = [...orderUuids];
    dragTargetUuid = activeDragUuid;
  }

  function handleDragOver(event: Parameters<DragOverEvent>[0]) {
    if (savingOrder || !activeDragUuid) return;
    const targetUuid = event?.operation?.target?.id;
    if (!targetUuid || targetUuid === activeDragUuid || targetUuid === dragTargetUuid) return;
    const sourceIndex = orderUuids.indexOf(activeDragUuid);
    const targetIndex = orderUuids.indexOf(String(targetUuid));
    if (sourceIndex < 0 || targetIndex < 0) return;
    const next = [...orderUuids];
    const [moved] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, moved);
    orderUuids = next;
    dragTargetUuid = String(targetUuid);
  }

  function handleDragEnd(event: Parameters<DragEndEvent>[0]) {
    if (event.canceled) orderUuids = dragStartOrder;
    activeDragUuid = null;
    dragTargetUuid = null;
    dragStartOrder = [];
  }

  async function saveOrder() {
    if (savingOrder || disablingUuid || archivingUuid) return;
    savingOrder = true;
    try {
      const authoritative = await reorderBanners(orderUuids);
      applyList(adoptCanonicalBannerOrder(currentList(), authoritative));
      try {
        applyList(initialBannerListState(await getManagedBanners()));
      } catch {
        // The reorder already committed. Keep its canonical response instead of reporting a false mutation failure.
      }
      toaster.success({ title: 'Banner order saved' });
    } catch {
      toaster.error({
        title: 'Banner order could not be saved',
        description: 'The order was not saved. Review the current queue and try again.',
      });
    } finally {
      savingOrder = false;
    }
  }

  function cancelOrderChanges() {
    orderUuids = [...savedOrderUuids];
  }
</script>

<ConfirmDialog
  bind:open={orderGuard.open}
  title="Unsaved Changes"
  closeable={false}
  cancelLabel="Keep ordering"
  confirmLabel="Discard order changes"
  tone="danger"
  oncancel={keepOrdering}
  onconfirm={discardOrderChanges}
>
  You have unsaved banner ordering. Discard it or keep ordering.
</ConfirmDialog>

{#if mode !== 'list'}
  <BannerEditor
    banner={editingBanner}
    {mode}
    ondirtychange={(dirty) => (editorDirty = dirty)}
    {tabchangerequest}
    {ontabchangerequestresolve}
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
      <Button disabled={savingOrder} onclick={createBanner}>+ Create banner</Button>
    </header>

    {#if broadOverlapCount >= 4}
      <div class="mt-5">
        <ErrorAlert
          data-testid="banner-overlap-warning"
          title="Broad banner overlap"
          color="warning"
        >
          {broadOverlapCount} published banners currently target Everyone and All pages. They may appear
          together.
        </ErrorAlert>
      </div>
    {/if}

    {#if loading}
      <Loading />
    {:else if failed}
      <div class="mt-6">
        <ErrorAlert title="API Error">Site banners could not be loaded.</ErrorAlert>
      </div>
    {:else}
      <DragDropProvider
        {sensors}
        {plugins}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {#if activeTab === 'orderable' && !search.trim() && (orderDirty || savingOrder)}
          <div class="mt-5 flex justify-end gap-3">
            <button
              type="button"
              class="btn preset-tonal-primary"
              disabled={savingOrder}
              onclick={cancelOrderChanges}
            >
              Cancel order changes
            </button>
            <Button
              disabled={savingOrder || disablingUuid !== null || archivingUuid !== null}
              onclick={saveOrder}
            >
              {savingOrder ? 'Saving order...' : 'Save order'}
            </Button>
          </div>
        {/if}
        <Tabs
          class="mt-6"
          variant="section"
          label="Banner lifecycle states"
          data-testid="banner-lifecycle-tabs"
          tabs={lifecycleTabs}
          value={activeTab}
          onchange={(tab, { focus }) => selectLifecycleTab(tab, focus)}
          bind:this={lifecycleTabList}
        >
          {#snippet tab({ value, label })}
            {label}
            <span class="ml-1 rounded-full bg-surface-200 px-2 py-1 text-xs">{counts[value]}</span>
          {/snippet}
          {#snippet panel(tab)}
            {#if tab === activeTab}
              <SearchInput
                class="mt-5 w-full max-w-sm"
                placeholder="Search banner text"
                label="Search banner text"
                data-testid="banner-search"
                bind:value={search}
              />

              <LiveRegion message={searchAnnouncer.message} aria-label="Banner search results" />

              <div class="mt-5 grid min-w-0 gap-3">
                {#if visibleRecords.length === 0}
                  <p class="rounded border border-surface-300 p-6 text-center text-surface-600">
                    {search.trim()
                      ? 'No banners match this search.'
                      : 'No banners in this section.'}
                  </p>
                {:else}
                  {#each visibleRecords as banner (banner.uuid)}
                    <div
                      data-banner-row={banner.uuid}
                      class="min-w-0"
                      class:banner-arrival={arrivalUuid === banner.uuid}
                    >
                      <BannerManagementRow
                        {banner}
                        actionLabel={actionLabels.get(banner.uuid)!}
                        open={openUuid === banner.uuid}
                        ontoggle={() => (openUuid = openUuid === banner.uuid ? null : banner.uuid)}
                        onedit={() => editBanner(banner)}
                        ondisable={() => disable(banner.uuid)}
                        onarchive={() => archive(banner.uuid)}
                        onrestore={() => restoreBanner(banner)}
                        orderable={activeTab === 'orderable' &&
                          !search.trim() &&
                          !savingOrder &&
                          orderUuids.includes(banner.uuid)}
                        position={activeTab === 'orderable' && orderUuids.includes(banner.uuid)
                          ? orderUuids.indexOf(banner.uuid) + 1
                          : null}
                        index={orderUuids.indexOf(banner.uuid)}
                        activeId={activeDragUuid}
                        busy={savingOrder ||
                          archivingUuid === banner.uuid ||
                          disablingUuid === banner.uuid}
                        disableDisabled={disablingUuid !== null}
                        restoreDisabled={savingOrder}
                        archiveDisabled={archivingUuid !== null}
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
            {@const activeBanner = records.find((banner) => banner.uuid === activeDragUuid)}
            {#if activeBanner}
              <BannerManagementRow
                banner={activeBanner}
                actionLabel={actionLabels.get(activeBanner.uuid)!}
                open={false}
                ontoggle={() => {}}
                onedit={() => {}}
                ondisable={() => {}}
                onarchive={() => {}}
                onrestore={() => {}}
                orderable={true}
                position={orderUuids.indexOf(activeBanner.uuid) + 1}
                index={orderUuids.indexOf(activeBanner.uuid)}
                isOverlay={true}
              />
            {/if}
          {/if}
        </DragOverlay>
      </DragDropProvider>
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
