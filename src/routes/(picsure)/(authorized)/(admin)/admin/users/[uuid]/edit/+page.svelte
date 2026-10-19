<script lang="ts">
  import { page } from '$app/state';

  import { config } from '#lib/config/config.svelte.ts';
  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';
  import Content from '#lib/shell/Content.svelte';
  import UserForm from '#lib/admin/users/UserForm.svelte';

  import type { ExtendedUser } from '#lib/auth/model/user.ts';
  import * as admin from '#lib/admin/entities.ts';
  import Loading from '#lib/ui/Loading.svelte';

  let user: ExtendedUser = $state({
    connection: '',
    generalMetadata: '',
    active: false,
    roles: [],
  });

  async function load() {
    await admin.users.load();
    if (page.params?.uuid) {
      user = await admin.users.get(page.params.uuid);
    }
    await admin.roles.load();
    await admin.connections.load();
  }
</script>

<svelte:head>
  <title>{config.branding.applicationName} | Edit User</title>
</svelte:head>

<Content title="Edit User" backUrl="/admin/users" backTitle="Back to Users">
  {#await load()}
    <Loading />
  {:then}
    <section id="admin-user-edit">
      <UserForm connections={admin.connections.items} roleList={admin.roles.options} {user} />
    </section>
  {:catch}
    <ErrorAlert title="API Error">
      An error occurred while retrieving user {page.params.uuid}.
    </ErrorAlert>
  {/await}
</Content>
