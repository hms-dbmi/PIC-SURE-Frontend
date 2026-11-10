<script lang="ts">
  import { onDestroy, onMount, untrack } from 'svelte';
  import { TableHandler, type State } from '@vincjo/datatables/server';

  import RemoteTable from '#lib/ui/datatable/RemoteTable.svelte';
  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';
  import ApiKeyStatus from '#lib/admin/apiKeys/cell/ApiKeyStatus.svelte';
  import ApiKeyActions from '#lib/admin/apiKeys/cell/ApiKeyActions.svelte';

  import { loadApiKeys, listVersion } from '#lib/admin/apiKeys/ApiKeys.ts';
  import {
    getApiKeyStatus,
    formatInstant,
    formatKeyPrefix,
    extractApiError,
    type ApiKeyType,
  } from '#lib/admin/apiKeys/model.ts';
  import { getDefaultRows } from '#lib/ui/datatable/rowsPerPage.ts';
  import { subscribeOnChange } from '#lib/utils/subscribers.ts';

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

  const columns = [
    { dataElement: 'prefix', label: 'Key' },
    { dataElement: 'name', label: 'Name' },
    { dataElement: 'email', label: 'Email' },
    { dataElement: 'created', label: 'Created' },
    { dataElement: 'expires', label: 'Expires' },
    { dataElement: 'lastUsed', label: 'Last Used' },
    { dataElement: 'status', label: 'Status', class: 'w-24 text-center' },
    { dataElement: 'uuid', label: 'Actions', class: 'w-32 text-center' },
  ];

  const cellOverides = {
    status: ApiKeyStatus,
    uuid: ApiKeyActions,
  };

  // tableName is a constant per instance; read it once for the initial page size
  const handler = new TableHandler<ApiKeyRow>([], {
    rowsPerPage: untrack(() => getDefaultRows(tableName)),
  });

  handler.load(async (state: State) => {
    try {
      loadError = '';
      const page = await loadApiKeys(state.currentPage - 1, state.rowsPerPage, keyType);
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

  onMount(() => {
    handler.invalidate();
  });
  const unsubscribe = subscribeOnChange(listVersion, () => handler.invalidate());
  onDestroy(unsubscribe);
</script>

{#if loadError}
  <ErrorAlert title="API Error" data-testid="admin-api-key-list-error">{loadError}</ErrorAlert>
{:else}
  <RemoteTable {tableName} {id} data-testid={testid} {handler} {columns} {cellOverides} />
{/if}
