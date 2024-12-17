<script lang="ts">
  import { AppBar, popup, type PopupSettings } from '@skeletonlabs/skeleton';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { user, userRoutes, isLoggedIn, logout } from '$lib/stores/User';
  import type { Route } from '$lib/models/Route';
  import Logo from '$lib/components/Logo.svelte';
  import type AuthData from '$lib/models/AuthProvider.ts';
  import type AuthProvider from '$lib/models/AuthProvider.ts';
  import { browser } from '$app/environment';
  import { createInstance } from '$lib/AuthProviderRegistry.ts';
  import { onMount } from 'svelte';
  let providerData: AuthData;
  let providerInstance: AuthProvider | undefined = $state(undefined);

  function getId({ path, id }: { path: string; id?: string; text: string }) {
    return `nav-link` + (id ? `-` + id : path.replaceAll('/', '-'));
  }

  const logoutClick: PopupSettings = {
    event: 'click',
    target: 'logoutClick',
    placement: 'bottom',
  };

  function handleLogin() {
    goto(`/login?redirectTo=${$page.url.pathname}`);
  }

  let currentPage = $derived((route: Route) => {
    if (route.children) {
      for (const child of route.children) {
        if ($page.url.pathname.includes(child.path)) {
          return 'page';
        }
      }
      return undefined;
    }
    return $page.url.pathname.includes(route.path) ? 'page' : undefined;
  });

  onMount(async () => {
    if (browser && $page) {
      const providerType = sessionStorage.getItem('type');
      if (providerType) {
        providerData = $page.data?.providers.find((p: AuthProvider) => p.type === providerType);
        providerInstance = await createInstance(providerData);
      }
    }
  });
</script>

<AppBar padding="py-0 pl-2 pr-5" background="bg-surface-50-900-token">
  {#snippet lead()}
    <a href="/" aria-current="page" data-testid="logo-home-link">
      <Logo class="mx-1" />
    </a>
  {/snippet}
  <nav id="page-navigation">
    <ul>
      {#each $userRoutes as route}
        <li>
          <a class="nav-link" id={getId(route)} href={route.path} aria-current={currentPage(route)}
            >{route.text}
          </a>
        </li>
      {/each}
    </ul>
  </nav>
  {#snippet trail()}
    <div id="user-session-avatar">
      {#if $user.privileges && $user.email && $isLoggedIn}
        <!-- Logout -->
        <button id="user-session-popout" use:popup={logoutClick}>
          <span
            class="avatar flex aspect-square justify-center items-center overflow-hidden isolate variant-ghost-primary hover:variant-ghost-secondary w-12 rounded-full text-2xl"
          >
            {$user.email[0].toUpperCase()}
            <span class="sr-only">Logout user {$user.email}</span>
          </span>
        </button>
        <div
          class="card p-6 variant-surface border-surface-100-800-token text-center"
          data-popup="logoutClick"
        >
          <p class="pb-6">{$user.email}</p>
          <button
            id="user-logout-btn"
            class="btn variant-ringed-primary"
            title="Logout"
            onclick={() => logout(providerInstance, false)}>Logout</button
          >
        </div>
      {:else}
        <!-- Login -->
        <button
          id="user-login-btn"
          title="Login"
          class="btn variant-ghost-primary hover:variant-filled-primary"
          onclick={handleLogin}
        >
          Login
        </button>
      {/if}
    </div>
  {/snippet}
</AppBar>
