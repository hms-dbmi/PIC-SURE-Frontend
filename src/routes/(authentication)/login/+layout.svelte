<script lang="ts">
  import { resolve } from '$app/paths';
  import { onMount } from 'svelte';
  import Toaster from '#lib/ui/Toaster.svelte';

  import { session } from '#lib/auth/session.svelte.ts';
  import { goto } from '$app/navigation';

  import Footer from '#lib/shell/Footer.svelte';
  import Dots from './Dots.svelte';
  import SiteBannerRegion from '#lib/banners/components/SiteBannerRegion.svelte';

  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();

  onMount(() => {
    // An expired session stays, so the login page can end it.
    if (session.hasValidToken && session.user.token) {
      goto(resolve(''));
    }
  });
</script>

<Toaster />
<div class="h-full w-full overflow-y-auto flex flex-col">
  <SiteBannerRegion />
  <div class="relative flex-auto pb-14">
    <Dots class="top-dots" />
    {@render children?.()}
    <Dots class="bottom-dots" />
  </div>
  <div class="footer">
    <Footer showSitemap={false} />
  </div>
</div>

<style>
  .footer {
    position: fixed;
    bottom: 0;
    width: 100%;
  }
</style>
