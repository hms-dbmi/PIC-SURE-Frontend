<script lang="ts">
  import { page } from '$app/state';

  import { config } from '#lib/configuration.svelte.js';
  import ErrorAlert from '#lib/components/ErrorAlert.svelte';
  import Content from '#lib/components/Content.svelte';
  import PrivilegeForm from '#lib/components/admin/configuration/PrivilegeForm.svelte';

  import type { Privilege } from '#lib/models/Privilege.js';
  import { getPrivilege } from '#lib/stores/Privileges.js';
  import { applicationList, loadApplications } from '#lib/stores/Application.js';
  import Loading from '#lib/components/Loading.svelte';

  let privilege: Privilege = $state({
    name: '',
    description: '',
    application: '',
  });

  async function load() {
    if (page.params?.uuid) {
      privilege = await getPrivilege(page.params.uuid);
    }
    await loadApplications();
  }
</script>

<svelte:head>
  <title>{config.branding.applicationName} | Edit Privilege</title>
</svelte:head>

<Content title="Edit Privilege" backUrl="/admin/configuration" backTitle="Back to Configuration">
  {#await load()}
    <Loading />
  {:then}
    <section id="privilege-edit">
      <PrivilegeForm applicationList={$applicationList} {privilege} />
    </section>
  {:catch}
    <ErrorAlert title="API Error">
      An error occured while retrieving dataset {page.params.uuid}.
    </ErrorAlert>
  {/await}
</Content>
