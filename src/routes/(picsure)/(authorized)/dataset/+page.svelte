<script lang="ts">
  import { goto } from '$app/navigation';

  import type { Indexable } from '$lib/types';
  import { branding } from '$lib/configuration';
  import {
    active,
    archived,
    loadDatasets,
    getShowArchived,
    toggleShowArchived,
  } from '$lib/stores/Dataset.svelte';

  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import Content from '$lib/components/Content.svelte';
  import Datatable from '$lib/components/datatable/StaticTable.svelte';
  import CopyButtonCell from '$lib/components/dataset/cell/CopyButtonCell.svelte';
  import Actions from '$lib/components/dataset/cell/Actions.svelte';
  import Loading from '$lib/components/Loading.svelte';

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
    goto(`/dataset/${uuid}`);
  };
</script>

<svelte:head>
  <title>{branding.applicationName} | Datasets</title>
</svelte:head>

<Content title="Manage Datasets">
  {#await loadDatasets()}
    <Loading />
  {:then}
    <Datatable
      isClickable
      searchable
      tableName="ActiveDatasets"
      title="Active Datasets"
      data={$active}
      {rowClickHandler}
      {columns}
      {cellOverides}
    />
    {#if getShowArchived()}
      <Datatable
        isClickable
        searchable
        tableName="ArchivedDatasets"
        title="Deleted Datasets"
        data={$archived}
        {rowClickHandler}
        {columns}
        {cellOverides}
      />
    {/if}
    <button
      data-testid="dataset-toggle-archive"
      type="button"
      class="btn bg-secondary-500 text-secondary-contrast-500"
      onclick={() => toggleShowArchived()}
      >{getShowArchived() ? 'Hide' : 'Show'} deleted datasets</button
    >
  {:catch}
    <ErrorAlert title="API Error">Something went wrong when sending your request.</ErrorAlert>
  {/await}
</Content>
