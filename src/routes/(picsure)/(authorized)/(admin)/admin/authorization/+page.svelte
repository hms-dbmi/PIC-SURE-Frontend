<script lang="ts">
  import { ProgressBar } from '@skeletonlabs/skeleton';

  import { branding } from '$lib/configuration';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import Content from '$lib/components/Content.svelte';
  import Datatable from '$lib/components/datatable/Table.svelte';
  import RoleActions from '$lib/components/admin/authorization/cell/RoleActions.svelte';
  import PrivilegeActions from '$lib/components/admin/authorization/cell/PrivilegeActions.svelte';
  import Application from '$lib/components/admin/authorization/cell/Application.svelte';

  import PrivilegesStore from '$lib/stores/Privileges';
  import RolesStore from '$lib/stores/Roles';
  import ApplicationStore from '$lib/stores/Application';

  const { roles, loadRoles } = RolesStore;
  const { privileges, loadPrivileges } = PrivilegesStore;
  const { loadApplications } = ApplicationStore;

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

  async function load() {
    await loadRoles();
    await loadPrivileges();
    await loadApplications();
  }
</script>

<svelte:head>
  <title>{branding.applicationName} | Authorization</title>
</svelte:head>

<Content title="Authorization">
  {#await load()}
    <h3 class="text-left">Loading</h3>
    <ProgressBar animIndeterminate="anim-progress-bar" />
  {:then}
    <div id="authorization-role-table" class="mb-10">
      <h2>Roles Management</h2>
      <div class="flex gap-4 my-6">
        <div class="flex-auto">
          <a
            data-testid="add-role"
            class="btn variant-ghost-primary hover:variant-filled-primary"
            href="/admin/authorization/role/new"
          >
            &plus; Add Role
          </a>
        </div>
      </div>
      <Datatable
        data={$roles}
        columns={roleTable.columns}
        cellOverides={roleTable.overrides}
        defaultRowsPerPage={10}
      />
    </div>
    <div id="authorization-privilege-table" class="mb-10">
      <h2>Privileges Management</h2>
      <div class="flex gap-4 my-6">
        <div class="flex-auto">
          <a
            data-testid="add-privilege"
            class="btn variant-ghost-primary hover:variant-filled-primary"
            href="/admin/authorization/privilege/new"
          >
            &plus; Add Privilege
          </a>
        </div>
      </div>
      <Datatable
        data={$privileges}
        columns={privilegesTable.columns}
        cellOverides={privilegesTable.overrides}
        defaultRowsPerPage={10}
      />
    </div>
  {:catch}
    <ErrorAlert title="API Error">
      <p>Something went wrong when sending your request.</p>
    </ErrorAlert>
  {/await}
</Content>
