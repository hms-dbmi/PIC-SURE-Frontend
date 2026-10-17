<script lang="ts">
  import { page } from '$app/state';

  import { config } from '#lib/config/config.svelte.ts';

  import { type Connection } from '#lib/auth/model/connection.ts';
  import { getConnection } from '#lib/admin/access/Connections.ts';

  import Content from '#lib/shell/Content.svelte';
  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';
  import ConnectionForm from '#lib/admin/access/ConnectionForm.svelte';
  import Loading from '#lib/ui/Loading.svelte';

  let connection: Connection = $state({
    id: '',
    label: '',
    subPrefix: '',
    requiredFields: '',
  });

  async function load() {
    if (page.params?.uuid) {
      connection = await getConnection(page.params.uuid);
    }
  }
</script>

<svelte:head>
  <title>{config.branding.applicationName} | Edit Connection Configuration</title>
</svelte:head>

<Content title="Edit Connection" backUrl="/admin/configuration" backTitle="Back to Configuration">
  {#await load()}
    <Loading />
  {:then}
    <section id="admin-connection-edit">
      <ConnectionForm {connection} />
    </section>
  {:catch}
    <ErrorAlert title="API Error">
      An error occurred while retrieving connection {page.params.uuid}.
    </ErrorAlert>
  {/await}
</Content>
