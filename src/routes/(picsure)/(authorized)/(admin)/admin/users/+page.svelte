<script lang="ts">
  import { derived, readable, type Readable } from 'svelte/store';

  import { goto } from '$app/navigation';

  import type { Indexable } from '$lib/types';
  import { branding } from '$lib/configuration';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import Content from '$lib/components/Content.svelte';
  import Datatable from '$lib/components/datatable/StaticTable.svelte';
  import Actions from '$lib/components/admin/user/cell/Actions.svelte';
  import Status from '$lib/components/admin/user/cell/Status.svelte';

  import UsersStore from '$lib/stores/Users';
  import RolesStore from '$lib/stores/Roles';
  import ConnectionStore from '$lib/stores/Connections';
  import Loading from '$lib/components/Loading.svelte';

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

  let usersByConnection: Readable<Connection[]> = $state(readable([]));

  const columns = [
    { dataElement: 'email', label: 'Username', sort: true, class: 'w-1/3' },
    { dataElement: 'roles', label: 'Role(s)', sort: true, class: 'normal-case!' },
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
  {#await load()}<Loading />{:then}
    <div class="flex gap-4 mb-6">
      <div class="flex-auto">
        <a
          data-testid="add-user-btn"
          class="btn preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500"
          href="/admin/users/new"
        >
          + Add User
        </a>
      </div>
    </div>
    {#each $usersByConnection as connection}
      <div id={`user-table-${connection.label.replaceAll(' ', '_')}`} class="mb-10">
        <Datatable
          tableName="Users-{connection.label}"
          data={connection.users}
          {columns}
          {cellOverides}
          title={connection.label}
          {rowClickHandler}
          isClickable
          searchable
          tableAuto={false}
        />
      </div>
    {/each}
  {:catch}
    <ErrorAlert title="API Error">Something went wrong when sending your request.</ErrorAlert>
  {/await}
</Content>
