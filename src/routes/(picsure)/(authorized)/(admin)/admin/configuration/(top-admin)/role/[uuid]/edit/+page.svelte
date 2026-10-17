<script lang="ts">
  import { page } from '$app/state';

  import { config } from '#lib/config/config.svelte.ts';
  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';
  import Content from '#lib/shell/Content.svelte';
  import RoleForm from '#lib/admin/access/RoleForm.svelte';

  import type { Role } from '#lib/auth/model/role.ts';
  import { getRole } from '#lib/admin/access/Roles.ts';
  import { privilegeList, loadPrivileges } from '#lib/admin/access/Privileges.ts';
  import Loading from '#lib/ui/Loading.svelte';

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
  <title>{config.branding.applicationName} | Edit Role</title>
</svelte:head>

<Content title="Edit Role" backUrl="/admin/configuration" backTitle="Back to Configuration">
  {#await load()}
    <Loading />
  {:then}
    <section id="admin-role-edit">
      <RoleForm privilegeList={$privilegeList} {role} />
    </section>
  {:catch}
    <ErrorAlert title="API Error">
      An error occurred while retrieving role {page.params.uuid}.
    </ErrorAlert>
  {/await}
</Content>
