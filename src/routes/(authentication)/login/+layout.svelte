<script lang="ts">
  import { user } from '$lib/stores/User';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import Footer from '$lib/components/Footer.svelte';
  import Dots from '$lib/components/Dots.svelte';
  import { Toast } from '@skeletonlabs/skeleton';

  onMount(() => {
    if ($user && $user.token) {
      goto('/');
    }
  });
</script>

<Toast position="t" />
<div class="w-full full-height">
  <Dots class="top-dots" />
  <slot />
  <Dots class="bottom-dots" />
  <div class="footer">
    <Footer showSitemap={false} />
  </div>
</div>

<style>
  .full-height {
    height: calc(100% - 56px);
  }
  .footer {
    position: fixed;
    bottom: 0;
    width: 100%;
  }
</style>
