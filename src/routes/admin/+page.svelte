<script>
  import Content from '$lib/components/Content.svelte';
  import { branding } from '$lib/configuration';
</script>

<svelte:head>
  <title>{branding.applicationName} | User Management</title>
</svelte:head>

<Content title="Admin">
  <p>Sample page data for the admin page.</p>
</Content>
