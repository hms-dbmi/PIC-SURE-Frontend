<script lang="ts">
  import { config } from '#lib/config/config.svelte.ts';
  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';
  import Content from '#lib/shell/Content.svelte';
  import RoleForm from '#lib/admin/access/RoleForm.svelte';

  import * as admin from '#lib/admin/resources.ts';
  import Loading from '#lib/ui/Loading.svelte';
</script>

<svelte:head>
  <title>{config.branding.applicationName} | New Role</title>
</svelte:head>

<Content title="New Role" backUrl="/admin/configuration" backTitle="Back to Configuration">
  {#await admin.privileges.load()}
    <Loading />
  {:then}
    <section id="admin-role-new">
      <RoleForm privilegeList={admin.privileges.options} />
    </section>
  {:catch}
    <ErrorAlert title="API Error">Something went wrong when sending your request.</ErrorAlert>
  {/await}
</Content>
