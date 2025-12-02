<script lang="ts">
  import { onMount } from 'svelte';

  import { config } from '$lib/configuration.svelte';
  import { stats, authStats, loadLandingStats } from '$lib/stores/Stats';

  import Stat from './Stat.svelte';

  onMount(loadLandingStats);
</script>

<section class="flex flex-col items-center w-full p-4 my-3 bg-surface-100-900">
  <h2 class="m-2">Data Summary</h2>

  {#if $authStats.length > 0}
    <Stat stats={authStats} auth description={config.branding.landing.authExplanation} />
  {/if}

  {#if $stats.length > 0}
    <Stat {stats} description={config.branding.landing.explanation} />
  {/if}
</section>
