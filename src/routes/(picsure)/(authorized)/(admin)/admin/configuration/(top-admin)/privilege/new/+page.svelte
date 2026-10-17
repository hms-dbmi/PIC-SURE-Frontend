<script lang="ts">
  import { config } from '#lib/config/config.svelte.ts';
  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';
  import Content from '#lib/shell/Content.svelte';
  import PrivilegeForm from '#lib/admin/access/PrivilegeForm.svelte';

  import ApplicationStore from '#lib/admin/access/Application.ts';
  import Loading from '#lib/ui/Loading.svelte';

  const { applicationList, loadApplications } = ApplicationStore;
</script>

<svelte:head>
  <title>{config.branding.applicationName} | New Privilege</title>
</svelte:head>

<Content title="New Privilege" backUrl="/admin/configuration" backTitle="Back to Configuration">
  {#await loadApplications()}
    <Loading />
  {:then}
    <section id="admin-privilege-new">
      <PrivilegeForm applicationList={$applicationList} />
    </section>
  {:catch}
    <ErrorAlert title="API Error">Something went wrong when sending your request.</ErrorAlert>
  {/await}
</Content>
