<script lang="ts">
  import { resolve } from '$app/paths';
  import { goto } from '$app/navigation';

  import type { Indexable } from '#lib/utils/objects.ts';
  import { config } from '#lib/config/config.svelte.ts';
  import { datasets } from '#lib/datasets/datasets.svelte.ts';

  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';
  import Content from '#lib/shell/Content.svelte';
  import Datatable from '#lib/ui/datatable/StaticTable.svelte';
  import CopyButtonCell from '#lib/datasets/components/cells/CopyButtonCell.svelte';
  import Actions from '#lib/datasets/components/cells/Actions.svelte';
  import Loading from '#lib/ui/Loading.svelte';
  import Button from '#lib/ui/Button.svelte';

  const columns = [
    { dataElement: 'name', label: 'Dataset ID Name' },
    { dataElement: 'startTime', label: 'Created', sort: true },
    { dataElement: 'queryId', label: 'Dataset ID' },
    { dataElement: 'uuid', label: 'Actions', class: 'text-center' },
  ];

  const cellOverides: Indexable = {
    queryId: CopyButtonCell,
    uuid: Actions,
  };

  const rowClickHandler = (row: Indexable) => {
    const uuid = row?.uuid;
    goto(resolve(`dataset/${uuid}`));
  };
</script>

<svelte:head>
  <title>{config.branding.applicationName} | Datasets</title>
</svelte:head>

<Content title="Manage Datasets">
  {#await datasets.load()}
    <Loading />
  {:then}
    <Datatable
      isClickable
      searchable
      tableName="ActiveDatasets"
      data-testid="dataset-active-table"
      id="dataset-active-table"
      title="Active Datasets"
      data={datasets.active}
      {rowClickHandler}
      rowClickKeys={['v']}
      {columns}
      {cellOverides}
    />
    {#if datasets.showArchived}
      <Datatable
        isClickable
        searchable
        tableName="ArchivedDatasets"
        data-testid="dataset-archived-table"
        id="dataset-archived-table"
        title="Deleted Datasets"
        data={datasets.archived}
        {rowClickHandler}
        rowClickKeys={['v']}
        {columns}
        {cellOverides}
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
