<script lang="ts">
  import { onMount } from 'svelte';

  import { branding } from '$lib/configuration';
  import { stats, authStats, hasError, loadLandingStats } from '$lib/stores/Stats';

  import Stat from './Stat.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';

  onMount(loadLandingStats);
</script>

<section class="flex flex-col items-center w-full p-4 my-3 bg-surface-100-900">
  <h2 class="m-2">Data Summary</h2>

  {#if $authStats.length > 0}
    <Stat stats={authStats} auth description={branding?.landing?.authExplanation} />
  {/if}

  {#if $stats.length > 0}
    <Stat {stats} description={branding?.landing?.explanation} />
  {/if}

  {#if $hasError}
    <ErrorAlert data-testid="landing-error" solid>
      We're having trouble fetching some data points right now. Please try again later.
    </ErrorAlert>
  {/if}
</section>
