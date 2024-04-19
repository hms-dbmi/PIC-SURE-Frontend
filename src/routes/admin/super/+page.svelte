<script>
  import Content from '$lib/components/Content.svelte';
  import { branding } from '$lib/configuration';
</script>

<svelte:head>
  <title>{branding.applicationName} | Configuration</title>
</svelte:head>

<Content title="Super Admin">
  <p>Sample page data for the super admin page.</p>
</Content>
