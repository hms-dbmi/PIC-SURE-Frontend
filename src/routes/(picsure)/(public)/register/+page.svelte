<script lang="ts">
  import { config } from '$lib/configuration.svelte';
  import Content from '$lib/components/Content.svelte';
  import RegisterForm from '$lib/components/register/RegisterForm.svelte';
</script>

<svelte:head>
  <title>{config.branding.applicationName} | Register</title>
</svelte:head>
<Content>
  <RegisterForm />
</Content>
