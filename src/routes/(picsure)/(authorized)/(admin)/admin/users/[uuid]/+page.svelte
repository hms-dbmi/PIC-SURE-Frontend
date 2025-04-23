<script lang="ts">
  import { page } from '$app/state';
  import { Progress } from '@skeletonlabs/skeleton-svelte';
  import { branding } from '$lib/configuration';

  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import Content from '$lib/components/Content.svelte';
  import type { ExtendedUser } from '$lib/models/User';
  import type { Role } from '$lib/models/Role';
  import type { Connection } from '$lib/models/Connection';

  import UsersStore from '$lib/stores/Users';
  import RolesStore from '$lib/stores/Roles';
  import ConnectionStore from '$lib/stores/Connections';
  const { loadUsers, getUser } = UsersStore;
  const { getRole } = RolesStore;
  const { getConnection } = ConnectionStore;

  let user: ExtendedUser = $state({
    connection: '',
    generalMetadata: '',
    active: false,
    roles: [],
  });
  let roles: Role[] = $state([]);
  let connection: Connection | string = $state('');

  async function load() {
    await loadUsers();
    user = await getUser(page.params.uuid);
    connection = (await getConnection(user.connection)) || '';
    roles = await Promise.all(user.roles.map(getRole));
  }
</script>

<svelte:head>
  <title>{branding.applicationName} | User Summary</title>
</svelte:head>

<Content title="User Summary" backUrl="/admin/users" backTitle="Back to Users">
  {#await load()}
    <h3 class="text-left">Loading</h3>
    <Progress animIndeterminate="anim-progress-bar" />
  {:then}
    <section id="role-view">
      <table class="table bg-transparent">
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
            <td>{typeof connection !== 'string' ? connection.label : user.connection}</td>
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
      <p>An error occured while retrieving dataset {page.params.uuid}.</p>
    </ErrorAlert>
  {/await}
</Content>
