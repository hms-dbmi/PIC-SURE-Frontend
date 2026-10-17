<script lang="ts">
  import Button from '#lib/ui/Button.svelte';
  import { resolve } from '$app/paths';
  import { appPath } from '#lib/api/paths.ts';
  import { onMount } from 'svelte';
  import { AppBar, Avatar } from '@skeletonlabs/skeleton-svelte';

  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { browser } from '$app/env';

  import { createInstance } from '#lib/auth/providerRegistry.ts';
  import { user, userRoutes, isUserLoggedIn, logout } from '#lib/auth/User.ts';
  import { loginRedirectPath } from '#lib/auth/loginRedirect.ts';
  import type { Route } from '#lib/auth/model/route.ts';
  import AuthProvider, { findLoginProvider } from '#lib/auth/providers/AuthProvider.ts';
  import { log, createLog } from '#lib/telemetry/logger.ts';

  import Logo from '#lib/shell/Logo.svelte';
  import Popover from '#lib/ui/popover/Popover.svelte';

  let providerInstance: AuthProvider | undefined = $state(undefined);

  function getId({ path, id }: { path: string; id?: string; text: string }) {
    return `app-nav-link` + (id ? `-` + id : path.replaceAll('/', '-'));
  }

  function handleLogin(e: Event) {
    e.stopImmediatePropagation();
    goto(resolve(appPath(loginRedirectPath(page.url))));
  }

  const isActivePath = $derived((path: string) => {
    return page.url.pathname === path || page.url.pathname.startsWith(`${path}/`);
  });

  let currentPage = $derived((route: Route) => {
    if (route.children) {
      for (const child of route.children) {
        if (isActivePath(child.path)) {
          return 'page';
        }
      }
      return undefined;
    }
    return isActivePath(route.path) ? 'page' : undefined;
  });

  onMount(async () => {
    if (browser && page) {
      const providerData = findLoginProvider(page.data?.providers);
      if (providerData) {
        providerInstance = await createInstance(providerData);
      }
    }
  });
</script>

<AppBar padding="py-0 pl-2 pr-5" background="bg-surface-50-950" toolbarClasses="flex-none z-10">
  {#snippet lead()}
    <a
      href={resolve('')}
      aria-current="page"
      data-testid="app-nav-home"
      class="content-center"
      onclick={() => log(createLog('NAVIGATION', 'logo.click'))}
    >
      <Logo height={4} class="mx-1" />
    </a>
  {/snippet}
  <nav id="app-nav">
    <ul>
      {#each $userRoutes as route}
        <li>
          <a
            class="nav-link"
            id={getId(route)}
            href={resolve(appPath(route.path))}
            aria-current={currentPage(route)}
            >{route.text}
          </a>
        </li>
      {/each}
    </ul>
  </nav>
  {#snippet trail()}
    <div id="app-nav-user" class="content-center">
      {#if $user && $user.privileges && $user.email && isUserLoggedIn()}
        <!-- Logout -->
        <Popover data-testid="app-nav-user-menu">
          {#snippet trigger()}
            <Avatar
              name={($user.email || 'unknown').toUpperCase()}
              background="preset-tonal-primary hover:preset-tonal-secondary"
              border="border hover:border-primary-400"
              font="text-2xl"
              size="size-12"
              classes="m-3"
            >
              {($user.email || '?').toUpperCase().charAt(0)}
            </Avatar>
          {/snippet}
          <div class="flex flex-col items-center">
            <p class="pb-6">{$user.email}</p>
            <Button
              class="w-fit"
              id="app-nav-logout"
              title="Logout"
              onclick={() => {
                log(createLog('AUTH', 'logout.click'));
                logout(providerInstance, false);
              }}>Logout</Button
            >
          </div>
        </Popover>
      {:else}
        <!-- Login -->
        <Button variant="tonal" id="app-nav-login" title="Login" onclick={handleLogin}>
          Login
        </Button>
      {/if}
    </div>
  {/snippet}
</AppBar>
