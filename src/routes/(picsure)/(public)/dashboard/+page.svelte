<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import type { Unsubscriber } from 'svelte/store';

  import { config } from '#lib/config/config.svelte.ts';
  import Content from '#lib/shell/Content.svelte';
  import Datatable from '#lib/ui/datatable/StaticTable.svelte';
  import DashboardLink from './DashboardLink.svelte';
  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';

  import { columns, loadDashboardData, rows } from './dashboard.ts';

  import type { Column } from '#lib/ui/datatable/types.ts';
  import { type DashboardRow, activeRow } from './dashboard.ts';
  import { open } from '#lib/ui/dialog/drawer.ts';
  import Loading from '#lib/ui/Loading.svelte';

  import { subscribeOnChange } from '#lib/utils/subscribers.ts';
  import { log, createLog } from '#lib/telemetry/logger.ts';

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
    unsubColumns = subscribeOnChange(columns, (newCols) => (currentColumns = newCols));
    unsubRows = subscribeOnChange(rows, (newRows) => (currentRows = newRows));
  });

  onDestroy(() => {
    unsubColumns && unsubColumns();
    unsubRows && unsubRows();
  });

  function rowClickHandler(row: DashboardRow) {
    log(createLog('ACTION', 'dashboard.row_click', { dataset: row.dataset_id, name: row.name }));
    $activeRow = row;
    $open = true;
  }
</script>

<svelte:head>
  <title>{config.branding.applicationName}</title>
</svelte:head>
<Content title="Data Dashboard" class="content-center" full>
  <section id="dashboard-data" class="">
    {#await dataLoadPromise}
      <Loading />
    {:then}
      <Datatable
        {tableName}
        data-testid="dashboard-table"
        id="dashboard-table"
        ariaLabel="Data dashboard"
        data={currentRows}
        columns={currentColumns}
        {cellOverides}
        showPagination={false}
        searchable={false}
        stickyHeader
        rowClickHandler={config.features.dashboardDrawer ? rowClickHandler : undefined}
        isClickable={config.features.dashboardDrawer}
      />
    {:catch}
      <ErrorAlert title="An Error Occured">
        We're having trouble fetching the data dashboard items right now. Please try again later.
      </ErrorAlert>
    {/await}
  </section>
</Content>
