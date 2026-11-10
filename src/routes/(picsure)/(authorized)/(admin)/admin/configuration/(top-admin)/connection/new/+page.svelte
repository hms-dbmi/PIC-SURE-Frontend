<script lang="ts">
  import { config } from '#lib/config/config.svelte.ts';
  import Content from '#lib/shell/Content.svelte';
  import ConnectionForm from '#lib/admin/access/ConnectionForm.svelte';
</script>

<svelte:head>
  <title>{config.branding.applicationName} | New Connection</title>
</svelte:head>

<Content title="New Connection" backUrl="/admin/configuration" backTitle="Back to Configuration">
  <section id="admin-connection-new">
    <ConnectionForm />
  </section>
</Content>
