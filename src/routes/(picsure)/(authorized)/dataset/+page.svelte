<script lang="ts">
  import { ProgressBar } from '@skeletonlabs/skeleton';

  import type { Indexable } from '$lib/types';
  import DataSetStore from '$lib/stores/Dataset';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import Content from '$lib/components/Content.svelte';
  import Datatable from '$lib/components/datatable/Table.svelte';
  import CopyButtonCell from '$lib/components/dataset/cell/CopyButtonCell.svelte';
  import Actions from '$lib/components/dataset/cell/Actions.svelte';
  import { branding } from '$lib/configuration';

  const columns = [
    { dataElement: 'name', label: 'Dataset ID Name' },
    { dataElement: 'startTime', label: 'Created' },
    { dataElement: 'queryId', label: 'Dataset ID' },
    { dataElement: 'uuid', label: 'Actions' },
  ];

  const cellOverides: Indexable = {
    queryId: CopyButtonCell,
    uuid: Actions,
  };

  let { active, archived, loadDatasets } = DataSetStore;

  let displayArchived = false;

  const rowClickHandler = () => {
    console.error('Function not implemented.');
    // const uuid = row?.uuid;
    // goto(`/dataset/${uuid}`);
  };
</script>

<svelte:head>
  <title>{branding.applicationName} | Datasets</title>
</svelte:head>

<Content title="Manage Datasets">
  {#await loadDatasets()}
    <h3 class="text-left">Loading</h3>
    <ProgressBar animIndeterminate="anim-progress-bar" />
  {:then}
    <Datatable
      tableName="ActiveDatasets"
      title="Active Datasets"
      data={$active}
      {columns}
      {cellOverides}
      {rowClickHandler}
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
      class="btn bg-secondary-500 text-on-secondary-token"
      on:click={() => (displayArchived = !displayArchived)}
      >{displayArchived ? 'Hide' : 'Show'} deleted datasets</button
    >
  {:catch}
    <ErrorAlert title="API Error">
      <p>Something went wrong when sending your request.</p>
    </ErrorAlert>
  {/await}
</Content>
