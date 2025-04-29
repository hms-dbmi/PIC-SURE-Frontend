<script lang="ts">
  import { page } from '$app/state';

  import { branding } from '$lib/configuration';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import Content from '$lib/components/Content.svelte';
  import UserForm from '$lib/components/admin/user/UserForm.svelte';

  import type { ExtendedUser } from '$lib/models/User';
  import UsersStore from '$lib/stores/Users';
  import RoleStore from '$lib/stores/Roles';
  import ConnectionsStore from '$lib/stores/Connections';
  import Loading from '$lib/components/Loading.svelte';

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
    user = await getUser(page.params.uuid);
    await loadRoles();
    await loadConnections();
  }
</script>

<svelte:head>
  <title>{branding.applicationName} | Edit User</title>
</svelte:head>

<Content title="Edit User" backUrl="/admin/users" backTitle="Back to Users">
  {#await load()}
    <Loading />
  {:then}
    <section id="user-edit">
      <UserForm connections={$connections} roleList={$roleList} {user} />
    </section>
  {:catch}
    <ErrorAlert title="API Error">
      An error occured while retrieving dataset {page.params.uuid}.
    </ErrorAlert>
  {/await}
</Content>
