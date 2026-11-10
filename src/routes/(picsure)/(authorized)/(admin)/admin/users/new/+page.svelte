<script lang="ts">
  import { config } from '#lib/config/config.svelte.ts';
  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';
  import Content from '#lib/shell/Content.svelte';
  import UserForm from '#lib/admin/users/UserForm.svelte';

  import RoleStore from '#lib/admin/access/Roles.ts';
  import ConnectionsStore from '#lib/admin/access/Connections.ts';
  import Loading from '#lib/ui/Loading.svelte';

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
    <section id="admin-user-new">
      <UserForm connections={$connections} roleList={$roleList} />
    </section>
  {:catch}
    <ErrorAlert title="API Error">Something went wrong when sending your request.</ErrorAlert>
  {/await}
</Content>
