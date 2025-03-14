<script lang="ts">
  import { onMount } from 'svelte';

  import { branding, features } from '$lib/configuration';
  import { stats, authStats, hasError, loadStats } from '$lib/stores/Stats';

  import Stat from './landing/Stat.svelte';

  onMount(() => loadStats());
</script>

<section class="flex flex-col items-center w-full p-4 bg-surface-300-600-token">
  <h2 class="m-4">Data Summary</h2>

  {#if features.login.open && $authStats.length > 0}
    <Stat stats={authStats} auth={true} description={branding?.landing?.authExplanation} />
  {/if}

  <Stat {stats} description={branding?.landing?.explanation} />

  {#if $hasError}
    <div
      id="landing-errors"
      class="alert variant-filled-error text-error-50-900-token 200-700-token w-3/4 px-4 mb-6"
    >
      <div><i class="fa-solid fa-circle-exclamation text-4xl"></i></div>
      <div class="alert-message">
        <p>We're having trouble fetching some data points right now. Please try again later.</p>
      </div>
    </div>
  {/if}
</section>
