<script lang="ts">
  import { page } from '$app/stores';
  import { ProgressBar } from '@skeletonlabs/skeleton';

  import { branding } from '$lib/configuration';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import Content from '$lib/components/Content.svelte';
  import UserForm from '$lib/components/admin/user/UserForm.svelte';

  import type { ExtendedUser } from '$lib/models/User';
  import UsersStore from '$lib/stores/Users';
  import RoleStore from '$lib/stores/Roles';
  import ConnectionsStore from '$lib/stores/Connections';
  const { getUser, loadUsers } = UsersStore;
  const { roleList, loadRoles } = RoleStore;
  const { connections, loadConnections } = ConnectionsStore;

  let user: ExtendedUser;

  async function load() {
    await loadUsers();
    user = await getUser($page.params.uuid);
    await loadRoles();
    await loadConnections();
  }
</script>

<svelte:head>
  <title>{branding.applicationName} | Edit User</title>
</svelte:head>

<Content title="Edit User">
  {#await load()}
    <h3 class="text-left">Loading</h3>
    <ProgressBar animIndeterminate="anim-progress-bar" />
  {:then}
    <section id="user-edit">
      <UserForm connections={$connections} roleList={$roleList} {user} />
    </section>
  {:catch}
    <ErrorAlert title="API Error">
      <p>An error occured while retrieving dataset {$page.params.uuid}.</p>
    </ErrorAlert>
  {/await}
</Content>
