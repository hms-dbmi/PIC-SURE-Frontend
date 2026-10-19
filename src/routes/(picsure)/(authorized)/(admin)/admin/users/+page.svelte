<script lang="ts">
  import Button from '#lib/ui/Button.svelte';
  import { resolve } from '$app/paths';

  import { goto } from '$app/navigation';

  import type { Indexable } from '#lib/utils/objects.ts';
  import { config } from '#lib/config/config.svelte.ts';
  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';
  import Content from '#lib/shell/Content.svelte';
  import Datatable from '#lib/ui/datatable/StaticTable.svelte';
  import Actions from '#lib/admin/users/cell/Actions.svelte';
  import Status from '#lib/admin/users/cell/Status.svelte';

  import * as admin from '#lib/admin/entities.ts';
  import Loading from '#lib/ui/Loading.svelte';

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

  let usersByConnection: Connection[] = $derived(
    admin.connections.items.map((connection) => ({
      label: connection.label,
      users: admin.users.items
        .filter((user) => connection.uuid === user.connection)
        .map(
          (row): UserRow => ({
            uuid: row.uuid || '',
            email: row.email || 'uuid:' + row.uuid,
            roles:
              row.roles.length === 0
                ? 'none'
                : row.roles
                    .map((role: string) => admin.roles.find(role)?.name)
                    .sort()
                    .join(', '),
            status: row.active ? 'Active' : 'Inactive',
          }),
        )
        .sort((uA, uB) => uA.status.localeCompare(uB.status)),
    })),
  );

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

  const load = () =>
    Promise.all([admin.connections.load(), admin.roles.load(), admin.users.load()]);

  const rowClickHandler = (row: Indexable) => {
    const uuid = row?.uuid;
    goto(resolve('/(picsure)/(authorized)/(admin)/admin/users/[uuid]/edit', { uuid }));
  };
</script>

<svelte:head>
  <title>{config.branding.applicationName} | Manage Users</title>
</svelte:head>
<Content title="Manage Users">
  {#await load()}<Loading />{:then}
    <div class="flex gap-4 mb-6">
      <div class="flex-auto">
        <Button
          variant="tonal"
          data-testid="admin-user-add"
          href={resolve('/(picsure)/(authorized)/(admin)/admin/users/new')}
        >
          + Add User
        </Button>
      </div>
    </div>
    {#each usersByConnection as connection, i}
      <div class="mb-10">
        <Datatable
          tableName="Users-{connection.label}"
          data-testid="admin-user-table-{i}"
          id="admin-user-table-{i}"
          data={connection.users}
          {columns}
          {cellOverides}
          title={connection.label}
          {rowClickHandler}
          isClickable
          searchable
        />
      </div>
    {/each}
  {:catch}
    <ErrorAlert title="API Error">Something went wrong when sending your request.</ErrorAlert>
  {/await}
</Content>
