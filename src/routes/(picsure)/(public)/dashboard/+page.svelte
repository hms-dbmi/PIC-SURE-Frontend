<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import type { Unsubscriber } from 'svelte/store';

  import { branding, features } from '$lib/stores/Configuration';
  import Content from '$lib/components/Content.svelte';
  import Datatable from '$lib/components/datatable/StaticTable.svelte';
  import DashboardLink from '$lib/components/dashboard/DashboardLink.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';

  import { columns, loadDashboardData, rows } from '$lib/stores/Dashboard.ts';

  import type { Column } from '$lib/components/datatable/types';
  import { type DashboardRow, activeRow } from '$lib/stores/Dashboard';
  import { open } from '$lib/stores/Drawer';
  import Loading from '$lib/components/Loading.svelte';

  const tableName = 'ExplorerTable';

  let unsubColumns: Unsubscriber;
  let unsubRows: Unsubscriber;

  let currentColumns: Column[] = $state([]);
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  let currentRows: DashboardRow[] = $state([]);

  const cellOverides = {
    additional_info_link: DashboardLink,
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

  function rowClickHandler(row: DashboardRow) {
    $activeRow = row;
    $open = true;
  }
</script>

<svelte:head>
  <title>{$branding.applicationName}</title>
</svelte:head>
<Content title="Data Dashboard" class="content-center" full>
  <section id="data-container" class="">
    {#await dataLoadPromise}
      <Loading />
    {:then}
      <Datatable
        {tableName}
        data={currentRows}
        columns={currentColumns}
        {cellOverides}
        showPagination={false}
        searchable={false}
        stickyHeader
        rowClickHandler={$features.dashboardDrawer ? rowClickHandler : undefined}
        isClickable={$features.dashboardDrawer}
      />
    {:catch}
      <ErrorAlert title="An Error Occured">
        We're having trouble fetching the data dashboard items right now. Please try again later.
      </ErrorAlert>
    {/await}
  </section>
</Content>
