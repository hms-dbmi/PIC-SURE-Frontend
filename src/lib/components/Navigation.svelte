<script lang="ts">
  import {
    AppBar,
    getModalStore,
    getToastStore,
    popup,
    type PopupSettings,
  } from '@skeletonlabs/skeleton';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import logo from '$lib/assets/app-logo.png';
  import { user, logout, login, getUser } from '$lib/stores/User';
  import { KeyboardNavigation } from '$lib/utilities/KeyNavigation';

  const modalStore = getModalStore();
  const toastStore = getToastStore();

  const routes = [
    { path: '/admin/super', text: 'Super Admin' },
    { path: '/user', text: 'User Management' },
    { path: '/explorer', text: 'Explorer' },
    { path: '/api', text: 'API' },
    { path: '/dataset', text: 'Dataset Management' },
    { path: '/help', text: 'Help' },
  ];

  let navigation: KeyboardNavigation;
  let navContainer: HTMLElement;
  const navLinks: HTMLAnchorElement[] = [];

  onMount(() => {
    navigation = new KeyboardNavigation(navContainer, {
      scope: [' ', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'],
      elements: navLinks,
      focusKeys: (index: number) => ({
        ArrowLeft: navLinks[(index + navLinks.length - 1) % navLinks.length],
        ArrowRight: navLinks[(index + 1) % navLinks.length],
        Home: navLinks[0],
        End: navLinks[navLinks.length - 1],
      }),
      charFocusKeys: routes.map((route) => route.text[0].toLowerCase()),
      actionKeys: (index: number) => ({
        ' ': () => navLinks[index].click(),
        Enter: () => navLinks[index].click(),
      }),
    });

    if (sessionStorage.getItem('token')) {
      getUser().catch((e) => {
        console.error(e);
        toastStore.trigger({
          message:
            'An error occured while validating your token. Please try again later. If this problem persists, please contact an administrator.',
          background: 'variant-filled-error',
        });
      });
    }
  });

  function getId({ path, id }: { path: string; id?: string; text: string }) {
    return `nav-link` + (id ? `-` + id : path.replaceAll('/', '-'));
  }

  function handleLogout() {
    logout();
    goto('/');
  }

  async function loginUser(resp: string) {
    await login(resp).catch((e) => {
      console.log(e);
      toastStore.trigger({
        message:
          'An error occured while validating your token. Please try again later. If this problem persists, please contact an administrator.',
        background: 'variant-filled-error',
      });
    });
  }

  function handleLogin() {
    modalStore.trigger({
      type: 'prompt',
      title: 'Enter Long Term Token',
      body: 'Provide your long term token below.',
      valueAttr: { type: 'text', required: true, placeholder: 'Enter token here...' },
      response: (resp: string) => resp && loginUser(resp),
    });
  }

  const logoutClick: PopupSettings = {
    event: 'click',
    target: 'logoutClick',
    placement: 'bottom',
  };
</script>

<AppBar padding="py-0 pl-2 pr-5" background="bg-surface-50">
  <svelte:fragment slot="lead">
    <a href="/" aria-current="page" data-testid="logo-home-link">
      <img id="nav-logo" alt="PIC-Sure logo" src={logo} class="mx-1" />
    </a>
  </svelte:fragment>
  <svelte:fragment slot="trail">
    <nav id="page-navigation" bind:this={navContainer}>
      <ul>
        {#each routes as route, index}
          <li>
            <a
              tabindex={index === 0 ? 0 : -1}
              id={getId(route)}
              href={route.path}
              bind:this={navLinks[index]}
              on:keydown={(e) => navigation.handleKeydown(e, index)}
              aria-current={$page.url.pathname === route.path ? 'page' : undefined}>{route.text}</a
            >
          </li>
        {/each}
      </ul>
    </nav>
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
