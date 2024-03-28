<script lang="ts">
  import { derived, type Readable } from 'svelte/store';

  import { ProgressBar } from '@skeletonlabs/skeleton';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import Content from '$lib/components/Content.svelte';
  import Datatable from '$lib/components/datatable/Table.svelte';
  import Actions from '$lib/components/user/cell/Actions.svelte';
  import Status from '$lib/components/user/cell/Status.svelte';

  import UsersStore from '$lib/stores/Users';
  let { users, connections, getUsers, getConnections } = UsersStore;

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

  const usersByConnection: Readable<Connection[]> = derived([users, connections], ([$u, $c]) => {
    return $c.map((connection) => ({
      label: connection.label,
      users: $u
        .filter((user) => connection.id === user.connection.id)
        .map(
          (row): UserRow => ({
            uuid: row.uuid || '',
            email: row.email || '',
            roles: row.roles
              .map((role: { name: string }) => role.name)
              .sort()
              .join(', '),
            status: row.active ? 'Active' : 'Inactive',
          }),
        )
        .sort((uA, uB) => uA.status.localeCompare(uB.status)),
    }));
  });

  const columns = [
    { dataElement: 'email', label: 'Username', sort: true },
    { dataElement: 'roles', label: 'Role(s)', sort: true },
    { dataElement: 'status', label: 'Status', sort: true },
    { dataElement: 'uuid', label: 'Actions', sort: false },
  ];

  const cellOverides = {
    status: Status,
    uuid: Actions,
  };
</script>

<Content title="User Management">
  {#await Promise.all([getConnections(), getUsers()])}
    <h3 class="text-left">Loading</h3>
    <ProgressBar animIndeterminate="anim-progress-bar" />
  {:then}
    <div class="flex gap-4 mb-6">
      <div class="flex-auto">
        <button
          id="add-used-btn"
          class="btn variant-ghost-primary hover:variant-filled-primary"
          aria-label="You are on the Add User button"
        >
          &plus; Add User
        </button>
      </div>
    </div>
    {#each $usersByConnection as connection}
      <div id={`user-table-${connection.label.replaceAll(' ', '_')}`} class="mb-10">
        <Datatable
          data={connection.users}
          {columns}
          {cellOverides}
          search={true}
          defaultRowsPerPage={10}
          title={connection.label}
        />
      </div>
    {/each}
  {:catch}
    <ErrorAlert title="API Error">
      <p>Something went wrong when sending your request.</p>
    </ErrorAlert>
  {/await}
</Content>
