<script lang="ts">
  import { onMount } from 'svelte';
  import { branding } from '$lib/configuration';
  import { stats, authStats, loadLandingStats } from '$lib/stores/Stats';
  import { isUserLoggedIn } from '$lib/stores/User';
  import Stat from '$lib/components/landing/Stat.svelte';

  const showAuthStats = $derived(isUserLoggedIn() && $authStats.length > 0);

  const isStatsMatching = $derived(() => {
    if ($authStats.length === 0 || $stats.length === 0) return false;
    const publicLabelsByKey = new Map($stats.map((s) => [s.key, s.label]));
    const authKeys = new Set($authStats.map((s) => s.key));
    return (
      $authStats.every((s) => publicLabelsByKey.get(s.key) === s.label) &&
      $stats.every((s) => authKeys.has(s.key))
    );
  });

  const showPublicStats = $derived(
    ($stats.length > 0 && !isStatsMatching) || $authStats.length === 0,
  );

  onMount(loadLandingStats);
</script>

<section class="flex flex-col items-center w-full p-4 my-3 bg-surface-100-900">
  <h2 class="m-2">Data Summary</h2>

  {#if showAuthStats}
    <Stat stats={authStats} auth description={branding?.landing?.authExplanation} />
  {/if}

  {#if showPublicStats}
    <Stat {stats} description={branding?.landing?.explanation} />
  {/if}
</section>
