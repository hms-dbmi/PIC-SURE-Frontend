<script lang="ts">
  import Button from '#lib/ui/Button.svelte';
  import { resolve } from '$app/paths';

  import { goto } from '$app/navigation';

  import { config } from '#lib/config/config.svelte.ts';
  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';
  import Content from '#lib/shell/Content.svelte';
  import ClientTable from '#lib/ui/datatable/ClientTable.svelte';
  import type { Column } from '#lib/ui/datatable/types.ts';
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

  const columns: Column<UserRow>[] = [
    { dataElement: 'email', label: 'Username', sort: true, class: 'w-1/3' },
    { dataElement: 'roles', label: 'Role(s)', sort: true, class: 'normal-case!' },
    { dataElement: 'status', label: 'Status', sort: true, class: 'w-24 text-center', cell: status },
    {
      dataElement: 'uuid',
      label: 'Actions',
      sort: false,
      class: 'w-24 text-center',
      cell: actions,
    },
  ];

  const load = () =>
    Promise.all([admin.connections.load(), admin.roles.load(), admin.users.load()]);

  const rowClickHandler = ({ uuid }: UserRow) => {
    goto(resolve('/(picsure)/(authorized)/(admin)/admin/users/[uuid]/edit', { uuid }));
  };
</script>

{#snippet status(row: UserRow)}
  <Status status={row.status} />
{/snippet}

{#snippet actions(row: UserRow)}
  <Actions uuid={row.uuid} email={row.email} status={row.status} />
{/snippet}

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
    {#each usersByConnection as connection, i (connection.label)}
      <div class="mb-10">
        <ClientTable
          tableName="Users-{connection.label}"
          data-testid="admin-user-table-{i}"
          id="admin-user-table-{i}"
          rows={connection.users}
          {columns}
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
