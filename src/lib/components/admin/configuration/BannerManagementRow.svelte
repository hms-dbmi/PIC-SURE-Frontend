<script lang="ts">
  import { slide } from 'svelte/transition';
  import { BANNER_APPEARANCE_DETAILS, type ManagedBanner } from '$lib/models/Banner';

  interface Props {
    banner: ManagedBanner & { excerpt: string };
    open: boolean;
    ontoggle: () => void;
    onedit: () => void;
  }

  let { banner, open, ontoggle, onedit }: Props = $props();
  const audienceLabels = {
    EVERYONE: 'Everyone',
    SIGNED_IN: 'Signed-in users',
    SIGNED_OUT: 'Signed-out visitors',
  } as const;
  const lifecycleLabels = {
    ACTIVE: 'Active',
    SCHEDULED: 'Scheduled',
    SAVED: 'Saved',
    DISABLED: 'Disabled',
    EXPIRED: 'Expired',
  } as const;

  const panelId = $derived(`banner-${banner.uuid}-details`);
  function scheduleSummary() {
    if (banner.lifecycle === 'SAVED') return 'Not published';
    const start = banner.startAt ? new Date(banner.startAt).toLocaleString() : 'No start date';
    const end = banner.endAt ? new Date(banner.endAt).toLocaleString() : 'No end date';
    return `${start} · ${end}`;
  }

  function pageTargetSummary() {
    if (
      banner.pageTargets.some(
        (target) =>
          typeof target === 'object' &&
          target !== null &&
          'kind' in target &&
          target.kind === 'ALL',
      )
    ) {
      return 'All pages';
    }
    if (banner.pageTargets.length === 0) return 'No pages selected';

    const routes = banner.pageTargets.flatMap((target) => {
      if (typeof target === 'string') return target.trim() ? [target] : [];
      if (typeof target !== 'object' || target === null) return [];

      const record = target as Record<string, unknown>;
      const route = [record.route, record.path, record.value, record.pattern].find(
        (value): value is string => typeof value === 'string' && value.trim().length > 0,
      );
      if (!route) return [];
      if (record.kind === 'SUBTREE' && !route.endsWith('/**')) {
        return [`${route.replace(/\/$/, '')}/**`];
      }
      return [route];
    });
    return routes.length > 0 ? routes.join(', ') : 'Selected pages unavailable';
  }
</script>

<article class="overflow-hidden rounded-xl border border-surface-300 bg-surface-50">
  <div class="flex min-h-28 items-center gap-4 p-4">
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
        <p><strong>Audience:</strong> {audienceLabels[banner.audience]}</p>
        <p><strong>Pages:</strong> {pageTargetSummary()}</p>
      </div>
      <div>
        <h3 class="text-sm font-bold uppercase tracking-wide">Last change</h3>
        <p>{new Date(banner.updatedAt).toLocaleString()}</p>
        <p>Last changed by {banner.updatedBy}</p>
      </div>
      {#if banner.lifecycle === 'SAVED'}
        <div class="sm:col-span-2">
          <button type="button" class="btn preset-tonal-primary" onclick={onedit}>
            Edit banner
          </button>
        </div>
      {/if}
    </section>
  {/if}
</article>
