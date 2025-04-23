<script lang="ts">
  import { Progress } from '@skeletonlabs/skeleton-svelte';

  import { branding } from '$lib/configuration';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import Content from '$lib/components/Content.svelte';
  import RoleForm from '$lib/components/admin/configuration/RoleForm.svelte';

  import PrivilegesStore from '$lib/stores/Privileges';
  const { privilegeList, loadPrivileges } = PrivilegesStore;
</script>

<svelte:head>
  <title>{branding.applicationName} | New Role</title>
</svelte:head>

<Content title="New Role" backUrl="/admin/configuration" backTitle="Back to Configuration">
  {#await loadPrivileges()}
    <h3 class="text-left">Loading</h3>
    <Progress animIndeterminate="anim-progress-bar" />
  {:then}
    <section id="role-new">
      <RoleForm privilegeList={$privilegeList} />
    </section>
  {:catch}
    <ErrorAlert title="API Error">
      <p>Something went wrong when sending your request.</p>
    </ErrorAlert>
  {/await}
</Content>
