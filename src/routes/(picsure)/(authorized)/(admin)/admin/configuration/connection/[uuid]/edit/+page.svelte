<script lang="ts">
  import { page } from '$app/state';

  import { branding } from '$lib/stores/Configuration';

  import { type Connection } from '$lib/models/Connection';
  import { getConnection } from '$lib/stores/Connections';

  import Content from '$lib/components/Content.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import ConnectionForm from '$lib/components/admin/configuration/ConnectionForm.svelte';
  import Loading from '$lib/components/Loading.svelte';

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
  <title>{$branding.applicationName} | Edit Connection Configuration</title>
</svelte:head>

<Content title="Edit Connection" backUrl="/admin/configuration" backTitle="Back to Configuration">
  {#await load()}
    <Loading />
  {:then}
    <section id="connection-edit">
      <ConnectionForm {connection} />
    </section>
  {:catch}
    <ErrorAlert title="API Error">
      An error occured while retrieving dataset {page.params.uuid}.
    </ErrorAlert>
  {/await}
</Content>
