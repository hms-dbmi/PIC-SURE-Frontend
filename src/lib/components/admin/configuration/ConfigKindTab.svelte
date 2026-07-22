<script lang="ts">
  import {
    CONFIG_FIELD_SCHEMA,
    configApiEnvVarName,
    deprecatedApiRows,
    groupedConfigFieldSchema,
    type ConfigFieldSchema,
    type ConfigObject,
  } from '$lib/models/Configuration';
  import {
    adminConfigRows,
    deleteConfigRow,
    isApiAvailable,
    loadAdminConfig,
    type AdminConfigKind,
  } from '$lib/stores/AdminConfiguration';
  import ConfigFieldRow from './ConfigFieldRow.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import Loading from '$lib/components/Loading.svelte';
  import { toaster } from '$lib/toaster';
  import { humanizeKey } from '$lib/utilities/Strings';

  interface Props {
    // One tab can cover more than one config kind (e.g. Features + Settings merged into
    // a single "Settings & Features" tab) so that fields can be grouped by relation
    // across kinds, not just within one. Each field carries its own `kind` (below) so
    // Save/Reset still hit the right admin API per-field.
    kinds: AdminConfigKind[];
    title: string;
  }

  let { kinds, title }: Props = $props();

  const KIND_LABEL: Record<AdminConfigKind, string> = {
    features: 'Features',
    settings: 'Settings',
    branding: 'Branding',
  };

  type KindedField = ConfigFieldSchema & { kind: AdminConfigKind };

  let kindedSchema: KindedField[] = $derived(
    kinds.flatMap((kind) => CONFIG_FIELD_SCHEMA[kind].map((field) => ({ ...field, kind }))),
  );
  let apiAvailableByKind = $derived(
    Object.fromEntries(kinds.map((kind) => [kind, isApiAvailable(kind)])) as Record<
      AdminConfigKind,
      boolean
    >,
  );

  // Empty (not pre-seeded per kind) so this never reads `kinds` inside a $state
  // initializer - every read below falls back to `?? []` for a kind not loaded yet.
  let rowsByKind: Partial<Record<AdminConfigKind, ConfigObject[]>> = $state({});
  $effect(() => {
    // Accumulate into a plain local object, not `rowsByKind` itself - reading
    // `rowsByKind` inside this effect (e.g. via `{ ...rowsByKind }`) would make the
    // effect depend on the very state it writes, looping forever.
    const collected: Partial<Record<AdminConfigKind, ConfigObject[]>> = {};
    const unsubscribes = kinds.map((kind) =>
      adminConfigRows[kind].subscribe((r) => {
        collected[kind] = r;
        rowsByKind = { ...collected };
      }),
    );
    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
  });

  let deprecated = $derived(
    kinds.flatMap((kind) =>
      deprecatedApiRows(kind, rowsByKind[kind] ?? []).map((row) => ({ kind, row })),
    ),
  );

  // Sections group fields by relation (e.g. Google settings, or a feature flag together
  // with the settings that configure it) rather than by type or kind - see
  // groupedConfigFieldSchema. Headers are only worth showing once there's more than one
  // section (Branding currently has a single "Logo" group).
  let groups = $derived(groupedConfigFieldSchema(kindedSchema));
  let showGroupHeaders = $derived(groups.length > 1);

  let query = $state('');
  let normalizedQuery = $derived(query.trim().toLowerCase());
  let filteredGroups = $derived.by(() => {
    if (!normalizedQuery) return groups;
    return groups
      .map((g) => ({
        group: g.group,
        fields: g.fields.filter((field) =>
          `${humanizeKey(field.name)} ${field.name} ${field.description} ${g.group}`
            .toLowerCase()
            .includes(normalizedQuery),
        ),
      }))
      .filter((g) => g.fields.length > 0);
  });
  let visibleCount = $derived(filteredGroups.reduce((sum, g) => sum + g.fields.length, 0));

  // Identifies this tab's testids/DOM regardless of how many kinds it covers -
  // "features-settings" for the merged tab, "branding" for a single-kind one.
  let testIdBase = $derived(kinds.join('-'));

  async function deleteDeprecated(entry: { kind: AdminConfigKind; row: ConfigObject }) {
    if (!entry.row.uuid) return;
    try {
      await deleteConfigRow(entry.kind, entry.row.uuid);
      toaster.success({ title: `Deleted ${entry.row.name}` });
    } catch (e) {
      console.error(e);
      toaster.error({ title: `Failed to delete ${entry.row.name}` });
    }
  }

  // Bumping this forces loadAdminConfig's `force` param true on the next await, so an
  // admin can pull in rows another admin just added/changed without a full page reload.
  let refreshCount = $state(0);
  const refresh = () => (refreshCount += 1);
</script>

{#await Promise.all(kinds.map((kind) => loadAdminConfig(kind, refreshCount > 0)))}
  <Loading />
{:then}
  {#each kinds as kind (kind)}
    {#if !apiAvailableByKind[kind]}
      <ErrorAlert
        title="API overrides unavailable"
        color="warning"
        data-testid={`config-api-unavailable-${kind}`}
      >
        <p>
          API overrides are not available for {KIND_LABEL[kind]} in this environment (<code
            >{configApiEnvVarName(kind)}</code
          > is not set). Values below reflect env vars and defaults only, and can't be edited here.
        </p>
      </ErrorAlert>
    {/if}
  {/each}
  {#if kinds.includes('branding')}
    <ErrorAlert title="Limited scope" color="secondary" data-testid="config-branding-scope-note">
      <p>
        Most branding (application name, page copy, links, etc.) is sourced from the build-time
        configuration file and is not editable here — only Logo and Logo Alt Text are
        API/env-configurable.
      </p>
    </ErrorAlert>
  {/if}
  <div class="flex items-center gap-3 my-3">
    <div class="relative flex-1 max-w-sm">
      <i
        class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-xs opacity-50"
      ></i>
      <input
        type="text"
        class="input pl-8 w-full"
        placeholder="Search fields…"
        data-testid={`config-search-${testIdBase}`}
        bind:value={query}
      />
    </div>
    <span class="text-xs opacity-60 whitespace-nowrap">
      {visibleCount} of {kindedSchema.length} fields
    </span>
    <div class="flex-1"></div>
    <button
      type="button"
      class="btn preset-tonal-secondary border border-secondary-500 hover:preset-filled-secondary-500"
      data-testid={`config-refresh-${testIdBase}`}
      onclick={refresh}
    >
      Refresh
    </button>
  </div>
  <div data-testid={`config-tab-${testIdBase}`}>
    {#each filteredGroups as group (group.group)}
      <div class="mb-8" data-testid={`config-group-${testIdBase}-${group.group}`}>
        {#if showGroupHeaders}
          <div
            class="text-[13px] font-bold uppercase tracking-wide opacity-70 border-b border-surface-200-800 pb-2 mb-3.5"
          >
            {group.group}
          </div>
        {/if}
        <div class="flex flex-col gap-2.5">
          {#each group.fields as field (`${field.kind}:${field.name}`)}
            <ConfigFieldRow
              schema={field}
              rows={rowsByKind[field.kind] ?? []}
              apiAvailable={apiAvailableByKind[field.kind]}
              kind={field.kind}
            />
          {/each}
        </div>
      </div>
    {/each}
    {#if filteredGroups.length === 0}
      <p
        class="text-center text-sm opacity-60 py-10"
        data-testid={`config-no-results-${testIdBase}`}
      >
        No fields match &ldquo;{query}&rdquo;.
      </p>
    {/if}
  </div>
  <p class="text-xs opacity-60 mt-3">
    Saved changes take effect on your next page load. Other users may not see them until their
    session or the server-side config cache refreshes (up to 4 hours).
  </p>
  {#if deprecated.length > 0}
    <div class="mt-6" data-testid={`config-deprecated-${testIdBase}`}>
      <h3 class="font-semibold text-sm opacity-80 mb-1">Deprecated Keys</h3>
      <p class="text-xs opacity-60 mb-2">
        These stored values do not correspond to a known {title} field. They have no effect on the app
        and can be safely deleted.
      </p>
      <table class="table">
        <thead>
          <tr>
            <th>Name</th>
            {#if kinds.length > 1}
              <th>Kind</th>
            {/if}
            <th>Value</th>
            <th>Description</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {#each deprecated as entry (`${entry.kind}:${entry.row.uuid}`)}
            <tr data-testid={`config-deprecated-row-${entry.row.name}`}>
              <td class="font-mono text-xs">{entry.row.name}</td>
              {#if kinds.length > 1}
                <td class="text-xs opacity-70 capitalize">{KIND_LABEL[entry.kind]}</td>
              {/if}
              <td class="font-mono text-xs">{entry.row.value}</td>
              <td class="text-xs opacity-70">{entry.row.description ?? ''}</td>
              <td>
                <button
                  type="button"
                  title="Delete"
                  class="btn-icon-color"
                  data-testid={`config-deprecated-delete-${entry.row.name}`}
                  onclick={() => deleteDeprecated(entry)}
                >
                  <i class="fa-solid fa-trash fa-lg"></i>
                  <span class="sr-only">Delete</span>
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
{:catch}
  <ErrorAlert title="API Error">
    Something went wrong when loading {title} configuration.
  </ErrorAlert>
{/await}
