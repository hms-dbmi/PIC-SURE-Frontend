<script lang="ts">
  import { untrack } from 'svelte';
  import { TableHandler, type State } from '@vincjo/datatables/server';

  import DataTable from '#lib/ui/datatable/DataTable.svelte';
  import type { Column } from '#lib/ui/datatable/types.ts';
  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';
  import ApiKeyStatus from '#lib/admin/apiKeys/cell/ApiKeyStatus.svelte';
  import ApiKeyActions from '#lib/admin/apiKeys/cell/ApiKeyActions.svelte';

  import { apiKeys } from '#lib/admin/apiKeys/apiKeys.svelte.ts';
  import {
    getApiKeyStatus,
    formatInstant,
    formatKeyPrefix,
    extractApiError,
    type ApiKeyType,
  } from '#lib/admin/apiKeys/model.ts';
  import { getDefaultRows } from '#lib/ui/datatable/rowsPerPage.ts';

  interface ApiKeyRow {
    uuid: string;
    prefix: string;
    name: string;
    email: string;
    created: string;
    expires: string;
    lastUsed: string;
    status: string;
  }

  const {
    keyType,
    tableName,
    id,
    'data-testid': testid,
  }: { keyType: ApiKeyType; tableName: string; id?: string; 'data-testid'?: string } = $props();

  let loadError = $state('');

  const columns: Column<ApiKeyRow>[] = [
    { dataElement: 'prefix', label: 'Key' },
    { dataElement: 'name', label: 'Name' },
    { dataElement: 'email', label: 'Email' },
    { dataElement: 'created', label: 'Created' },
    { dataElement: 'expires', label: 'Expires' },
    { dataElement: 'lastUsed', label: 'Last Used' },
    { dataElement: 'status', label: 'Status', class: 'w-24 text-center', cell: status },
    { dataElement: 'uuid', label: 'Actions', class: 'w-32 text-center', cell: actions },
  ];

  // tableName is a constant per instance; read it once for the initial page size
  const handler = new TableHandler<ApiKeyRow>([], {
    rowsPerPage: untrack(() => getDefaultRows(tableName)),
  });

  handler.load(async (state: State) => {
    try {
      loadError = '';
      const page = await apiKeys.list(state.currentPage - 1, state.rowsPerPage, keyType);
      state.setTotalRows(page.totalCount);
      return page.keys.map(
        (key): ApiKeyRow => ({
          uuid: key.uuid,
          prefix: formatKeyPrefix(key.keyType, key.displayPrefix),
          name: key.name || '',
          email: key.email || '',
          created: formatInstant(key.createdAt),
          expires: formatInstant(key.expiresAt, 'Never'),
          lastUsed: formatInstant(key.lastUsedAt, 'Never'),
          status: getApiKeyStatus(key),
        }),
      );
    } catch (error) {
      loadError = extractApiError(error);
      state.setTotalRows(0);
      return [];
    }
  });

  // The table handler fetches pages itself: load the first one, and the current one again
  // after every mutation.
  $effect(() => {
    void apiKeys.version;
    untrack(() => handler.invalidate());
  });
</script>

{#snippet status(row: ApiKeyRow)}
  <ApiKeyStatus status={row.status} />
{/snippet}

{#snippet actions(row: ApiKeyRow)}
  <ApiKeyActions uuid={row.uuid} prefix={row.prefix} status={row.status} />
{/snippet}

{#if loadError}
  <ErrorAlert title="API Error" data-testid="admin-api-key-list-error">{loadError}</ErrorAlert>
{:else}
  <DataTable {tableName} {id} data-testid={testid} {handler} {columns} />
{/if}
