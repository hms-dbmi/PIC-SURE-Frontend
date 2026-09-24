<script lang="ts">
  import { onDestroy, onMount, untrack } from 'svelte';
  import { TableHandler, type State } from '@vincjo/datatables/server';

  import RemoteTable from '$lib/components/datatable/RemoteTable.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import ApiKeyStatus from '$lib/components/admin/api-key/cell/ApiKeyStatus.svelte';
  import ApiKeyActions from '$lib/components/admin/api-key/cell/ApiKeyActions.svelte';

  import { loadApiKeys, listVersion } from '$lib/stores/ApiKeys';
  import { getApiKeyStatus, formatInstant, extractApiError } from '$lib/models/ApiKey';
  import { getDefaultRows } from '$lib/components/datatable/stores';
  import { subscribeOnChange } from '$lib/utilities/Subscribers';

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

  const { keyType, tableName }: { keyType: 'USER' | 'PLATFORM'; tableName: string } = $props();

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
          prefix: `picsure_${key.displayPrefix}…`,
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
  <ErrorAlert title="API Error" data-testid="api-key-list-error">{loadError}</ErrorAlert>
{:else}
  <RemoteTable {tableName} {handler} {columns} {cellOverides} tableAuto={false} />
{/if}
