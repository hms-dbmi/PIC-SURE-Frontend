<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import type { Unsubscriber } from 'svelte/store';

  import { ProgressBar } from '@skeletonlabs/skeleton';

  import { branding } from '$lib/configuration';
  import Content from '$lib/components/Content.svelte';
  import Datatable from '$lib/components/datatable/Table.svelte';
  import Link from '$lib/components/datatable/Link.svelte';

  import { columns, loadDashboardData, rows } from '$lib/stores/Dashboard.ts';

  import type { Column } from '$lib/models/Tables';

  const tableName = 'ExplorerTable';

  let unsubColumns: Unsubscriber;
  let unsubRows: Unsubscriber;

  let currentColumns: Column[] = [];
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  let currentRows: any[] = [];

  const cellOverides = {
    additional_info_link: Link,
  };

  const dataLoadPromise = loadDashboardData();

  onMount(() => {
    unsubColumns = columns.subscribe((newCols) => (currentColumns = newCols));
    unsubRows = rows.subscribe((newRows) => {
      currentRows = newRows;
    });
  });

  onDestroy(() => {
    unsubColumns && unsubColumns();
    unsubRows && unsubRows();
  });
</script>

<svelte:head>
  <title>{branding.applicationName}</title>
</svelte:head>
<Content title="Data Dashboard" class="content-center" full={true}>
  <section id="data-container" class="">
    {#await dataLoadPromise}
      <ProgressBar animIndeterminate="anim-progress-bar" />
    {:then}
      <Datatable
        {tableName}
        data={currentRows}
        columns={currentColumns}
        {cellOverides}
        search={true}
      />
    {/await}
  </section>
</Content>
