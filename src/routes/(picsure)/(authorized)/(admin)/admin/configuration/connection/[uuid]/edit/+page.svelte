<script lang="ts">
  import { page } from '$app/stores';
  import { ProgressBar } from '@skeletonlabs/skeleton';

  import { type Connection } from '$lib/models/Connection';

  import { branding } from '$lib/configuration';
  import Content from '$lib/components/Content.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import ConnectionForm from '$lib/components/admin/configuration/ConnectionForm.svelte';
  import { loadConnections, getConnection } from '$lib/stores/Connections';

  let connection: Connection;

  async function load() {
    await loadConnections();
    connection = await getConnection($page.params.uuid);
  }
</script>

<svelte:head>
  <title>{branding.applicationName} | Edit Connection Configuration</title>
</svelte:head>

<Content title="Edit Connection" backUrl="/admin/configuration" backTitle="Back to Configuration">
  {#await load()}
    <h3 class="text-left">Loading</h3>
    <ProgressBar animIndeterminate="anim-progress-bar" />
  {:then}
    <section id="role-new">
      <ConnectionForm {connection} />
    </section>
  {:catch}
    <ErrorAlert title="API Error">
      <p>An error occured while retrieving dataset {$page.params.uuid}.</p>
    </ErrorAlert>
  {/await}
</Content>
