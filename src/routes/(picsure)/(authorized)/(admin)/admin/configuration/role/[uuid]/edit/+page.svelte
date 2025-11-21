<script lang="ts">
  import { page } from '$app/state';

  import { branding } from '$lib/configuration';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import Content from '$lib/components/Content.svelte';
  import RoleForm from '$lib/components/admin/configuration/RoleForm.svelte';

  import type { Role } from '$lib/models/Role';
  import { getRole } from '$lib/stores/Roles';
  import { privilegeList, loadPrivileges } from '$lib/stores/Privileges';
  import Loading from '$lib/components/Loading.svelte';

  let role: Role = $state({
    name: '',
    description: '',
    privileges: [],
  });

  async function load() {
    if (page.params?.uuid) {
      role = await getRole(page.params.uuid);
    }
    await loadPrivileges();
  }
</script>

<svelte:head>
  <title>{branding.applicationName} | Edit Role</title>
</svelte:head>

<Content title="Edit Role" backUrl="/admin/configuration" backTitle="Back to Configuration">
  {#await load()}
    <Loading />
  {:then}
    <section id="role-edit">
      <RoleForm privilegeList={$privilegeList} {role} />
    </section>
  {:catch}
    <ErrorAlert title="API Error">
      An error occured while retrieving dataset {page.params.uuid}.
    </ErrorAlert>
  {/await}
</Content>
