<script lang="ts">
  import { branding } from '$lib/stores/Configuration';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import Content from '$lib/components/Content.svelte';
  import PrivilegeForm from '$lib/components/admin/configuration/PrivilegeForm.svelte';

  import ApplicationStore from '$lib/stores/Application';
  import Loading from '$lib/components/Loading.svelte';

  const { applicationList, loadApplications } = ApplicationStore;
</script>

<svelte:head>
  <title>{$branding.applicationName} | New Privilege</title>
</svelte:head>

<Content title="New Privilege" backUrl="/admin/configuration" backTitle="Back to Configuration">
  {#await loadApplications()}
    <Loading />
  {:then}
    <section id="privilege-new">
      <PrivilegeForm applicationList={$applicationList} />
    </section>
  {:catch}
    <ErrorAlert title="API Error">Something went wrong when sending your request.</ErrorAlert>
  {/await}
</Content>
