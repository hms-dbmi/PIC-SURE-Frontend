<script lang="ts">
  import { onMount } from 'svelte';
  import { branding } from '$lib/configuration';
  import { StatPromise, isStatValueEqual } from '$lib/utilities/StatBuilder';
  import type { StatResult } from '$lib/models/Stat';
  import { stats, authStats, loadLandingStats } from '$lib/stores/Stats';
  import { isUserLoggedIn } from '$lib/stores/User';
  import Stat from '$lib/components/landing/Stat.svelte';

  const showAuthStats = $derived(isUserLoggedIn() && $authStats.length > 0);

  let isStatsMatching = $state(false);

  async function checkStatsMatching(publicStats: StatResult[], authStats: StatResult[]) {
    if (publicStats.length === 0 || authStats.length === 0) return false;

    const publicMap = new Map(publicStats.map((s) => [s.key, s]));
    const authMap = new Map(authStats.map((s) => [s.key, s]));

    if (publicMap.size !== authMap.size) return false;

    for (const [key, publicStat] of publicMap) {
      const authStat = authMap.get(key);
      if (!authStat || publicStat.label !== authStat.label) return false;

      const publicList = StatPromise.list(publicStat);
      const authList = StatPromise.list(authStat);

      const getValues = async (list: ReturnType<typeof StatPromise.list>) => {
        const values = await Promise.all(list.map((p) => p.promise.catch(() => null)));
        return new Map(list.map((item, i) => [item.resourceName, values[i]]));
      };

      const publicValues = await getValues(publicList);
      const authValues = await getValues(authList);

      if (publicValues.size !== authValues.size) return false;

      if (publicValues.size === 1) {
        const publicVal = publicValues.values().next().value;
        const authVal = authValues.values().next().value;
        if (!isStatValueEqual(publicVal, authVal)) return false;
      } else {
        for (const [res, val] of publicValues) {
          if (!authValues.has(res)) return false;
          if (!isStatValueEqual(val, authValues.get(res))) return false;
        }
      }
    }
    return true;
  }

  $effect(() => {
    checkStatsMatching($stats, $authStats).then((match) => (isStatsMatching = match));
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
