<script lang="ts">
  import { AppBar } from '@skeletonlabs/skeleton';
  import logo from '$lib/assets/app-logo.png';
  import '../../../app.postcss';
  import { user } from '$lib/stores/User';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  onMount(() => {
    if ($user && $user.token) {
      goto('/');
    }
  });
</script>

<header class="w-full">
  <AppBar padding="py-4 pl-2 pr-5" background="bg-surface-50-900-token">
    <svelte:fragment slot="lead">
      <a href="/" aria-current="page" data-testid="logo-home-link">
        <img id="nav-logo" alt="PIC-Sure logo" src={logo} class="mx-1" />
      </a>
    </svelte:fragment>
  </AppBar>
</header>

<slot />
