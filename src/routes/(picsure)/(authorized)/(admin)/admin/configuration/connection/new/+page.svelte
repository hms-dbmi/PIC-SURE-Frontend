<script lang="ts">
  import { branding } from '$lib/configuration';
  import Content from '$lib/components/Content.svelte';
  import ConnectionForm from '$lib/components/admin/configuration/ConnectionForm.svelte';
</script>

<svelte:head>
  <title>{branding.applicationName} | Connection Configuration</title>
</svelte:head>

<Content title="Add Connection" backUrl="/admin/configuration" backTitle="Back to Configuration">
  <section id="role-new">
    <ConnectionForm />
  </section>
</Content>
