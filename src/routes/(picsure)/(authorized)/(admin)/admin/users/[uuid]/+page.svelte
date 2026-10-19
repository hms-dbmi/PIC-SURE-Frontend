<script lang="ts">
  import { config } from '#lib/config/config.svelte.ts';

  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';
  import Content from '#lib/shell/Content.svelte';

  import * as admin from '#lib/admin/entities.ts';
  import Loading from '#lib/ui/Loading.svelte';
  import type { PageProps } from './$types';

  let { params }: PageProps = $props();

  async function load(uuid: string) {
    const [user] = await Promise.all([
      admin.users.get(uuid),
      admin.connections.load(),
      admin.roles.load(),
    ]);
    return {
      user,
      connection: await admin.connections.get(user.connection),
      roles: await Promise.all(user.roles.map((role) => admin.roles.get(role))),
    };
  }
</script>

<svelte:head>
  <title>{config.branding.applicationName} | User Summary</title>
</svelte:head>

<Content title="User Summary" backUrl="/admin/users" backTitle="Back to Users">
  {#await load(params.uuid)}
    <Loading />
  {:then { user, connection, roles }}
    <section id="admin-user-view">
      <table class="table">
        <tbody>
          <tr>
            <td>Id:</td>
            <td>{user.uuid}</td>
          </tr>
          <tr>
            <td>Email:</td>
            <td>{user.email}</td>
          </tr>
          <tr>
            <td>Active:</td>
            <td>{user.active}</td>
          </tr>
          {#if user.subject}
            <tr>
              <td>Subject:</td>
              <td>{user.subject}</td>
            </tr>
          {/if}
          <tr>
            <td>Connection:</td>
            <td>{connection.label}</td>
          </tr>
          <tr>
            <td>Roles:</td>
            <td>{roles.map((p) => p.name).join(', ')}</td>
          </tr>
        </tbody>
      </table>
    </section>
  {:catch}
    <ErrorAlert title="API Error">
      An error occurred while retrieving user {params.uuid}.
    </ErrorAlert>
  {/await}
</Content>
