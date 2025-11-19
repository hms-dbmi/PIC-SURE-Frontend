<script lang="ts">
  import { config } from '$lib/configuration.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import Content from '$lib/components/Content.svelte';
  import UserForm from '$lib/components/admin/user/UserForm.svelte';

  import RoleStore from '$lib/stores/Roles';
  import ConnectionsStore from '$lib/stores/Connections';
  import Loading from '$lib/components/Loading.svelte';

  const { roleList, loadRoles } = RoleStore;
  const { connections, loadConnections } = ConnectionsStore;

  async function load() {
    await loadConnections();
    await loadRoles();
  }
</script>

<svelte:head>
  <title>{config.branding.applicationName} | New User</title>
</svelte:head>

<Content title="New User" backUrl="/admin/users" backTitle="Back to Users">
  {#await load()}
    <Loading />
  {:then}
    <section id="user-new">
      <UserForm connections={$connections} roleList={$roleList} />
    </section>
  {:catch}
    <ErrorAlert title="API Error">Something went wrong when sending your request.</ErrorAlert>
  {/await}
</Content>
