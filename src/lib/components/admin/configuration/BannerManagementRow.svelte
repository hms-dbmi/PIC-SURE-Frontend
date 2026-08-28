<script lang="ts">
  import { slide } from 'svelte/transition';
  import Modal from '$lib/components/Modal.svelte';
  import {
    BANNER_APPEARANCE_DETAILS,
    BANNER_AUDIENCE_LABELS,
    type ManagementRecord,
  } from '$lib/models/Banner';
  import { useSortable } from '@dnd-kit-svelte/svelte/sortable';

  interface Props {
    banner: ManagementRecord;
    open: boolean;
    ontoggle: () => void;
    onedit: () => void;
    ondisable: () => void;
    onarchive: () => void;
    orderable?: boolean;
    position?: number | null;
    index?: number;
    activeId?: string | null;
    isOverlay?: boolean;
    busy?: boolean;
    disableDisabled?: boolean;
    archiveDisabled?: boolean;
  }

  let {
    banner,
    open,
    ontoggle,
    onedit,
    ondisable,
    onarchive,
    orderable = false,
    position = null,
    index = 0,
    activeId = null,
    isOverlay = false,
    busy = false,
    disableDisabled = false,
    archiveDisabled = false,
  }: Props = $props();

  const { ref, handleRef } = useSortable({
    get id() {
      return banner.uuid;
    },
    index: () => index,
    type: 'banner',
    accept: 'banner',
    group: 'banner-order',
    get disabled() {
      return !orderable || isOverlay;
    },
  });
  const noopAttachment = () => {};
  const lifecycleLabels = {
    ACTIVE: 'Active',
    SCHEDULED: 'Scheduled',
    SAVED: 'Saved',
    DISABLED: 'Disabled',
    EXPIRED: 'Expired',
  } as const;

  const panelId = $derived(`banner-${banner.uuid}-details`);
  const editable = $derived(banner.lifecycle === 'SAVED' || banner.status === 'PUBLISHED');
  const disableable = $derived(banner.lifecycle === 'ACTIVE' || banner.lifecycle === 'SCHEDULED');
  const archiveable = $derived(
    banner.lifecycle === 'SAVED' ||
      banner.lifecycle === 'DISABLED' ||
      banner.lifecycle === 'EXPIRED',
  );

  function scheduleSummary() {
    if (banner.lifecycle === 'SAVED') return 'Not published';
    const start = banner.startAt ? new Date(banner.startAt).toLocaleString() : 'No start date';
    const end = banner.endAt ? new Date(banner.endAt).toLocaleString() : 'No end date';
    return `${start} · ${end}`;
  }

  function pageTargetSummary() {
    if (banner.pageTargets.length === 0) return 'No pages selected';
    if (
      banner.pageTargets.some(
        (target) =>
          target !== null &&
          typeof target === 'object' &&
          'kind' in target &&
          target.kind === 'ALL',
      )
    ) {
      return 'All pages';
    }

    const values: string[] = [];
    const visited: object[] = [];
    let inspectedNodes = 0;
    let omitted = false;

    function add(value: string) {
      if (values.length === 4) {
        omitted = true;
        return;
      }
      const trimmed = value.trim();
      if (!trimmed) return;
      values.push(trimmed.length > 48 ? `${trimmed.slice(0, 47)}…` : trimmed);
    }

    function visit(value: unknown, depth: number) {
      if (typeof value === 'string') return add(value);
      if (typeof value === 'number' || typeof value === 'boolean') return add(String(value));
      if (value === null || typeof value !== 'object') return;
      if (depth === 4 || inspectedNodes === 24 || visited.includes(value)) {
        omitted = true;
        return;
      }

      inspectedNodes += 1;
      visited.push(value);
      for (const child of Array.isArray(value) ? value : Object.values(value)) {
        visit(child, depth + 1);
      }
    }

    visit(banner.pageTargets, 0);
    if (values.length === 0) return 'Selected page values unavailable';
    return `${values.join(' · ')}${omitted ? ' · + more' : ''}`;
  }
</script>

<div class="relative" {@attach orderable && !isOverlay ? ref : noopAttachment}>
  <article
    class="overflow-hidden rounded-xl border border-surface-300 bg-surface-50 {activeId ===
      banner.uuid && !isOverlay
      ? 'invisible'
      : ''}"
  >
    <div class="flex min-h-28 items-center gap-4 p-4">
      {#if orderable}
        <div class="flex w-14 shrink-0 flex-col items-center gap-1">
          <button
            type="button"
            class="cursor-grab rounded p-3 text-surface-600 active:cursor-grabbing focus-visible:ring-3 focus-visible:ring-primary-500 focus-visible:outline-none"
            aria-label={`Reorder banner: ${banner.excerpt}`}
            aria-roledescription="sortable"
            title="Drag or use the keyboard to reorder"
            {@attach handleRef}
          >
            <i class="fa-solid fa-grip-vertical text-xl" aria-hidden="true"></i>
          </button>
          {#if position !== null}<span class="text-xs font-bold">Position {position}</span>{/if}
        </div>
      {/if}
      <span
        class="h-14 w-2 shrink-0 rounded-full {BANNER_APPEARANCE_DETAILS[banner.appearance]
          .swatchClass}"
        aria-hidden="true"
      ></span>
      <div class="min-w-0 flex-1">
        <p class="overflow-hidden text-ellipsis whitespace-nowrap font-bold">{banner.excerpt}</p>
        <div class="mt-2 flex flex-wrap items-center gap-2 text-sm text-surface-600">
          <span class="rounded-full bg-surface-200 px-2 py-1 font-bold uppercase">
            {lifecycleLabels[banner.lifecycle]}
          </span>
          <span
            >{BANNER_APPEARANCE_DETAILS[banner.appearance].label} · {banner.dismissible
              ? 'Dismissible'
              : 'Permanent'}</span
          >
        </div>
        <p class="mt-2 text-sm text-surface-600">{scheduleSummary()}</p>
      </div>
      <button
        type="button"
        class="btn preset-tonal-primary"
        aria-expanded={open}
        aria-controls={panelId}
        onclick={ontoggle}
      >
        Details <span aria-hidden="true">{open ? '▴' : '▾'}</span>
      </button>
    </div>
    {#if open}
      <section
        id={panelId}
        class="grid gap-5 border-t border-primary-200 bg-primary-50 p-5 sm:grid-cols-2"
        transition:slide={{ axis: 'y' }}
      >
        <div>
          <h3 class="text-sm font-bold uppercase tracking-wide">Visibility</h3>
          <p><strong>Audience:</strong> {BANNER_AUDIENCE_LABELS[banner.audience]}</p>
          <p><strong>Pages:</strong> {pageTargetSummary()}</p>
        </div>
        <div>
          <h3 class="text-sm font-bold uppercase tracking-wide">Last change</h3>
          <p>{new Date(banner.updatedAt).toLocaleString()}</p>
          <p>Last changed by {banner.updatedBy}</p>
        </div>
        {#if editable || disableable || archiveable}
          <div class="flex flex-wrap gap-2 sm:col-span-2">
            {#if editable}
              <button
                type="button"
                class="btn preset-tonal-primary"
                disabled={busy}
                onclick={onedit}
              >
                Edit banner
              </button>
            {/if}
            {#if disableable}
              <Modal
                data-testid="banner-{banner.uuid}-disable"
                title="Disable banner?"
                confirmText="Yes"
                cancelText="No"
                onconfirm={ondisable}
                triggerBase="btn preset-tonal-error"
                disabled={busy || disableDisabled}
                withDefault
              >
                {#snippet trigger()}
                  Disable banner
                {/snippet}
                Are you sure you want to disable this banner? It stops appearing to visitors immediately
                and moves to Saved &amp; disabled. Its content and history are kept.
              </Modal>
            {/if}
            {#if archiveable}
              <Modal
                data-testid="banner-{banner.uuid}-archive"
                title="Archive banner?"
                confirmText="Yes"
                cancelText="No"
                onconfirm={onarchive}
                triggerBase="btn preset-tonal-error"
                disabled={busy || archiveDisabled}
                withDefault
              >
                {#snippet trigger()}
                  Archive banner
                {/snippet}
                Are you sure you want to archive this banner? It leaves normal management and can no longer
                be edited, published, or reordered here. Its content and version history are retained
                in the database for records purposes.
              </Modal>
            {/if}
          </div>
        {/if}
      </section>
    {/if}
  </article>
  {#if orderable && activeId === banner.uuid && !isOverlay}
    <div
      data-testid="banner-drop-preview"
      class="absolute inset-0 flex items-center justify-center rounded-xl border border-dashed border-primary-500 bg-primary-500/10"
    >
      <span class="text-xs font-semibold uppercase tracking-wide text-primary-700">
        Moving: {banner.excerpt}
      </span>
    </div>
  {/if}
</div>
