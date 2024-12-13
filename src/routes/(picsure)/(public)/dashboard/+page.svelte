<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import type { Unsubscriber } from 'svelte/store';

  import { ProgressBar } from '@skeletonlabs/skeleton';

  import { branding, features } from '$lib/configuration';
  import Content from '$lib/components/Content.svelte';
  import Datatable from '$lib/components/datatable/Table.svelte';
  import DashboardLink from '$lib/components/datatable/DashboardLink.svelte';

  import { columns, loadDashboardData, rows } from '$lib/stores/Dashboard.ts';

  import type { Column } from '$lib/models/Tables';
  import type { DashboardRow } from '$lib/stores/Dashboard';

  import { getDrawerStore } from '@skeletonlabs/skeleton';

  const drawerStore = getDrawerStore();

  const tableName = 'ExplorerTable';

  let unsubColumns: Unsubscriber;
  let unsubRows: Unsubscriber;

  let currentColumns: Column[] = [];
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  let currentRows: DashboardRow[] = [];

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
    drawerStore.open({
      id: 'dashboard-drawer',
      meta: { row },
    });
  }
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
        defaultRowsPerPage={currentRows.length}
        search={false}
        showPagination={false}
        stickyHeader={true}
        rowClickHandler={features.dashboardDrawer ? rowClickHandler : undefined}
        isClickable={features.dashboardDrawer}
      />
    {/await}
  </section>
</Content>
