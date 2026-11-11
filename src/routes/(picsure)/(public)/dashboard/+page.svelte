<script lang="ts">
  import { config } from '#lib/config/config.svelte.ts';
  import Content from '#lib/shell/Content.svelte';
  import ClientTable from '#lib/ui/datatable/ClientTable.svelte';
  import DashboardLink from './DashboardLink.svelte';
  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';

  import { Dashboard, type DashboardRow } from './dashboard.svelte.ts';
  import Drawer from '#lib/ui/dialog/Drawer.svelte';
  import DashboardDrawer from './DashboardDrawer.svelte';
  import Loading from '#lib/ui/Loading.svelte';

  import { log, createLog } from '#lib/telemetry/logger.ts';

  const tableName = 'ExplorerTable';

  const dashboard = new Dashboard();
  const columns = $derived(
    dashboard.columns.map((column) =>
      column.dataElement === 'additional_info_link' ? { ...column, cell: moreInfo } : column,
    ),
  );
  const dataLoadPromise = dashboard.load();

  let drawerOpen = $state(false);
  let activeRow: DashboardRow = $state.raw({});

  function rowClickHandler(row: DashboardRow) {
    log(createLog('ACTION', 'dashboard.row_click', { dataset: row.dataset_id, name: row.name }));
    activeRow = row;
    drawerOpen = true;
  }
</script>

{#snippet moreInfo(row: DashboardRow)}
  <DashboardLink {row} />
{/snippet}

<svelte:head>
  <title>{config.branding.applicationName}</title>
</svelte:head>
<Content title="Data Dashboard" class="content-center" full>
  <section id="dashboard-data" class="">
    {#await dataLoadPromise}
      <Loading />
    {:then}
      <ClientTable
        {tableName}
        data-testid="dashboard-table"
        id="dashboard-table"
        ariaLabel="Data dashboard"
        rows={dashboard.rows}
        {columns}
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
<Drawer bind:open={drawerOpen} size="half" aria-label="Dataset details">
  <DashboardDrawer row={activeRow} />
</Drawer>
