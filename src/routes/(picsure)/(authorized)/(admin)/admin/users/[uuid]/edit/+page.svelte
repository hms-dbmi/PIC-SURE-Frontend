<script lang="ts">
  import { config } from '#lib/config/config.svelte.ts';
  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';
  import Content from '#lib/shell/Content.svelte';
  import UserForm from '#lib/admin/users/UserForm.svelte';

  import * as admin from '#lib/admin/entities.ts';
  import Loading from '#lib/ui/Loading.svelte';
  import type { PageProps } from './$types';

  let { params }: PageProps = $props();
</script>

<svelte:head>
  <title>{config.branding.applicationName} | Edit User</title>
</svelte:head>

<Content title="Edit User" backUrl="/admin/users" backTitle="Back to Users">
  {#await admin.loadUser(params.uuid)}
    <Loading />
  {:then user}
    <section id="admin-user-edit">
      <UserForm connections={admin.connections.items} roleList={admin.roles.options} {user} />
    </section>
  {:catch}
    <ErrorAlert title="API Error">
      An error occurred while retrieving user {params.uuid}.
    </ErrorAlert>
  {/await}
</Content>
