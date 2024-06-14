<script lang="ts">
  import '../../../app.postcss';
  import { user } from '$lib/stores/User';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import Footer from '$lib/components/Footer.svelte';
  import Dots from '$lib/components/Dots.svelte';

  onMount(() => {
    if ($user && $user.token) {
      goto('/');
    }
  });
</script>

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
    background-color: #f5f5f5;
    text-align: center;
  }
</style>
