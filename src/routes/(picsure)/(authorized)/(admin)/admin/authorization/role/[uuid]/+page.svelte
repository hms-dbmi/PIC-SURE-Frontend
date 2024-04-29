<script lang="ts">
  import { page } from '$app/stores';
  import { ProgressBar } from '@skeletonlabs/skeleton';

  import { branding } from '$lib/configuration';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import Content from '$lib/components/Content.svelte';

  import type { Role } from '$lib/models/Role';
  import type { Privilege } from '$lib/models/Privilege';
  import RolesStore from '$lib/stores/Roles';
  import PrivilegesStore from '$lib/stores/Privileges';
  const { loadRoles, getRole } = RolesStore;
  const { loadPrivileges, getPrivilege } = PrivilegesStore;

  let role: Role;
  let privileges: Privilege[];

  async function load() {
    await loadRoles();
    await loadPrivileges();
    role = await getRole($page.params.uuid);
    privileges = await Promise.all(role.privileges.map(getPrivilege));
  }
</script>

<svelte:head>
  <title>{branding.applicationName} | Role Summary</title>
</svelte:head>

<Content title="Role Summary">
  {#await load()}
    <h3 class="text-left">Loading</h3>
    <ProgressBar animIndeterminate="anim-progress-bar" />
  {:then}
    <section id="role-view">
      <table class="table bg-transparent">
        <tr>
          <td>ID:</td>
          <td>{role.uuid}</td>
        </tr>
        <tr>
          <td>Name:</td>
          <td>{role.name}</td>
        </tr>
        <tr>
          <td>Description:</td>
          <td>{role.description}</td>
        </tr>
        <tr>
          <td>Privileges:</td>
          <td>{privileges.map((p) => p.name).join(', ')}</td>
        </tr>
      </table>
    </section>
  {:catch}
    <ErrorAlert title="API Error">
      <p>An error occured while retrieving dataset {$page.params.uuid}.</p>
    </ErrorAlert>
  {/await}
</Content>
