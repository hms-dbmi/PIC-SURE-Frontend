<script lang="ts">
  import { goto } from '$app/navigation';

  import type { Indexable } from '$lib/types';
  import { branding, features } from '$lib/stores/Configuration';

  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import Content from '$lib/components/Content.svelte';
  import Datatable from '$lib/components/datatable/StaticTable.svelte';
  import RoleActions from '$lib/components/admin/configuration/cell/RoleActions.svelte';
  import PrivilegeActions from '$lib/components/admin/configuration/cell/PrivilegeActions.svelte';
  import ConnectionActions from '$lib/components/admin/configuration/cell/ConnectionActions.svelte';
  import Application from '$lib/components/admin/configuration/cell/Application.svelte';
  import RequiredFields from '$lib/components/admin/configuration/cell/RequiredFields.svelte';

  import { privileges, loadPrivileges } from '$lib/stores/Privileges';
  import { roles, loadRoles } from '$lib/stores/Roles';
  import { loadApplications } from '$lib/stores/Application';
  import { connections, loadConnections } from '$lib/stores/Connections';
  import { isTopAdmin } from '$lib/stores/User';

  import Loading from '$lib/components/Loading.svelte';

  const roleTable = {
    columns: [
      { dataElement: 'name', label: 'Name', sort: true },
      { dataElement: 'description', label: 'Description', sort: true },
      { dataElement: 'uuid', label: 'Actions', class: 'text-center' },
    ],
    overrides: { uuid: RoleActions },
  };

  const privilegesTable = {
    columns: [
      { dataElement: 'name', label: 'Name', sort: true },
      { dataElement: 'description', label: 'Description', sort: true },
      { dataElement: 'application', label: 'Application Name', sort: true },
      { dataElement: 'uuid', label: 'Actions', class: 'text-center' },
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
      { dataElement: 'requiredFields', label: 'Required fields' },
      { dataElement: 'uuid', label: 'Actions', class: 'text-center' },
    ],
    overrides: {
      uuid: ConnectionActions,
      requiredFields: RequiredFields,
    },
  };

  async function loadAppsAndPriv() {
    await loadPrivileges();
    await loadApplications();
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
  <title>{$branding.applicationName} | Configuration</title>
</svelte:head>

<Content title="Configuration">
  {#if !$isTopAdmin}
    <ErrorAlert title="Top Administrator Only" color="warning">
      <p>
        Configurations are READ ONLY for admin users. Please contact your administrator to make
        changes.
      </p>
    </ErrorAlert>
  {/if}
  <div id="role-table" class="mb-10">
    <h2>Roles Management</h2>
    {#await loadRoles()}
      <Loading />
    {:then}
      <div class="flex gap-4 my-6">
        <div class="flex-auto">
          <a
            data-testid="add-role"
            class="btn preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500 {!$isTopAdmin
              ? 'opacity-50 pointer-events-none'
              : ''}"
            href="/admin/configuration/role/new"
          >
            + Add Role
          </a>
        </div>
      </div>
      <Datatable
        tableName="Roles"
        data={$roles}
        columns={roleTable.columns}
        cellOverides={roleTable.overrides}
        rowClickHandler={roleRowCLick}
        isClickable
      />
    {:catch}
      <ErrorAlert title="API Error">
        Something went wrong when sending your request for roles.
      </ErrorAlert>
    {/await}
  </div>
  <div id="privilege-table" class="mb-10">
    <h2>Privileges Management</h2>
    {#await loadAppsAndPriv()}
      <Loading />
    {:then}
      <div class="flex gap-4 my-6">
        <div class="flex-auto">
          <a
            data-testid="add-privilege"
            class="btn preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500 {!$isTopAdmin
              ? 'opacity-50 pointer-events-none'
              : ''}"
            href="/admin/configuration/privilege/new"
          >
            + Add Privilege
          </a>
        </div>
      </div>
      <Datatable
        tableName="Privileges"
        data={$privileges}
        columns={privilegesTable.columns}
        cellOverides={privilegesTable.overrides}
        rowClickHandler={privilegeRowClick}
        isClickable
      />
    {:catch}
      <ErrorAlert title="API Error">
        Something went wrong when sending your request for priviledges and applications.
      </ErrorAlert>
    {/await}
  </div>
  <div id="connection-table" class="mb-10">
    <h2>Connections Management</h2>
    {#await loadConnections()}
      <Loading />
    {:then}
      <div class="flex gap-4 my-6">
        <div class="flex-auto">
          <a
            data-testid="add-connection"
            class="btn preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500 {!$isTopAdmin
              ? 'opacity-50 pointer-events-none'
              : ''}"
            href="/admin/configuration/connection/new"
          >
            + Add Connection
          </a>
        </div>
      </div>
      <Datatable
        tableName="Connections"
        data={$connections}
        columns={connectionTable.columns}
        cellOverides={connectionTable.overrides}
        rowClickHandler={connectionRowClick}
        isClickable
      />
    {:catch}
      <ErrorAlert title="API Error">
        Something went wrong when sending your request for connections.
      </ErrorAlert>
    {/await}
  </div>
  {#if $features.termsOfService}
    <div id="misc-configs">
      <a
        href="/admin/configuration/terms/edit"
        class="btn preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500"
        >Update Terms of Service</a
      >
    </div>
  {/if}
</Content>
