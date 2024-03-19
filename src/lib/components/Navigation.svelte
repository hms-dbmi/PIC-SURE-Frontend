<script lang="ts">
  import { AppBar, type ModalSettings, getModalStore } from '@skeletonlabs/skeleton';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import logo from '$lib/assets/app-logo.png';
  import { user, logout, login } from '$lib/stores/User';
  import { KeyboardNavigation } from '$lib/utilities/KeyNavigation';

  const modalStore = getModalStore();

  const routes = [
    { path: '/users', text: 'Users' },
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
      getElement: (index: number) => navLinks[index],
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
  });

  function getId({ path, id }: { path: string; id?: string; text: string }) {
    return `nav-link` + (id ? `-` + id : path.replaceAll('/', '-'));
  }

  function handleLogout() {
    logout();
    goto('/');
  }

  function handleLogin() {
    const modal: ModalSettings = {
      type: 'prompt',
      title: 'Enter Long Term Token',
      body: 'Provide your long term token below.',
      valueAttr: { type: 'text', required: true, placeholder: 'Enter token here...' },
      response: (r: string) => login(r),
    };
    modalStore.trigger(modal);
  }
</script>

<AppBar padding="py-0 pl-2 pr-5" background="bg-surface-50">
  <svelte:fragment slot="lead">
    <a href="/" aria-current="page" data-testid="logo-home-link">
      <img id="nav-logo" alt="PIC-Sure logo" src={logo} class="mx-1" />
    </a>
  </svelte:fragment>
  <svelte:fragment slot="trail">
    <nav
      id="page-navigation"
      bind:this={navContainer}
      on:focusin={() => navigation.navFocus(true)}
      on:focusout={() => navigation.navFocus(false)}
    >
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
    <div>
      <button
        id="user-session-btn"
        title={$user.email ? 'Logout user ' + $user.email : 'Login'}
        on:click={$user.privileges ? handleLogout : handleLogin}
      >
        <span
          class="avatar flex aspect-square justify-center items-center overflow-hidden isolate variant-ringed-surface hover:variant-ghost-secondary w-16 rounded-full text-2xl"
        >
          {#if $user.privileges && $user.email}
            {$user.email[0].toUpperCase()}
            <span class="sr-only">Loggout user {$user.email}</span>
          {:else}
            <i class="fa-solid fa-user fa-lg"></i>
            <span class="sr-only">Login</span>
          {/if}
        </span>
      </button>
    </div>
  </svelte:fragment>
</AppBar>
