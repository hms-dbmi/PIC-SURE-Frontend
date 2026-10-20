<script lang="ts">
  import Button from '#lib/ui/Button.svelte';
  import { resolve } from '$app/paths';
  import { appPath } from '#lib/utils/appPath.ts';
  import { onMount } from 'svelte';

  import { page } from '$app/state';
  import { goto } from '$app/navigation';

  import { createInstance } from '#lib/auth/providerRegistry.ts';
  import { session } from '#lib/auth/session.svelte.ts';
  import { routesFor } from '#lib/auth/nav.ts';
  import { loginRedirectPath } from '#lib/auth/loginRedirect.ts';
  import type AuthProvider from '#lib/auth/providers/AuthProvider.ts';
  import { findSessionProvider } from '#lib/auth/providers/AuthProvider.ts';
  import { config } from '#lib/config/config.svelte.ts';
  import { log, createLog } from '#lib/telemetry/logger.ts';

  import Logo from '#lib/shell/Logo.svelte';
  import Popover from '#lib/ui/popover/Popover.svelte';
  import AppBar from '#lib/ui/AppBar.svelte';
  import Avatar from '#lib/ui/Avatar.svelte';

  function getId({ path, id }: { path: string; id?: string; text: string }) {
    return `app-nav-link` + (id ? `-` + id : path.replaceAll('/', '-'));
  }

  function handleLogin(e: Event) {
    e.stopImmediatePropagation();
    goto(resolve(appPath(loginRedirectPath(page.url))));
  }

  let signedInUser = $derived(session.signedInUser);
  let routes = $derived(routesFor(signedInUser, config.features));

  function currentPage(path: string) {
    const current = page.url.pathname === path || page.url.pathname.startsWith(`${path}/`);
    return current ? 'page' : undefined;
  }

  // Loaded with the page: after a deploy, an open tab can no longer fetch its old provider module.
  let loadedProvider: AuthProvider | undefined;
  onMount(async () => {
    const provider = findSessionProvider(page.data?.providers);
    if (provider) loadedProvider = await createInstance(provider);
  });

  async function logout() {
    log(createLog('AUTH', 'logout.click'));
    // Looked up again: another tab may have logged in through another provider since.
    const provider = findSessionProvider(page.data?.providers);
    const instance =
      provider &&
      (provider.name === loadedProvider?.name ? loadedProvider : await createInstance(provider));
    session.logout(instance, false);
  }
</script>

<AppBar>
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
      {#each routes as route (route)}
        <li>
          <a
            class="nav-link"
            id={getId(route)}
            href={resolve(appPath(route.path))}
            aria-current={currentPage(route.path)}
            >{route.text}
          </a>
        </li>
      {/each}
    </ul>
  </nav>
  {#snippet trail()}
    <div id="app-nav-user" class="content-center">
      {#if signedInUser?.privileges && signedInUser.email}
        {@const email = signedInUser.email}
        <!-- Logout -->
        <Popover data-testid="app-nav-user-menu" role="dialog" label="Account">
          {#snippet trigger(props)}
            <Button {...props} variant="none" size="none" aria-label="Account">
              <Avatar class="m-3">
                {email.toUpperCase().charAt(0)}
              </Avatar>
            </Button>
          {/snippet}
          <div class="flex flex-col items-center">
            <p class="pb-6">{email}</p>
            <Button class="w-fit" id="app-nav-logout" title="Logout" onclick={logout}>Logout</Button
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
