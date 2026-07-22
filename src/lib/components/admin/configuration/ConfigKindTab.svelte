<script lang="ts">
  import {
    CONFIG_FIELD_SCHEMA,
    configApiEnvVarName,
    deprecatedApiRows,
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

  interface Props {
    kind: AdminConfigKind;
  }

  let { kind }: Props = $props();

  let schema = $derived(CONFIG_FIELD_SCHEMA[kind]);
  let apiAvailable = $derived(isApiAvailable(kind));
  let kindLabel = $derived(
    { features: 'Features', settings: 'Settings', branding: 'Branding' }[kind],
  );
  let envVarName = $derived(configApiEnvVarName(kind));

  let rows: ConfigObject[] = $state([]);
  $effect(() => adminConfigRows[kind].subscribe((r) => (rows = r)));

  let deprecated = $derived(deprecatedApiRows(kind, rows));

  async function deleteDeprecated(row: ConfigObject) {
    if (!row.uuid) return;
    try {
      await deleteConfigRow(kind, row.uuid);
      toaster.success({ title: `Deleted ${row.name}` });
    } catch (e) {
      console.error(e);
      toaster.error({ title: `Failed to delete ${row.name}` });
    }
  }

  // Bumping this forces loadAdminConfig's `force` param true on the next await, so an
  // admin can pull in rows another admin just added/changed without a full page reload.
  let refreshCount = $state(0);
  const refresh = () => (refreshCount += 1);
</script>

{#await loadAdminConfig(kind, refreshCount > 0)}
  <Loading />
{:then}
  {#if !apiAvailable}
    <ErrorAlert
      title="API overrides unavailable"
      color="warning"
      data-testid={`config-api-unavailable-${kind}`}
    >
      <p>
        API overrides are not available for {kindLabel} in this environment (<code
          >{envVarName}</code
        > is not set). Values below reflect env vars and defaults only, and can't be edited here.
      </p>
    </ErrorAlert>
  {/if}
  {#if kind === 'branding'}
    <ErrorAlert title="Limited scope" color="secondary" data-testid="config-branding-scope-note">
      <p>
        Most branding (application name, page copy, links, etc.) is sourced from the build-time
        configuration file and is not editable here — only Logo and Logo Alt Text are
        API/env-configurable.
      </p>
    </ErrorAlert>
  {/if}
  <div class="flex justify-end my-3">
    <button
      type="button"
      class="btn preset-tonal-secondary border border-secondary-500 hover:preset-filled-secondary-500"
      data-testid={`config-refresh-${kind}`}
      onclick={refresh}
    >
      Refresh
    </button>
  </div>
  <div data-testid={`config-tab-${kind}`}>
    {#each schema as field (field.name)}
      <ConfigFieldRow schema={field} {rows} {apiAvailable} {kind} />
    {/each}
  </div>
  <p class="text-xs opacity-60 mt-3">
    Saved changes take effect on your next page load. Other users may not see them until their
    session or the server-side config cache refreshes (up to 4 hours).
  </p>
  {#if deprecated.length > 0}
    <div class="mt-6" data-testid={`config-deprecated-${kind}`}>
      <h3 class="font-semibold text-sm opacity-80 mb-1">Deprecated Keys</h3>
      <p class="text-xs opacity-60 mb-2">
        These stored values do not correspond to a known {kindLabel} field. They have no effect on
        the app and can be safely deleted.
      </p>
      <table class="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Value</th>
            <th>Description</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {#each deprecated as row (row.uuid)}
            <tr data-testid={`config-deprecated-row-${row.name}`}>
              <td class="font-mono text-xs">{row.name}</td>
              <td class="font-mono text-xs">{row.value}</td>
              <td class="text-xs opacity-70">{row.description ?? ''}</td>
              <td>
                <button
                  type="button"
                  title="Delete"
                  class="btn-icon-color"
                  data-testid={`config-deprecated-delete-${row.name}`}
                  onclick={() => deleteDeprecated(row)}
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
    Something went wrong when loading {kindLabel} configuration.
  </ErrorAlert>
{/await}
