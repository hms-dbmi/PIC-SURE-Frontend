<script lang="ts">
  import { derived, readable, type Readable } from 'svelte/store';
  import { ProgressBar } from '@skeletonlabs/skeleton';

  import { goto } from '$app/navigation';

  import type { Indexable } from '$lib/types';
  import { branding } from '$lib/configuration';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import Content from '$lib/components/Content.svelte';
  import Datatable from '$lib/components/datatable/Table.svelte';
  import Actions from '$lib/components/admin/user/cell/Actions.svelte';
  import Status from '$lib/components/admin/user/cell/Status.svelte';

  import UsersStore from '$lib/stores/Users';
  import RolesStore from '$lib/stores/Roles';
  import ConnectionStore from '$lib/stores/Connections';
  let { users, loadUsers } = UsersStore;
  let { connections, loadConnections } = ConnectionStore;
  let { roles, loadRoles } = RolesStore;

  interface UserRow {
    uuid: string;
    email: string;
    roles: string;
    status: string;
  }

  interface Connection {
    label: string;
    users: UserRow[];
  }

  let usersByConnection: Readable<Connection[]> = readable([]);

  const columns = [
    { dataElement: 'email', label: 'Username', sort: true, class: 'w-1/3' },
    { dataElement: 'roles', label: 'Role(s)', sort: true, class: '!normal-case' },
    { dataElement: 'status', label: 'Status', sort: true, class: 'w-24 text-center' },
    { dataElement: 'uuid', label: 'Actions', sort: false, class: 'w-24 text-center' },
  ];

  const cellOverides = {
    status: Status,
    uuid: Actions,
  };

  async function load() {
    await loadConnections();
    await loadRoles();
    await loadUsers();
    usersByConnection = derived([users, connections, roles], ([$u, $c, $r]) => {
      return $c.map((connection) => ({
        label: connection.label,
        users: $u
          .filter((user) => connection.uuid === user.connection)
          .map(
            (row): UserRow => ({
              uuid: row.uuid || '',
              email: row.email || 'uuid:' + row.uuid,
              roles:
                row.roles.length === 0
                  ? 'none'
                  : row.roles
                      .map((role: string) => $r.find((r) => r.uuid === role)?.name)
                      .sort()
                      .join(', '),
              status: row.active ? 'Active' : 'Inactive',
            }),
          )
          .sort((uA, uB) => uA.status.localeCompare(uB.status)),
      }));
    });
  }

  const rowClickHandler = (row: Indexable) => {
    const uuid = row?.uuid;
    goto(`/admin/users/${uuid}/edit`);
  };
</script>

<svelte:head>
  <title>{branding.applicationName} | Manage Users</title>
</svelte:head>
<Content title="Manage Users">
  {#await load()}
    <h3 class="text-left">Loading</h3>
    <ProgressBar animIndeterminate="anim-progress-bar" />
  {:then}
    <div class="flex gap-4 mb-6">
      <div class="flex-auto">
        <a
          data-testid="add-user-btn"
          class="btn variant-ghost-primary hover:variant-filled-primary"
          href="/admin/users/new"
        >
          &plus; Add User
        </a>
      </div>
    </div>
    {#each $usersByConnection as connection}
      <div id={`user-table-${connection.label.replaceAll(' ', '_')}`} class="mb-10">
        <Datatable
          tableName="Users"
          data={connection.users}
          {columns}
          {cellOverides}
          search={true}
          defaultRowsPerPage={10}
          title={connection.label}
          {rowClickHandler}
          isClickable={true}
          tableAuto={false}
        />
      </div>
    {/each}
  {:catch}
    <ErrorAlert title="API Error">
      <p>Something went wrong when sending your request.</p>
    </ErrorAlert>
  {/await}
</Content>
