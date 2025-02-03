<script lang="ts">
  import { page } from '$app/stores';
  import { ProgressBar } from '@skeletonlabs/skeleton';

  import { branding } from '$lib/configuration';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import Content from '$lib/components/Content.svelte';
  import PrivilegeForm from '$lib/components/admin/configuration/PrivilegeForm.svelte';

  import PrivilegesStore from '$lib/stores/Privileges';
  import ApplicationStore from '$lib/stores/Application';
  import type { Privilege } from '$lib/models/Privilege';

  const { loadPrivileges, getPrivilege } = PrivilegesStore;
  const { applicationList, loadApplications } = ApplicationStore;

  let privilege: Privilege;

  async function load() {
    await loadPrivileges();
    privilege = await getPrivilege($page.params.uuid);
    await loadApplications();
  }
</script>

<svelte:head>
  <title>{branding.applicationName} | Edit Privilege</title>
</svelte:head>

<Content title="Edit Privilege" backUrl="/admin/configuration" backTitle="Back to Configuration">
  {#await load()}
    <h3 class="text-left">Loading</h3>
    <ProgressBar animIndeterminate="anim-progress-bar" />
  {:then}
    <section id="privilege-edit">
      <PrivilegeForm applicationList={$applicationList} {privilege} />
    </section>
  {:catch}
    <ErrorAlert title="API Error">
      <p>An error occured while retrieving dataset {$page.params.uuid}.</p>
    </ErrorAlert>
  {/await}
</Content>
