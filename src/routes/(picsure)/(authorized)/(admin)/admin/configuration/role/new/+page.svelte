<script lang="ts">
  import { branding } from '$lib/configuration';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import Content from '$lib/components/Content.svelte';
  import RoleForm from '$lib/components/admin/configuration/RoleForm.svelte';

  import PrivilegesStore from '$lib/stores/Privileges';
  import Loading from '$lib/components/Loading.svelte';

  const { privilegeList, loadPrivileges } = PrivilegesStore;
</script>

<svelte:head>
  <title>{branding.applicationName} | New Role</title>
</svelte:head>

<Content title="New Role" backUrl="/admin/configuration" backTitle="Back to Configuration">
  {#await loadPrivileges()}
    <Loading />
  {:then}
    <section id="role-new">
      <RoleForm privilegeList={$privilegeList} />
    </section>
  {:catch}
    <ErrorAlert title="API Error">Something went wrong when sending your request.</ErrorAlert>
  {/await}
</Content>
