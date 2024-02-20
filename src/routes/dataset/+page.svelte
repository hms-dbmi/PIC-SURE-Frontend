<script lang="ts">
  import { ProgressBar } from '@skeletonlabs/skeleton';
  import type { Indexable } from '$lib/types';
  import DataSetStore from '$lib/stores/dataset';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import Content from '$lib/components/Content.svelte';
  import Datatable from '$lib/components/datatable/Table.svelte';
  import CopyButton from '$lib/components/dataset/cell/CopyButtonCell.svelte';
  import Actions from '$lib/components/dataset/cell/Actions.svelte';

  const columns = [
    { dataElement: 'name', label: 'Dataset ID Name' },
    { dataElement: 'startTime', label: 'Created' },
    { dataElement: 'queryId', label: 'Query ID' },
    { dataElement: 'uuid', label: 'Actions' },
  ];

  const cellOverides: Indexable = {
    queryId: CopyButton,
    uuid: Actions,
  };

  let { active, archived, loadDatasets } = DataSetStore;

  let displayArchived = false;
</script>

<Content title="Dataset Management">
  {#await loadDatasets()}
    <h3 class="text-left">Loading</h3>
    <ProgressBar animIndeterminate="anim-progress-bar" />
  {:then}
    <h3 class="text-left">Active Datasets</h3>
    <Datatable data={$active} {columns} {cellOverides} />
    {#if displayArchived}
      <h3 class="text-left mt-5">Archived Datasets</h3>
      <Datatable data={$archived} {columns} {cellOverides} />
    {/if}
    <button
      data-testid="dataset-toggle-archive"
      type="button"
      class="btn bg-secondary-500 text-on-secondary-token"
      on:click={() => (displayArchived = !displayArchived)}
      >{displayArchived ? 'Exclude' : 'Include'} archived Dataset IDs</button
    >
  {:catch}
    <ErrorAlert title="API Error">
      <p>Something went wrong when sending your request.</p>
    </ErrorAlert>
  {/await}
</Content>
