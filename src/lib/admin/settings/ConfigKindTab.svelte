<script lang="ts">
  import { CONFIG_FIELD_SCHEMA, deprecatedApiRows } from '#lib/config/admin.ts';
  import { apiConfigMap, envConfigMap, type ConfigMap } from '#lib/config/resolve.ts';
  import {
    adminConfig,
    isApiAvailable,
    type AdminConfigKind,
  } from '#lib/admin/settings/adminConfig.svelte.ts';
  import ConfigFieldList, { type KindedField } from './ConfigFieldList.svelte';
  import ConfigFieldRow from './ConfigFieldRow.svelte';
  import ConfigNotices from './ConfigNotices.svelte';
  import DeprecatedConfigTable from './DeprecatedConfigTable.svelte';
  import InvalidateCacheButton from './InvalidateCacheButton.svelte';
  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';
  import Loading from '#lib/ui/Loading.svelte';

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

  let kindedSchema: KindedField[] = $derived(
    kinds.flatMap((kind) => CONFIG_FIELD_SCHEMA[kind].map((field) => ({ ...field, kind }))),
  );
  let unavailableKinds = $derived(kinds.filter((kind) => !isApiAvailable(kind)));

  // Built once per kind here (not once per field in ConfigFieldRow) and handed down,
  // since every field row in a kind resolves its origin against the same two maps.
  let apiMapByKind: Partial<Record<AdminConfigKind, ConfigMap>> = $derived(
    Object.fromEntries(kinds.map((kind) => [kind, apiConfigMap(adminConfig.rows(kind))])),
  );
  let envMap: ConfigMap = $derived(envConfigMap());

  let deprecated = $derived(
    kinds.flatMap((kind) =>
      deprecatedApiRows(kind, adminConfig.rows(kind)).map((row) => ({ kind, row })),
    ),
  );

  // Identifies this tab's testids/DOM regardless of how many kinds it covers -
  // "features-settings" for the merged tab, "branding" for a single-kind one.
  let testIdBase = $derived(kinds.join('-'));
</script>

{#await Promise.all(kinds.map((kind) => adminConfig.load(kind)))}
  <Loading />
{:then}
  <ConfigNotices {kinds} unavailable={unavailableKinds} {testIdBase} />
  <ConfigFieldList fields={kindedSchema} {testIdBase}>
    {#snippet actions()}
      <InvalidateCacheButton {testIdBase} />
    {/snippet}
    {#snippet field(item)}
      <ConfigFieldRow
        schema={item}
        apiMap={apiMapByKind[item.kind] ?? {}}
        {envMap}
        apiAvailable={!unavailableKinds.includes(item.kind)}
        kind={item.kind}
        {readOnly}
      />
    {/snippet}
  </ConfigFieldList>
  <p class="text-xs opacity-60 mt-3">
    Users may not see changes until their browser session or the server-side config cache refreshes
    (up to 4 hours) unless you invalidate the cache.
  </p>
  {#if deprecated.length > 0}
    <DeprecatedConfigTable
      entries={deprecated}
      {title}
      showKind={kinds.length > 1}
      {readOnly}
      {testIdBase}
    />
  {/if}
{:catch}
  <ErrorAlert title="API Error">
    Something went wrong when loading {title} configuration.
  </ErrorAlert>
{/await}
