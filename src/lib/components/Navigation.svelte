<script lang="ts">
  import { AppBar, popup, type PopupSettings } from '@skeletonlabs/skeleton';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import logo from '$lib/assets/app-logo.png';
  import { user, userRoutes, logout } from '$lib/stores/User';

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

  $: dropdownPath = '';
</script>

<AppBar padding="py-0 pl-2 pr-5" background="bg-surface-50">
  <svelte:fragment slot="lead">
    <a href="/" aria-current="page" data-testid="logo-home-link">
      <img id="nav-logo" alt="PIC-Sure logo" src={logo} class="mx-1" />
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
              aria-current={route.children.map((c) => c.path).includes($page.url.pathname)
                ? 'page'
                : undefined}>{route.text}</a
            >
            <ul
              class="nav-dropdown"
              style:visibility={dropdownPath === route.path ? 'visible' : 'hidden'}
            >
              {#each route.children as child}
                <li>
                  <a href={child.path} on:keydown={(e) => e.key === 'Enter' && setDropdown('')}
                    >{child.text}</a
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
              aria-current={$page.url.pathname === route.path ? 'page' : undefined}>{route.text}</a
            >
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
            class="avatar flex aspect-square justify-center items-center overflow-hidden isolate variant-ghost-primary hover:variant-ghost-secondary w-16 rounded-full text-2xl"
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
        <button id="user-login-btn" title="Login" on:click={handleLogin}>
          <span
            class="avatar flex aspect-square justify-center items-center overflow-hidden isolate variant-ringed-surface hover:variant-ghost-secondary w-16 rounded-full text-2xl"
          >
            <i class="fa-solid fa-user fa-lg"></i>
            <span class="sr-only">Login</span>
          </span>
        </button>
      {/if}
    </div>
  </svelte:fragment>
</AppBar>
