<script lang="ts">
  import { fly } from 'svelte/transition';
  import { config } from '$lib/configuration.svelte';
  import RegisterForm from '$lib/components/register/RegisterForm.svelte';
  import Logo from '$lib/components/Logo.svelte';
</script>

<svelte:head>
  <title>{config.branding.applicationName} | Register</title>
</svelte:head>
<section
  id="register"
  class="flex flex-col items-center h-screen w-full h-full text-center place-content-center-safe pt-8 text-lg"
  in:fly={{ duration: 600, x: '100%' }}
>
  <Logo class="flex-none my-8" height={config.branding.login.logoHeight || 7.5} />
  <RegisterForm />
</section>
