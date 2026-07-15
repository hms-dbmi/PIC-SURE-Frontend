<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { TableHandler, type State } from '@vincjo/datatables/server';

  import RemoteTable from '$lib/components/datatable/RemoteTable.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import ApiKeyStatus from '$lib/components/admin/api-key/cell/ApiKeyStatus.svelte';
  import ApiKeyType from '$lib/components/admin/api-key/cell/ApiKeyType.svelte';
  import ApiKeyActions from '$lib/components/admin/api-key/cell/ApiKeyActions.svelte';

  import { loadApiKeys, listVersion } from '$lib/stores/ApiKeys';
  import { getApiKeyStatus, formatInstant, extractApiError } from '$lib/models/ApiKey';
  import { getDefaultRows } from '$lib/components/datatable/stores';
  import { subscribeOnChange } from '$lib/utilities/Subscribers';

  interface ApiKeyRow {
    uuid: string;
    prefix: string;
    keyType: string;
    name: string;
    email: string;
    created: string;
    expires: string;
    lastUsed: string;
    status: string;
  }

  let loadError = $state('');

  const columns = [
    { dataElement: 'prefix', label: 'Key' },
    { dataElement: 'keyType', label: 'Type', class: 'w-28' },
    { dataElement: 'name', label: 'Name' },
    { dataElement: 'email', label: 'Email' },
    { dataElement: 'created', label: 'Created' },
    { dataElement: 'expires', label: 'Expires' },
    { dataElement: 'lastUsed', label: 'Last Used' },
    { dataElement: 'status', label: 'Status', class: 'w-24 text-center' },
    { dataElement: 'uuid', label: 'Actions', class: 'w-32 text-center' },
  ];

  const cellOverides = {
    keyType: ApiKeyType,
    status: ApiKeyStatus,
    uuid: ApiKeyActions,
  };

  const handler = new TableHandler<ApiKeyRow>([], { rowsPerPage: getDefaultRows('ApiKeys') });

  handler.load(async (state: State) => {
    try {
      loadError = '';
      const page = await loadApiKeys(state.currentPage - 1, state.rowsPerPage);
      state.setTotalRows(page.totalCount);
      return page.keys.map(
        (key): ApiKeyRow => ({
          uuid: key.uuid,
          prefix: `picsure_${key.displayPrefix}…`,
          keyType: key.keyType,
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
  <RemoteTable tableName="ApiKeys" {handler} {columns} {cellOverides} tableAuto={false} />
{/if}
