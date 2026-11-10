<script lang="ts">
  import { page } from '$app/state';

  import { config } from '#lib/config/config.svelte.ts';
  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';
  import Content from '#lib/shell/Content.svelte';
  import UserForm from '#lib/admin/users/UserForm.svelte';

  import type { ExtendedUser } from '#lib/auth/model/user.ts';
  import UsersStore from '#lib/admin/users/Users.ts';
  import RoleStore from '#lib/admin/access/Roles.ts';
  import ConnectionsStore from '#lib/admin/access/Connections.ts';
  import Loading from '#lib/ui/Loading.svelte';

  const { getUser, loadUsers } = UsersStore;
  const { roleList, loadRoles } = RoleStore;
  const { connections, loadConnections } = ConnectionsStore;

  let user: ExtendedUser = $state({
    connection: '',
    generalMetadata: '',
    active: false,
    roles: [],
  });

  async function load() {
    await loadUsers();
    if (page.params?.uuid) {
      user = await getUser(page.params.uuid);
    }
    await loadRoles();
    await loadConnections();
  }
</script>

<svelte:head>
  <title>{config.branding.applicationName} | Edit User</title>
</svelte:head>

<Content title="Edit User" backUrl="/admin/users" backTitle="Back to Users">
  {#await load()}
    <Loading />
  {:then}
    <section id="admin-user-edit">
      <UserForm connections={$connections} roleList={$roleList} {user} />
    </section>
  {:catch}
    <ErrorAlert title="API Error">
      An error occurred while retrieving user {page.params.uuid}.
    </ErrorAlert>
  {/await}
</Content>
