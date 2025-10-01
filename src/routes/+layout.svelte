<script lang="ts">
  import type { Snippet } from 'svelte';
  import '@fortawesome/fontawesome-free/css/all.min.css';
  import '../styles/app.css';
  import { initializeBranding } from '$lib/configuration';
  import GoogleTracking from '$lib/components/tracking/GoogleTracking.svelte';
  
  let { children }: { children?: Snippet } = $props();

  initializeBranding();
</script>

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

<main class="w-full h-full">
  {@render children?.()}
  <GoogleTracking />
</main>

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
</style>
