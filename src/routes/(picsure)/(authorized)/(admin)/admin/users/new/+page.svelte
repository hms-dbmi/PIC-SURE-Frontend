<script lang="ts">
  import { config } from '#lib/config/config.svelte.ts';
  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';
  import Content from '#lib/shell/Content.svelte';
  import UserForm from '#lib/admin/users/UserForm.svelte';

  import * as admin from '#lib/admin/resources.ts';
  import Loading from '#lib/ui/Loading.svelte';

  async function load() {
    await admin.connections.load();
    await admin.roles.load();
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
      <UserForm connections={admin.connections.items} roleList={admin.roles.options} />
    </section>
  {:catch}
    <ErrorAlert title="API Error">Something went wrong when sending your request.</ErrorAlert>
  {/await}
</Content>
