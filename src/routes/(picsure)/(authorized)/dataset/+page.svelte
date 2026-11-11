<script lang="ts">
  import { resolve } from '$app/paths';
  import { goto } from '$app/navigation';

  import { config } from '#lib/config/config.svelte.ts';
  import { datasets } from '#lib/datasets/datasets.svelte.ts';
  import type { DataSet } from '#lib/api/picsure/datasets.ts';

  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';
  import Content from '#lib/shell/Content.svelte';
  import ClientTable from '#lib/ui/datatable/ClientTable.svelte';
  import type { Column } from '#lib/ui/datatable/types.ts';
  import CopyButtonCell from '#lib/datasets/components/cells/CopyButtonCell.svelte';
  import Actions from '#lib/datasets/components/cells/Actions.svelte';
  import Loading from '#lib/ui/Loading.svelte';
  import Button from '#lib/ui/Button.svelte';

  const columns: Column<DataSet>[] = [
    { dataElement: 'name', label: 'Dataset ID Name' },
    { dataElement: 'startTime', label: 'Created', sort: true },
    { dataElement: 'queryId', label: 'Dataset ID', cell: queryId },
    { dataElement: 'uuid', label: 'Actions', class: 'text-center', cell: actions },
  ];

  const rowClickHandler = ({ uuid }: DataSet) => {
    goto(resolve('/(picsure)/(authorized)/dataset/[uuid]', { uuid }));
  };
</script>

{#snippet queryId(row: DataSet)}
  <CopyButtonCell value={row.queryId} />
{/snippet}

{#snippet actions(row: DataSet)}
  <Actions uuid={row.uuid} archived={row.archived} />
{/snippet}

<svelte:head>
  <title>{config.branding.applicationName} | Datasets</title>
</svelte:head>

<Content title="Manage Datasets">
  {#await datasets.load()}
    <Loading />
  {:then}
    <ClientTable
      isClickable
      searchable
      tableName="ActiveDatasets"
      data-testid="dataset-active-table"
      id="dataset-active-table"
      title="Active Datasets"
      rows={datasets.active}
      {rowClickHandler}
      rowClickKeys={['v']}
      {columns}
    />
    {#if datasets.showArchived}
      <ClientTable
        isClickable
        searchable
        tableName="ArchivedDatasets"
        data-testid="dataset-archived-table"
        id="dataset-archived-table"
        title="Deleted Datasets"
        rows={datasets.archived}
        {rowClickHandler}
        rowClickKeys={['v']}
        {columns}
      />
    {/if}
    <Button
      data-testid="dataset-toggle-archive"
      variant="filled-secondary"
      onclick={datasets.toggleShowArchived}
      >{datasets.showArchived ? 'Hide' : 'Show'} deleted datasets</Button
    >
  {:catch}
    <ErrorAlert title="API Error">Something went wrong when sending your request.</ErrorAlert>
  {/await}
</Content>
