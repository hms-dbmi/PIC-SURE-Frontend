<script lang="ts">
  import { ProgressBar } from '@skeletonlabs/skeleton';

  import { branding } from '$lib/configuration';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import Content from '$lib/components/Content.svelte';
  import PrivilegeForm from '$lib/components/admin/configuration/PrivilegeForm.svelte';

  import ApplicationStore from '$lib/stores/Application';
  const { applicationList, loadApplications } = ApplicationStore;
</script>

<svelte:head>
  <title>{branding.applicationName} | New Privilege</title>
</svelte:head>

<Content title="New Privilege" backUrl="/admin/configuration" backTitle="Back to Authorization">
  {#await loadApplications()}
    <h3 class="text-left">Loading</h3>
    <ProgressBar animIndeterminate="anim-progress-bar" />
  {:then}
    <section id="privilege-new">
      <PrivilegeForm applicationList={$applicationList} />
    </section>
  {:catch}
    <ErrorAlert title="API Error">
      <p>Something went wrong when sending your request.</p>
    </ErrorAlert>
  {/await}
</Content>
