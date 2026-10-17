<script lang="ts">
  import { config } from '#lib/config/config.svelte.ts';
  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';
  import Content from '#lib/shell/Content.svelte';
  import RoleForm from '#lib/admin/access/RoleForm.svelte';

  import PrivilegesStore from '#lib/admin/access/Privileges.ts';
  import Loading from '#lib/ui/Loading.svelte';

  const { privilegeList, loadPrivileges } = PrivilegesStore;
</script>

<svelte:head>
  <title>{config.branding.applicationName} | New Role</title>
</svelte:head>

<Content title="New Role" backUrl="/admin/configuration" backTitle="Back to Configuration">
  {#await loadPrivileges()}
    <Loading />
  {:then}
    <section id="admin-role-new">
      <RoleForm privilegeList={$privilegeList} />
    </section>
  {:catch}
    <ErrorAlert title="API Error">Something went wrong when sending your request.</ErrorAlert>
  {/await}
</Content>
