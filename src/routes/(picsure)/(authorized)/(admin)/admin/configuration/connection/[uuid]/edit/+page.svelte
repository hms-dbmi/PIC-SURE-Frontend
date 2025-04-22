<script lang="ts">
  import { page } from '$app/state';
  import { ProgressBar } from '@skeletonlabs/skeleton';

  import { branding } from '$lib/configuration';

  import { type Connection } from '$lib/models/Connection';
  import { getConnection } from '$lib/stores/Connections';

  import Content from '$lib/components/Content.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import ConnectionForm from '$lib/components/admin/configuration/ConnectionForm.svelte';

  let connection: Connection = $state({
    id: '',
    label: '',
    subPrefix: '',
    requiredFields: '',
  });

  async function load() {
    connection = await getConnection(page.params.uuid);
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
    <section id="connection-edit">
      <ConnectionForm {connection} />
    </section>
  {:catch}
    <ErrorAlert title="API Error">
      <p>An error occured while retrieving dataset {page.params.uuid}.</p>
    </ErrorAlert>
  {/await}
</Content>
