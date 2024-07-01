<script lang="ts">
  import { AppBar, popup, type PopupSettings } from '@skeletonlabs/skeleton';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { user, userRoutes, logout } from '$lib/stores/User';
  import type { Route } from '$lib/models/Route';
  import Logo from './Logo.svelte';

  function setDropdown(path: string) {
    dropdownPath = path;
  }

  function getId({ path, id }: { path: string; id?: string; text: string }) {
    return `nav-link` + (id ? `-` + id : path.replaceAll('/', '-'));
  }

  const logoutClick: PopupSettings = {
    event: 'click',
    target: 'logoutClick',
    placement: 'bottom',
  };

  function handleLogout() {
    logout();
    goto('/');
  }

  function handleLogin() {
    goto(`/login?redirectTo=${$page.url.pathname}`);
  }

  $: currentPage = (route: Route) => {
    if (route.children) {
      for (const child of route.children) {
        if ($page.url.pathname.includes(child.path)) {
          return 'page';
        }
      }
      return undefined;
    }
    return $page.url.pathname.includes(route.path) ? 'page' : undefined;
  };

  $: dropdownPath = '';
</script>

<AppBar padding="py-0 pl-2 pr-5" background="bg-surface-50-900-token">
  <svelte:fragment slot="lead">
    <a href="/" aria-current="page" data-testid="logo-home-link">
      <Logo class="mx-1" />
    </a>
  </svelte:fragment>
  <nav id="page-navigation">
    <ul>
      {#each $userRoutes as route}
        {#if route.children && route.children.length > 0}
          <li
            class={`has-dropdown ${dropdownPath === route.path ? 'open' : ''}`}
            on:mouseenter={() => setDropdown(route.path)}
            on:mouseleave={() => setDropdown('')}
            on:focus={() => setDropdown(route.path)}
            on:blur={() => setDropdown('')}
          >
            <a
              class="nav-link"
              id={getId(route)}
              href={route.path}
              on:click={(e) => e.preventDefault()}
              on:keydown={(e) => e.key === 'Enter' && setDropdown(dropdownPath ? '' : route.path)}
              aria-expanded={dropdownPath === route.path}
              aria-current={currentPage(route)}>{route.text}</a
            >
            <ul
              class="nav-dropdown"
              style:visibility={dropdownPath === route.path ? 'visible' : 'hidden'}
            >
              {#each route.children as child}
                <li>
                  <a
                    class="no-underline"
                    href={child.path}
                    on:keydown={(e) => e.key === 'Enter' && setDropdown('')}>{child.text}</a
                  >
                </li>
              {/each}
            </ul>
          </li>
        {:else}
          <li>
            <a
              class="nav-link"
              id={getId(route)}
              href={route.path}
              on:focus={() => setDropdown('')}
              aria-current={currentPage(route)}
              >{route.text}
            </a>
          </li>
        {/if}
      {/each}
    </ul>
  </nav>
  <svelte:fragment slot="trail">
    <div id="user-session-avatar">
      {#if $user.privileges && $user.email}
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
            on:click={handleLogout}>Logout</button
          >
        </div>
      {:else}
        <!-- Login -->
        <button
          id="user-login-btn"
          title="Login"
          class="btn variant-ghost-primary hover:variant-ghost-secondary"
          on:click={handleLogin}
        >
          Login
        </button>
      {/if}
    </div>
  </svelte:fragment>
</AppBar>
