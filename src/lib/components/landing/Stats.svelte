<script lang="ts">
  import { onMount } from 'svelte';

  import { branding } from '$lib/configuration';
  import { stats, authStats, hasError, loadLandingStats } from '$lib/stores/Stats';

  import Stat from './Stat.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import { isUserLoggedIn } from '$lib/stores/User';

  const showAuthStats = $derived(isUserLoggedIn() && $authStats.length > 0);
  const isStatsMatching = $derived(() => {
    if ($authStats.length === 0 || $stats.length === 0) return false;

    const authStatsByKey = new Map($authStats.map(stat => [stat.key, stat]));
    const publicStatsByKey = new Map($stats.map(stat => [stat.key, stat]));
    
    for (const authStat of $authStats) {
      const matchingPublicStat = publicStatsByKey.get(authStat.key);
      if (!matchingPublicStat) return false;
      if (authStat.label !== matchingPublicStat.label) return false;
    }
     
    for (const publicStat of $stats) {
      const matchingAuthStat = authStatsByKey.get(publicStat.key);
      if (!matchingAuthStat) return false;
    }
    
    return true;
  });
  const showPublicStats = $derived(($stats.length > 0 && !isStatsMatching) || $authStats.length === 0);

  onMount(loadLandingStats);
</script>

<section class="flex flex-col items-center w-full p-4 bg-surface-100-900">
  <h2 class="m-4">Data Summary</h2>

  {#if showAuthStats}
    <Stat stats={authStats} auth description={branding?.landing?.authExplanation} />
  {/if}

  {#if showPublicStats}
    <Stat {stats} description={branding?.landing?.explanation} />
  {/if}

  {#if $hasError}
    <ErrorAlert data-testid="landing-error" solid>
      We're having trouble fetching some data points right now. Please try again later.
    </ErrorAlert>
  {/if}
</section>
