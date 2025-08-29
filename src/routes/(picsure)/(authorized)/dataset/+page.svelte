<script lang="ts">
  import type { Indexable } from '$lib/types';
  import { branding } from '$lib/stores/Configuration';
  import { active, archived, loadDatasets } from '$lib/stores/Dataset';

  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import Content from '$lib/components/Content.svelte';
  import Datatable from '$lib/components/datatable/StaticTable.svelte';
  import CopyButtonCell from '$lib/components/dataset/cell/CopyButtonCell.svelte';
  import Actions from '$lib/components/dataset/cell/Actions.svelte';
  import Loading from '$lib/components/Loading.svelte';

  const columns = [
    { dataElement: 'name', label: 'Dataset ID Name' },
    { dataElement: 'startTime', label: 'Created' },
    { dataElement: 'queryId', label: 'Dataset ID' },
    { dataElement: 'uuid', label: 'Actions', class: 'text-center' },
  ];

  const cellOverides: Indexable = {
    queryId: CopyButtonCell,
    uuid: Actions,
  };

  let displayArchived = $state(false);
</script>

<svelte:head>
  <title>{$branding.applicationName} | Datasets</title>
</svelte:head>

<Content title="Manage Datasets">
  {#await loadDatasets()}
    <Loading />
  {:then}
    <Datatable
      tableName="ActiveDatasets"
      title="Active Datasets"
      data={$active}
      {columns}
      {cellOverides}
    />
    {#if displayArchived}
      <Datatable
        tableName="ArchivedDatasets"
        title="Deleted Datasets"
        data={$archived}
        {columns}
        {cellOverides}
      />
    {/if}
    <button
      data-testid="dataset-toggle-archive"
      type="button"
      class="btn bg-secondary-500 text-secondary-contrast-500"
      onclick={() => (displayArchived = !displayArchived)}
      >{displayArchived ? 'Hide' : 'Show'} deleted datasets</button
    >
  {:catch}
    <ErrorAlert title="API Error">Something went wrong when sending your request.</ErrorAlert>
  {/await}
</Content>
