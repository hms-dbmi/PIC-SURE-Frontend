<script lang="ts">
  import { branding } from '$lib/configuration';
  import Content from '$lib/components/Content.svelte';
  import ConnectionForm from '$lib/components/admin/configuration/ConnectionForm.svelte';
</script>

<svelte:head>
  <title>{branding.applicationName} | New Connection</title>
</svelte:head>

<Content title="New Connection" backUrl="/admin/configuration" backTitle="Back to Configuration">
  <section id="connection-new">
    <ConnectionForm />
  </section>
</Content>
