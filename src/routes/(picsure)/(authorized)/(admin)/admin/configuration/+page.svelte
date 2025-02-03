<script lang="ts">
  import { ProgressBar } from '@skeletonlabs/skeleton';

  import { goto } from '$app/navigation';

  import type { Indexable } from '$lib/types';
  import { branding } from '$lib/configuration';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import Content from '$lib/components/Content.svelte';
  import Datatable from '$lib/components/datatable/Table.svelte';
  import RoleActions from '$lib/components/admin/configuration/cell/RoleActions.svelte';
  import PrivilegeActions from '$lib/components/admin/configuration/cell/PrivilegeActions.svelte';
  import ConnectionActions from '$lib/components/admin/configuration/cell/ConnectionActions.svelte';
  import Application from '$lib/components/admin/configuration/cell/Application.svelte';

  import { privileges, loadPrivileges } from '$lib/stores/Privileges';
  import { roles, loadRoles } from '$lib/stores/Roles';
  import { loadApplications } from '$lib/stores/Application';
  import { connections, loadConnections } from '$lib/stores/Connections';

  const roleTable = {
    columns: [
      { dataElement: 'name', label: 'Name', sort: true },
      { dataElement: 'description', label: 'Description', sort: true },
      { dataElement: 'uuid', label: 'Actions' },
    ],
    overrides: { uuid: RoleActions },
  };

  const privilegesTable = {
    columns: [
      { dataElement: 'name', label: 'Name', sort: true },
      { dataElement: 'description', label: 'Description', sort: true },
      { dataElement: 'application', label: 'Application Name', sort: true },
      { dataElement: 'uuid', label: 'Actions' },
    ],
    overrides: {
      uuid: PrivilegeActions,
      application: Application,
    },
  };

  const connectionTable = {
    columns: [
      { dataElement: 'label', label: 'Label', sort: true },
      { dataElement: 'id', label: 'ID', sort: true },
      { dataElement: 'subPrefix', label: 'Sub prefix', sort: true },
      { dataElement: 'requiredFields', label: 'Required fields', sort: true },
      { dataElement: 'uuid', label: 'Actions' },
    ],
    overrides: { uuid: ConnectionActions },
  };

  async function load() {
    await loadRoles();
    await loadPrivileges();
    await loadApplications();
    await loadConnections();
  }

  const rowClickHandler = (path: string) => (row: Indexable) => {
    const uuid = row?.uuid;
    goto(`/admin/configuration/${path}/${uuid}/edit`);
  };
  const roleRowCLick = rowClickHandler('role');
  const privilegeRowClick = rowClickHandler('privilege');
  const connectionRowClick = rowClickHandler('connection');
</script>

<svelte:head>
  <title>{branding.applicationName} | Configuration</title>
</svelte:head>

<Content title="Configuration">
  {#await load()}
    <h3 class="text-left">Loading</h3>
    <ProgressBar animIndeterminate="anim-progress-bar" />
  {:then}
    <div id="role-table" class="mb-10">
      <h2>Roles Management</h2>
      <div class="flex gap-4 my-6">
        <div class="flex-auto">
          <a
            data-testid="add-role"
            class="btn variant-ghost-primary hover:variant-filled-primary"
            href="/admin/configuration/role/new"
          >
            &plus; Add Role
          </a>
        </div>
      </div>
      <Datatable
        tableName="Roles"
        data={$roles}
        columns={roleTable.columns}
        cellOverides={roleTable.overrides}
        defaultRowsPerPage={10}
        rowClickHandler={roleRowCLick}
        isClickable={true}
      />
    </div>
    <div id="privilege-table" class="mb-10">
      <h2>Privileges Management</h2>
      <div class="flex gap-4 my-6">
        <div class="flex-auto">
          <a
            data-testid="add-privilege"
            class="btn variant-ghost-primary hover:variant-filled-primary"
            href="/admin/configuration/privilege/new"
          >
            &plus; Add Privilege
          </a>
        </div>
      </div>
      <Datatable
        tableName="Privileges"
        data={$privileges}
        columns={privilegesTable.columns}
        cellOverides={privilegesTable.overrides}
        defaultRowsPerPage={10}
        rowClickHandler={privilegeRowClick}
        isClickable={true}
      />
    </div>
    <div id="connection-table" class="mb-10">
      <h2>Connection Management</h2>
      <div class="flex gap-4 my-6">
        <div class="flex-auto">
          <a
            data-testid="add-connection"
            class="btn variant-ghost-primary hover:variant-filled-primary"
            href="/admin/configuration/connection/new"
          >
            &plus; Add Connection
          </a>
        </div>
      </div>
      <Datatable
        tableName="Connections"
        data={$connections}
        columns={connectionTable.columns}
        cellOverides={connectionTable.overrides}
        defaultRowsPerPage={10}
        rowClickHandler={connectionRowClick}
        isClickable={true}
      />
    </div>
  {:catch}
    <ErrorAlert title="API Error">
      <p>Something went wrong when sending your request.</p>
    </ErrorAlert>
  {/await}
</Content>
