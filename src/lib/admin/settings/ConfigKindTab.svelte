<script lang="ts">
  import IconButton from '#lib/ui/IconButton.svelte';
  import {
    CONFIG_FIELD_SCHEMA,
    deprecatedApiRows,
    groupedConfigFieldSchema,
    type ConfigFieldSchema,
  } from '#lib/config/admin.ts';
  import {
    apiConfigMap,
    envConfigMap,
    getConfigMode,
    type ConfigMap,
    type ConfigObject,
    type ConfigMode,
  } from '#lib/config/resolve.ts';
  import {
    adminConfig,
    isApiAvailable,
    type AdminConfigKind,
  } from '#lib/admin/settings/adminConfig.svelte.ts';
  import ConfigFieldRow from './ConfigFieldRow.svelte';
  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';
  import Loading from '#lib/ui/Loading.svelte';
  import ConfirmButton from '#lib/ui/ConfirmButton.svelte';
  import SearchInput from '#lib/ui/SearchInput.svelte';
  import { toaster } from '#lib/ui/toaster.ts';
  import { humanizeKey } from '#lib/utils/strings.ts';

  const SEARCH_BOX_MIN_LENGTH = 10;

  interface Props {
    // One tab can cover more than one config kind (e.g. Features + Settings merged into
    // a single "Settings & Features" tab) so that fields can be grouped by relation
    // across kinds, not just within one. Each field carries its own `kind` (below) so
    // Save/Reset still hit the right admin API per-field.
    kinds: AdminConfigKind[];
    title: string;
    // Disables editing (save/reset/delete) for non-top-admins, but leaves the field
    // search and "Invalidate Cache & Refresh" affordance usable - those are read-only
    // operations, not config edits.
    readOnly?: boolean;
  }

  let { kinds, title, readOnly = false }: Props = $props();

  const KIND_LABEL: Record<AdminConfigKind, string> = {
    features: 'Features',
    settings: 'Settings',
    branding: 'Branding',
  };

  type KindedField = ConfigFieldSchema & { kind: AdminConfigKind };

  let kindedSchema: KindedField[] = $derived(
    kinds.flatMap((kind) => CONFIG_FIELD_SCHEMA[kind].map((field) => ({ ...field, kind }))),
  );
  let availableAPIKinds: AdminConfigKind[] = $derived(kinds.filter((kind) => isApiAvailable(kind)));
  let activeConfigMode: ConfigMode = $derived(getConfigMode());

  let rowsByKind: Partial<Record<AdminConfigKind, readonly ConfigObject[]>> = $derived(
    Object.fromEntries(kinds.map((kind) => [kind, adminConfig.rows(kind)])),
  );

  // Built once per kind here (not once per field in ConfigFieldRow) and handed down,
  // since every field row in a kind resolves its origin against the same two maps.
  let apiMapByKind: Partial<Record<AdminConfigKind, ConfigMap>> = $derived(
    Object.fromEntries(kinds.map((kind) => [kind, apiConfigMap(rowsByKind[kind] ?? [])])),
  );
  let envMap: ConfigMap = $derived(envConfigMap());

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
        ...g,
        fields: g.fields.filter((field) =>
          `${humanizeKey(field.name)} ${field.name} ${field.description} ${g.groupLabel}`
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
      await adminConfig.remove(entry.kind, entry.row.uuid);
      toaster.success({ title: `Deleted ${entry.row.name}` });
    } catch (e) {
      console.error(e);
      toaster.error({ title: `Failed to delete ${entry.row.name}` });
    }
  }

  async function invalidateCache() {
    try {
      await adminConfig.invalidateServerCache();
      toaster.success({ title: 'Server-side config cache invalidated' });
      // Give the toast a moment to render before the reload tears down the page.
      setTimeout(() => window.location.reload(), 750);
    } catch (e) {
      console.error(e);
      toaster.error({ title: 'Failed to invalidate config cache' });
    }
  }

  function commaList(list: string[]) {
    switch (list.length) {
      case 0:
        return '';
      case 1:
        return list[0];
      case 2:
        return list.join(' and ');
      default:
        return list.slice(0, -1).join(', ') + ' and ' + list.slice(-1);
    }
  }
</script>

{#await Promise.all(kinds.map((kind) => adminConfig.load(kind)))}
  <Loading />
{:then}
  {#if availableAPIKinds.length != kinds.length || activeConfigMode === 'override'}
    <ErrorAlert
      color="secondary"
      iconSize="lg"
      data-testid={`admin-config-api-unavailable-${testIdBase}`}
    >
      <span class="font-bold">Some values are disabled</span> and can't be edited here:
      <ul class="ml-4 list-disc">
        {#if activeConfigMode === 'override'}
          <li>Environment variables are set to override api values.</li>
        {/if}
        {#if availableAPIKinds.length != kinds.length}
          {@const notAvailable = kinds.filter((k) => !availableAPIKinds.includes(k))}
          <li>
            API overrides are not available for {commaList(notAvailable)} in this environment.
          </li>
        {/if}
      </ul>
    </ErrorAlert>
  {/if}
  {#if kinds.includes('branding')}
    <ErrorAlert color="secondary" iconSize="lg" data-testid="admin-config-branding-scope-note">
      <span class="font-bold">Limited scope:</span> Most branding is sourced from the build-time configuration
      file.
    </ErrorAlert>
  {/if}
  <div class="flex items-center gap-3 my-3">
    {#if kindedSchema.length > SEARCH_BOX_MIN_LENGTH}
      <SearchInput
        class="w-full max-w-sm flex-1"
        placeholder="Search fields…"
        label="Search fields"
        data-testid={`admin-config-search-${testIdBase}`}
        bind:value={query}
      />
      <span class="text-xs opacity-60 whitespace-nowrap">
        {visibleCount} of {kindedSchema.length} fields
      </span>
    {/if}
    <div class="flex-1"></div>
    <ConfirmButton
      label="Invalidate Cache & Refresh"
      variant="tonal-surface"
      dialogSize="third"
      data-testid={`admin-config-invalidate-cache-${testIdBase}`}
      title="Invalidate Cache?"
      confirmLabel="Yes"
      cancelLabel="No"
      onconfirm={invalidateCache}
    >
      Are you sure you want to invalidate the server-side config cache? This immediately forces the
      app to refetch all cached values from the backend, instead of waiting for the routine refresh
      (up to 4 hours). Individual users will still need to refresh their browsers in order to see
      the changed values.
    </ConfirmButton>
  </div>
  <div data-testid={`admin-config-tab-${testIdBase}`}>
    {#each filteredGroups as group (group.group)}
      <div class="mb-8" data-testid={`admin-config-group-${testIdBase}-${group.group}`}>
        {#if showGroupHeaders}
          <div
            class="text-[13px] font-bold uppercase tracking-wide opacity-70 border-b border-surface-200-800 pb-2 mb-3.5"
          >
            {group.groupLabel}
          </div>
        {/if}
        <div class="flex flex-col gap-2.5">
          {#each group.fields as field (`${field.kind}:${field.name}`)}
            <ConfigFieldRow
              schema={field}
              apiMap={apiMapByKind[field.kind] ?? {}}
              {envMap}
              apiAvailable={availableAPIKinds.includes(field.kind)}
              kind={field.kind}
              {readOnly}
            />
          {/each}
        </div>
      </div>
    {/each}
    {#if filteredGroups.length === 0}
      <p
        class="text-center text-sm opacity-60 py-10"
        data-testid={`admin-config-no-results-${testIdBase}`}
      >
        No fields match &ldquo;{query}&rdquo;.
      </p>
    {/if}
  </div>
  <p class="text-xs opacity-60 mt-3">
    Users may not see changes until their browser session or the server-side config cache refreshes
    (up to 4 hours) unless you invalidate the cache.
  </p>
  {#if deprecated.length > 0}
    <div class="mt-6" data-testid={`admin-config-deprecated-${testIdBase}`}>
      <h3 class="font-semibold opacity-80 mb-1">Deprecated Keys</h3>
      <p class="text-xs opacity-60 mb-2">
        These stored values do not correspond to a known {title} field, so they are not read by the app
        under this kind. This includes genuinely unused keys, but also a key that was moved to a different
        kind - check the value before deleting.
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
            <tr data-testid={`admin-config-deprecated-row-${entry.row.name}`}>
              <td class="font-mono text-xs">{entry.row.name}</td>
              {#if kinds.length > 1}
                <td class="text-xs opacity-70 capitalize">{KIND_LABEL[entry.kind]}</td>
              {/if}
              <td class="font-mono text-xs">{entry.row.value}</td>
              <td class="text-xs opacity-70">{entry.row.description ?? ''}</td>
              <td>
                <IconButton
                  icon="fa-solid fa-trash fa-lg"
                  label="Delete"
                  data-testid={`admin-config-deprecated-delete-${entry.row.name}`}
                  disabled={readOnly}
                  onclick={() => deleteDeprecated(entry)}
                />
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
