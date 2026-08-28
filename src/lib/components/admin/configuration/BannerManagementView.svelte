<script lang="ts">
  /* eslint-disable @typescript-eslint/no-explicit-any -- dnd-kit events lack exported types */
  import { onDestroy, onMount, tick } from 'svelte';
  import { elasticInOut } from 'svelte/easing';
  import { scale } from 'svelte/transition';
  import BannerEditor from '$lib/components/admin/configuration/BannerEditor.svelte';
  import BannerManagementRow from '$lib/components/admin/configuration/BannerManagementRow.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import Loading from '$lib/components/Loading.svelte';
  import type { BannerLifecycle, ManagedBanner, ManagementRecord } from '$lib/models/Banner';
  import {
    archiveBanner,
    disableBanner,
    getManagedBanners,
    reorderBanners,
  } from '$lib/services/BannerManagement';
  import { bannerPlainText } from '$lib/utilities/BannerHTML';
  import { toaster } from '$lib/toaster';
  import {
    DragDropProvider,
    DragOverlay,
    KeyboardSensor,
    PointerSensor,
  } from '@dnd-kit-svelte/svelte';

  type LifecycleTab = 'orderable' | 'saved' | 'expired';
  const lifecycleTabs = [
    { value: 'orderable' as const, label: 'Active & scheduled' },
    { value: 'saved' as const, label: 'Saved & disabled' },
    { value: 'expired' as const, label: 'Expired' },
  ];
  const MAX_EXCERPT_LENGTH = 160;
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
  let search = $state('');
  let openUuid: string | null = $state(null);
  let mode: 'list' | 'create' | 'edit' = $state('list');
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
  let disablingUuid: string | null = null;
  let archivingUuid: string | null = $state(null);

  const counts = $derived({
    orderable: records.filter((banner) => inTab(banner.lifecycle, 'orderable')).length,
    saved: records.filter((banner) => inTab(banner.lifecycle, 'saved')).length,
    expired: records.filter((banner) => inTab(banner.lifecycle, 'expired')).length,
  });
  const orderedRecords = $derived(
    orderUuids
      .map((uuid) => records.find((banner) => banner.uuid === uuid))
      .filter((banner): banner is ManagementRecord => banner !== undefined),
  );
  const visibleRecords = $derived(
    (activeTab === 'orderable' ? orderedRecords : records).filter(
      (banner) =>
        inTab(banner.lifecycle, activeTab) &&
        `${banner.title ?? ''} ${banner.excerpt}`
          .toLocaleLowerCase()
          .includes(search.trim().toLocaleLowerCase()),
    ),
  );

  onMount(async () => {
    try {
      records = (await getManagedBanners()).map(present);
      orderUuids = records
        .filter((banner) => inTab(banner.lifecycle, 'orderable'))
        .map((banner) => banner.uuid);
      savedOrderUuids = [...orderUuids];
    } catch {
      failed = true;
    } finally {
      loading = false;
    }
  });

  onDestroy(() => {
    if (arrivalTimeout !== undefined) window.clearTimeout(arrivalTimeout);
  });

  function inTab(lifecycle: BannerLifecycle, tab: LifecycleTab) {
    if (tab === 'orderable') return lifecycle === 'ACTIVE' || lifecycle === 'SCHEDULED';
    if (tab === 'saved') return lifecycle === 'SAVED' || lifecycle === 'DISABLED';
    return lifecycle === 'EXPIRED';
  }

  function present(banner: ManagedBanner): ManagementRecord {
    const plainText = bannerPlainText(banner.htmlContent);
    const characters = Array.from(plainText);
    const excerpt =
      characters.length > MAX_EXCERPT_LENGTH
        ? `${characters
            .slice(0, MAX_EXCERPT_LENGTH - 1)
            .join('')
            .trimEnd()}…`
        : plainText;
    return { ...banner, excerpt };
  }

  function tabFor(lifecycle: BannerLifecycle): LifecycleTab {
    if (lifecycle === 'ACTIVE' || lifecycle === 'SCHEDULED') return 'orderable';
    if (lifecycle === 'EXPIRED') return 'expired';
    return 'saved';
  }

  function createBanner() {
    editingBanner = null;
    mode = 'create';
  }

  function editBanner(banner: ManagedBanner) {
    editingBanner = banner;
    mode = 'edit';
  }

  function selectLifecycleTab(tab: LifecycleTab) {
    activeTab = tab;
    openUuid = null;
  }

  function handleLifecycleTabKeydown(event: KeyboardEvent, index: number) {
    let destination: number | undefined;
    if (event.key === 'ArrowRight') destination = (index + 1) % lifecycleTabs.length;
    if (event.key === 'ArrowLeft')
      destination = (index - 1 + lifecycleTabs.length) % lifecycleTabs.length;
    if (event.key === 'Home') destination = 0;
    if (event.key === 'End') destination = lifecycleTabs.length - 1;
    if (destination === undefined) return;

    event.preventDefault();
    const tab = lifecycleTabs[destination].value;
    selectLifecycleTab(tab);
    document.getElementById(`banner-management-tab-${tab}`)?.focus();
  }

  async function disable(uuid: string) {
    if (disablingUuid) return;
    disablingUuid = uuid;
    try {
      const disabled = await disableBanner(uuid);
      records = records.map((record) =>
        record.uuid === disabled.uuid ? present(disabled) : record,
      );
      orderUuids = orderUuids.filter((orderUuid) => orderUuid !== disabled.uuid);
      savedOrderUuids = savedOrderUuids.filter((orderUuid) => orderUuid !== disabled.uuid);
      openUuid = null;
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
    if (archivingUuid) return;
    archivingUuid = uuid;
    try {
      const archived = await archiveBanner(uuid);
      records = records.filter((record) => record.uuid !== archived.uuid);
      // An archiveable occurrence is never in the orderable queue, so these stay no-ops that cannot
      // introduce or discard unsaved order changes.
      orderUuids = orderUuids.filter((orderUuid) => orderUuid !== archived.uuid);
      savedOrderUuids = savedOrderUuids.filter((orderUuid) => orderUuid !== archived.uuid);
      openUuid = null;
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

  async function handleSuccess(banner: ManagedBanner) {
    records = [...records.filter((record) => record.uuid !== banner.uuid), present(banner)];
    activeTab = tabFor(banner.lifecycle);
    search = '';
    openUuid = null;
    mode = 'list';
    editingBanner = null;
    if (inTab(banner.lifecycle, 'orderable') && !orderUuids.includes(banner.uuid)) {
      orderUuids = [...orderUuids, banner.uuid];
      savedOrderUuids = [...savedOrderUuids, banner.uuid];
    } else if (!inTab(banner.lifecycle, 'orderable')) {
      orderUuids = orderUuids.filter((uuid) => uuid !== banner.uuid);
      savedOrderUuids = savedOrderUuids.filter((uuid) => uuid !== banner.uuid);
    }
    arrivalUuid = banner.uuid;
    await tick();
    document.querySelector(`[data-banner-row="${banner.uuid}"]`)?.scrollIntoView({
      block: 'center',
    });
    if (arrivalTimeout !== undefined) window.clearTimeout(arrivalTimeout);
    arrivalTimeout = window.setTimeout(() => {
      if (arrivalUuid === banner.uuid) arrivalUuid = null;
    }, 1_800);
  }

  function handleDragStart(event: any) {
    const source = event?.operation?.source;
    if (!source || activeTab !== 'orderable' || search.trim()) return;
    activeDragUuid = String(source.id);
    dragStartOrder = [...orderUuids];
    dragTargetUuid = activeDragUuid;
  }

  function handleDragOver(event: any) {
    if (!activeDragUuid) return;
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

  function handleDragEnd(event: any) {
    if (event?.canceled ?? event?.operation?.canceled) orderUuids = dragStartOrder;
    activeDragUuid = null;
    dragTargetUuid = null;
    dragStartOrder = [];
  }

  async function saveOrder() {
    savingOrder = true;
    try {
      const authoritative = await reorderBanners(orderUuids);
      const presented = authoritative.map(present);
      records = [
        ...presented,
        ...records.filter((banner) => !inTab(banner.lifecycle, 'orderable')),
      ];
      orderUuids = presented.map((banner) => banner.uuid);
      savedOrderUuids = [...orderUuids];
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

{#if mode !== 'list'}
  <BannerEditor
    banner={editingBanner}
    {ondirtychange}
    {tabchangerequest}
    {ontabchangerequestresolve}
    onsuccess={handleSuccess}
    oncancel={() => {
      mode = 'list';
      editingBanner = null;
    }}
  />
{:else}
  <section aria-labelledby="site-banners-title">
    <header class="flex items-start justify-between gap-6">
      <div>
        <h2 id="site-banners-title">Site banners</h2>
        <p>Create and manage announcements across PIC-SURE.</p>
      </div>
      <button type="button" class="btn preset-filled-primary-500" onclick={createBanner}>
        + Create banner
      </button>
    </header>

    {#if loading}
      <Loading />
    {:else if failed}
      <div class="mt-6">
        <ErrorAlert title="API Error">Site banners could not be loaded.</ErrorAlert>
      </div>
    {:else}
      <DragDropProvider
        {sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {#if activeTab === 'orderable' && !search.trim() && orderDirty}
          <div class="mt-5 flex justify-end gap-3">
            <button type="button" class="btn preset-tonal-primary" onclick={cancelOrderChanges}>
              Cancel order changes
            </button>
            <button
              type="button"
              class="btn preset-filled-primary-500"
              disabled={savingOrder}
              onclick={saveOrder}
            >
              {savingOrder ? 'Saving order...' : 'Save order'}
            </button>
          </div>
        {/if}
        <div
          class="mt-6 border-b border-surface-300"
          role="tablist"
          aria-label="Banner lifecycle states"
        >
          {#each lifecycleTabs as tab, index}
            <button
              type="button"
              role="tab"
              id={`banner-management-tab-${tab.value}`}
              class="mr-6 border-b-3 px-1 py-3 font-bold {activeTab === tab.value
                ? 'border-primary-500 text-primary-700'
                : 'border-transparent text-surface-600'}"
              aria-selected={activeTab === tab.value}
              aria-controls="banner-management-panel"
              tabindex={activeTab === tab.value ? 0 : -1}
              onclick={() => selectLifecycleTab(tab.value)}
              onkeydown={(event) => handleLifecycleTabKeydown(event, index)}
            >
              {tab.label}
              <span class="ml-1 rounded-full bg-surface-200 px-2 py-1 text-xs"
                >{counts[tab.value]}</span
              >
            </button>
          {/each}
        </div>

        <label class="mt-5 block max-w-md">
          <span class="sr-only">Search banner text</span>
          <input type="search" class="input" placeholder="Search banner text" bind:value={search} />
        </label>

        <div
          id="banner-management-panel"
          class="mt-5 grid gap-3"
          role="tabpanel"
          aria-labelledby={`banner-management-tab-${activeTab}`}
        >
          {#if visibleRecords.length === 0}
            <p class="rounded border border-surface-300 p-6 text-center text-surface-600">
              {search.trim() ? 'No banners match this search.' : 'No banners in this section.'}
            </p>
          {:else}
            {#each visibleRecords as banner (banner.uuid)}
              <div
                data-banner-row={banner.uuid}
                class:banner-arrival={arrivalUuid === banner.uuid}
                in:scale={{
                  start: 0.97,
                  opacity: 1,
                  duration: arrivalUuid === banner.uuid ? 450 : 0,
                  easing: elasticInOut,
                }}
              >
                <BannerManagementRow
                  {banner}
                  open={openUuid === banner.uuid}
                  ontoggle={() => (openUuid = openUuid === banner.uuid ? null : banner.uuid)}
                  onedit={() => editBanner(banner)}
                  ondisable={() => disable(banner.uuid)}
                  onarchive={() => archive(banner.uuid)}
                  orderable={activeTab === 'orderable' && !search.trim()}
                  position={activeTab === 'orderable' ? orderUuids.indexOf(banner.uuid) + 1 : null}
                  index={orderUuids.indexOf(banner.uuid)}
                  activeId={activeDragUuid}
                  busy={archivingUuid === banner.uuid}
                />
              </div>
            {/each}
          {/if}
        </div>
        <DragOverlay>
          {#if activeDragUuid}
            {@const activeBanner = records.find((banner) => banner.uuid === activeDragUuid)}
            {#if activeBanner}
              <BannerManagementRow
                banner={activeBanner}
                open={false}
                ontoggle={() => {}}
                onedit={() => {}}
                ondisable={() => {}}
                onarchive={() => {}}
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
    animation: banner-highlight 1.8s ease-out;
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
