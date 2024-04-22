<script lang="ts">
  import { ProgressBar } from '@skeletonlabs/skeleton';

  import { branding } from '$lib/configuration';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import Content from '$lib/components/Content.svelte';
  import UserForm from '$lib/components/user/UserForm.svelte';

  import RoleStore from '$lib/stores/Roles';
  import ConnectionsStore from '$lib/stores/Connections';
  const { roleList, loadRoles } = RoleStore;
  const { connections, loadConnections } = ConnectionsStore;

  async function load(){
    await loadConnections();
    await loadRoles();
  }
</script>
<svelte:head>
  <title>{branding.applicationName} | New User</title>
</svelte:head>

<Content title="New User">
  {#await load()}
    <h3 class="text-left">Loading</h3>
    <ProgressBar animIndeterminate="anim-progress-bar" />
  {:then}
    <section id="user-new">
      <UserForm connections={$connections} roleList={$roleList} />
    </section>
  {:catch}
    <ErrorAlert title="API Error">
      <p>Something went wrong when sending your request.</p>
    </ErrorAlert>
  {/await}
</Content>
  