<script lang="ts">
  import { onMount } from 'svelte';
  import { Toaster } from '@skeletonlabs/skeleton-svelte';
  import { toaster } from '$lib/toaster';

  import { user } from '$lib/stores/User';
  import { goto } from '$app/navigation';

  import Footer from '$lib/components/Footer.svelte';
  import Dots from '$lib/components/Dots.svelte';

  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();

  onMount(() => {
    if ($user && $user.token) {
      goto('/');
    }
  });
</script>

<Toaster {toaster} />
<div class="w-full full-height">
  <Dots class="top-dots" />
  <div class="alert-banner">
    <p>
      Because of a lapse in government funding, the information on this website may not be up to date,
      transactions submitted via the website may not be processed, and the agency may not be able to
      respond to inquiries until appropriations are enacted. The NIH Clinical Center (the research
      hospital of NIH) is open. For more details about its operating status, please visit <a
        href="http://cc.nih.gov/"
        class="anchor"
        target="_blank"
        rel="noopener noreferrer">cc.nih.gov.</a
      >
      Updates regarding government operating status and resumption of normal operations can be found at
      <a href="http://opm.gov/" class="anchor" target="_blank" rel="noopener noreferrer">opm.gov.</a>
    </p>
  </div>
  {@render children?.()}
  <Dots class="bottom-dots" />
  <div class="footer">
    <Footer showSitemap={false} />
  </div>
</div>

<style>
  .alert-banner {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: flex-start;
    position: relative;
    border-style: solid;
    border-image: initial;
    border-width: 0px 0px 6px;
    padding: 0.5rem 1rem 0.5rem 2rem;
    gap: 1rem;
    color: rgb(0, 0, 0);
    background: var(--color-error-50);
    border-color: var(--color-error-500);
  }
  .full-height {
    height: calc(100% - 56px);
  }
  .footer {
    position: fixed;
    bottom: 0;
    width: 100%;
  }
</style>
