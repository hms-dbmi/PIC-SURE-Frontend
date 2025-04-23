<script lang="ts">
  import { AppBar, type PopupSettings } from '@skeletonlabs/skeleton-svelte';
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

<AppBar padding="py-0 pl-2 pr-5" background="bg-surface-50-950">
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
            class="avatar flex aspect-square justify-center items-center overflow-hidden isolate preset-tonal-primary border border-primary-500 hover:preset-tonal-secondary border border-secondary-500 w-12 rounded-full text-2xl"
          >
            {$user.email[0].toUpperCase()}
            <span class="sr-only">Logout user {$user.email}</span>
          </span>
        </button>
        <div
          class="card p-6 variant-surface border-surface-100-900 text-center"
          data-popup="logoutClick"
        >
          <p class="pb-6">{$user.email}</p>
          <button
            id="user-logout-btn"
            class="btn preset-outlined-primary-500"
            title="Logout"
            onclick={() => logout(providerInstance, false)}>Logout</button
          >
        </div>
      {:else}
        <!-- Login -->
        <button
          id="user-login-btn"
          title="Login"
          class="btn preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500"
          onclick={handleLogin}
        >
          Login
        </button>
      {/if}
    </div>
  {/snippet}
</AppBar>
