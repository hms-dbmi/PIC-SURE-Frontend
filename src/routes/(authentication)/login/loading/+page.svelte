<script lang="ts">
  import { page } from '$app/stores';
  import { ProgressRadial } from '@skeletonlabs/skeleton';
  import * as api from '$lib/api';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { login } from '$lib/stores/User';
  import type { User } from '$lib/models/User';
  //parse the query string
  let failed = false;
  onMount(async () => {
    let redirectTo = $page.url.searchParams.get('redirectTo');
    redirectTo = !redirectTo ? '/' : redirectTo;
    const hashParts = $page.url.hash.split('&');
    if (!hashParts || hashParts.length === 0) {
      failed = true;
      return;
    }
    const auth0ResponseMap: Map<string, string> = hashParts.reduce((map, part) => {
      const [key, value] = part.split('=');
      map.set(key, value);
      return map;
    }, new Map<string, string>());
    const token = auth0ResponseMap.get('#access_token');
    const redirectURI = `${window.location.protocol}//${window.location.hostname}${
      window.location.port ? ':' + window.location.port : ''
    }${redirectTo}`;
    if (token) {
      try {
        //TODO: handle errors
        const res = await api.post('psama/authentication', {
          access_token: token,
          redirectURI: redirectURI,
        });
        const newUser: User = res;
        if (newUser?.token) {
          login(newUser.token);
        } else {
          failed = true;
          return;
        }
        goto(redirectTo);
      } catch (error) {
        failed = true;
      }
    } else {
      failed = true;
    }
  });
</script>

<section class="w-full h-full flex flex-col justify-center items-center">
  {#if !failed}
    <h1 class="m-10">Logging you in...</h1>
    <ProgressRadial width="w-20" />
  {/if}
</section>
