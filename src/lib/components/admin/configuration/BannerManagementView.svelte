<script lang="ts">
  import { onDestroy, onMount, tick } from 'svelte';
  import { elasticInOut } from 'svelte/easing';
  import { scale } from 'svelte/transition';
  import BannerEditor from '$lib/components/admin/configuration/BannerEditor.svelte';
  import BannerManagementRow from '$lib/components/admin/configuration/BannerManagementRow.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import Loading from '$lib/components/Loading.svelte';
  import type { BannerLifecycle, ManagedBanner } from '$lib/models/Banner';
  import { getManagedBanners } from '$lib/services/BannerManagement';
  import { bannerPlainText } from '$lib/utilities/BannerHTML';

  type LifecycleTab = 'orderable' | 'saved' | 'expired';
  type ManagementRecord = ManagedBanner & { excerpt: string };

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

  const counts = $derived({
    orderable: records.filter((banner) => inTab(banner.lifecycle, 'orderable')).length,
    saved: records.filter((banner) => inTab(banner.lifecycle, 'saved')).length,
    expired: records.filter((banner) => inTab(banner.lifecycle, 'expired')).length,
  });
  const visibleRecords = $derived(
    records.filter(
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
    return { ...banner, excerpt: bannerPlainText(banner.htmlContent) };
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

  async function handleSuccess(banner: ManagedBanner) {
    records = [...records.filter((record) => record.uuid !== banner.uuid), present(banner)];
    activeTab = tabFor(banner.lifecycle);
    search = '';
    openUuid = null;
    mode = 'list';
    editingBanner = null;
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
      <div
        class="mt-6 border-b border-surface-300"
        role="tablist"
        aria-label="Banner lifecycle states"
      >
        {#each [{ value: 'orderable' as const, label: 'Active & scheduled', count: counts.orderable }, { value: 'saved' as const, label: 'Saved & disabled', count: counts.saved }, { value: 'expired' as const, label: 'Expired', count: counts.expired }] as tab}
          <button
            type="button"
            role="tab"
            id={`banner-management-tab-${tab.value}`}
            class="mr-6 border-b-3 px-1 py-3 font-bold {activeTab === tab.value
              ? 'border-primary-500 text-primary-700'
              : 'border-transparent text-surface-600'}"
            aria-selected={activeTab === tab.value}
            aria-controls="banner-management-panel"
            onclick={() => {
              activeTab = tab.value;
              openUuid = null;
            }}
          >
            {tab.label}
            <span class="ml-1 rounded-full bg-surface-200 px-2 py-1 text-xs">{tab.count}</span>
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
                duration: arrivalUuid === banner.uuid ? 450 : 0,
                easing: elasticInOut,
              }}
            >
              <BannerManagementRow
                {banner}
                open={openUuid === banner.uuid}
                ontoggle={() => (openUuid = openUuid === banner.uuid ? null : banner.uuid)}
                onedit={() => editBanner(banner)}
              />
            </div>
          {/each}
        {/if}
      </div>
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
