<script lang="ts">
  import { page } from '$app/stores';
  import { ProgressBar } from '@skeletonlabs/skeleton';

  import { branding } from '$lib/configuration';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import Content from '$lib/components/Content.svelte';
  import RoleForm from '$lib/components/admin/authorization/RoleForm.svelte';

  import type { Role } from '$lib/models/Role';
  import RolesStore from '$lib/stores/Roles';
  import PrivilegesStore from '$lib/stores/Privileges';
  const { loadRoles, getRole } = RolesStore;
  const { privilegeList, loadPrivileges } = PrivilegesStore;

  let role: Role;

  async function load() {
    await loadRoles();
    role = await getRole($page.params.uuid);
    await loadPrivileges();
  }
</script>

<svelte:head>
  <title>{branding.applicationName} | Edit Role</title>
</svelte:head>

<Content title="Edit Role">
  {#await load()}
    <h3 class="text-left">Loading</h3>
    <ProgressBar animIndeterminate="anim-progress-bar" />
  {:then}
    <section id="role-edit">
      <RoleForm privilegeList={$privilegeList} {role} />
    </section>
  {:catch}
    <ErrorAlert title="API Error">
      <p>An error occured while retrieving dataset {$page.params.uuid}.</p>
    </ErrorAlert>
  {/await}
</Content>
