<script lang="ts">
  import { resolve } from '$app/paths';
  import { onMount } from 'svelte';
  import { Toaster } from '@skeletonlabs/skeleton-svelte';
  import { toaster } from '$lib/toaster';

  import { user } from '$lib/stores/User';
  import { goto } from '$app/navigation';

  import Footer from '$lib/components/Footer.svelte';
  import Dots from '$lib/components/Dots.svelte';
  import SiteBannerRegion from '$lib/components/banner/SiteBannerRegion.svelte';

  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();

  onMount(() => {
    if ($user && $user.token) {
      goto(resolve('/'));
    }
  });
</script>

<Toaster {toaster} />
<div class="h-full w-full overflow-y-auto flex flex-col">
  <SiteBannerRegion />
  <div class="min-h-0 flex-1 pb-14">
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
