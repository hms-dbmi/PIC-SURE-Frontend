<script lang="ts">
  import { page } from '$app/stores';
  import { AppBar } from '@skeletonlabs/skeleton';
  import logo from '$lib/assets/app-logo.png';

  const routes = [
    { path: '/explorer', text: 'Query Builder' },
    { path: '/users', text: 'Users' },
    { path: '/api', text: 'API' },
    { path: '/dataset', text: 'Dataset Management' },
    { path: '/help', text: 'Help' },
    { path: '/admin', text: 'Admin' },
    { path: '/admin/super', text: 'Super Admin' },
    { path: '/#', id: 'logout', text: 'Logout' },
  ];

  function getId({ path, id }: { path: string; id?: string; text: string }) {
    return `nav-link` + (id ? `-` + id : path.replaceAll('/', '-'));
  }
</script>

<AppBar padding="p-0">
  <svelte:fragment slot="lead">
    <a href="/" aria-current="page"
      ><img id="nav-logo" alt="PIC-Sure logo" src={logo} class="mx-1" /></a
    >
  </svelte:fragment>
  <svelte:fragment slot="trail">
    <nav id="page-navigation">
      {#each routes as route}
        <a
          id={getId(route)}
          href={route.path}
          aria-current={$page.url.pathname === route.path ? 'page' : undefined}>{route.text}</a
        >
      {/each}
    </nav>
  </svelte:fragment>
</AppBar>
