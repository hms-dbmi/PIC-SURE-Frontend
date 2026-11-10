<script lang="ts">
  import { page } from '$app/state';
  import { config } from '#lib/config/config.svelte.ts';

  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';
  import Content from '#lib/shell/Content.svelte';
  import type { ExtendedUser } from '#lib/auth/model/user.ts';
  import type { Role } from '#lib/auth/model/role.ts';
  import type { Connection } from '#lib/auth/model/connection.ts';

  import UsersStore from '#lib/admin/users/Users.ts';
  import RolesStore from '#lib/admin/access/Roles.ts';
  import ConnectionStore from '#lib/admin/access/Connections.ts';
  import Loading from '#lib/ui/Loading.svelte';

  const { loadUsers, getUser } = UsersStore;
  const { getRole } = RolesStore;
  const { getConnection } = ConnectionStore;

  let user: ExtendedUser = $state({
    connection: '',
    generalMetadata: '',
    active: false,
    roles: [],
  });
  let roles: Role[] = $state([]);
  let connection: Connection | string = $state('');

  async function load() {
    await loadUsers();
    if (page.params?.uuid) {
      user = await getUser(page.params.uuid);
      connection = (await getConnection(user.connection)) || '';
      roles = await Promise.all(user.roles.map(getRole));
    }
  }
</script>

<svelte:head>
  <title>{config.branding.applicationName} | User Summary</title>
</svelte:head>

<Content title="User Summary" backUrl="/admin/users" backTitle="Back to Users">
  {#await load()}
    <Loading />
  {:then}
    <section id="admin-user-view">
      <table class="table">
        <tbody>
          <tr>
            <td>Id:</td>
            <td>{user.uuid}</td>
          </tr>
          <tr>
            <td>Email:</td>
            <td>{user.email}</td>
          </tr>
          <tr>
            <td>Active:</td>
            <td>{user.active}</td>
          </tr>
          {#if user.subject}
            <tr>
              <td>Subject:</td>
              <td>{user.subject}</td>
            </tr>
          {/if}
          <tr>
            <td>Connection:</td>
            <td>{typeof connection !== 'string' ? connection.label : user.connection}</td>
          </tr>
          <tr>
            <td>Roles:</td>
            <td>{roles.map((p) => p.name).join(', ')}</td>
          </tr>
        </tbody>
      </table>
    </section>
  {:catch}
    <ErrorAlert title="API Error">
      An error occurred while retrieving user {page.params.uuid}.
    </ErrorAlert>
  {/await}
</Content>
