<script lang="ts">
  import { onMount } from 'svelte';
  import { config } from '#lib/config/config.svelte.ts';
  import { landingStats, statsMatch } from './landingStats.svelte.ts';
  import { session } from '#lib/auth/session.svelte.ts';
  import Stat from './Stat.svelte';

  const showAuthStats = $derived(session.isLoggedIn && landingStats.auth.length > 0);
  const showPublicStats = $derived(
    !showAuthStats ||
      (landingStats.open.length > 0 && !statsMatch(landingStats.open, landingStats.auth)),
  );

  onMount(() => landingStats.load());
</script>

<section class="flex flex-col items-center w-full p-4 my-3 bg-surface-100-900">
  <h2 class="m-2">Data Summary</h2>

  {#if showAuthStats}
    <Stat stats={landingStats.auth} auth description={config.branding.landing.authExplanation} />
  {/if}

  {#if showPublicStats}
    <Stat stats={landingStats.open} description={config.branding.landing.explanation} />
  {/if}
</section>
