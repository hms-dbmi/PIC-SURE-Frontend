<script lang="ts">
  import type { LandingStat } from './landingStats.svelte.ts';

  import { countResult } from '#lib/query/counts/format.ts';
  import { sanitizeHTML } from '#lib/utils/html.ts';
  import Loading from '#lib/ui/Loading.svelte';
  import HelpTip from '#lib/ui/popover/HelpTip.svelte';
  interface Props {
    stats: LandingStat[];
    description: string;
    auth?: boolean;
  }

  let { stats, description, auth = false }: Props = $props();
  let authString = $derived(auth ? 'auth' : 'open');
  let width = $derived(stats.length > 4 ? 'w-full' : 'w-1/2');

  // Define explicit grid classes so Tailwind can detect them
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
    7: 'grid-cols-7',
    8: 'grid-cols-8',
    9: 'grid-cols-9',
    10: 'grid-cols-10',
    11: 'grid-cols-11',
    12: 'grid-cols-12',
  };

  const gridClass = $derived(
    gridClasses[stats.length as keyof typeof gridClasses] || 'grid-cols-1',
  );
</script>

<div data-testid="landing-summary-{authString}" class="w-full flex flex-col items-center">
  <div class="w-2/4">
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html sanitizeHTML(description)}
  </div>
  <div class="grid {gridClass} grid-flow-col justify-center p-2 my-2 gap-y-9 {width}">
    {#each stats as stat, i (`${authString}-${stat.key}-${stat.label}`)}
      <div class="p-2 not-last:border-r border-surface-500">
        <div
          data-testid="landing-stat-{authString}-{i}"
          class="flex flex-col justify-center items-center text-2xl"
        >
          {#if stat.snapshot}
            <div class="flex flex-row h-full">
              <strong class="p-1 mb-3">{countResult([stat.snapshot.count])}</strong>
            </div>
            {#if stat.snapshot.summary.hasError}
              <HelpTip
                type="exclamation"
                color="warning"
                data-testid="landing-stat-error-{authString}-{i}"
                text="We're having trouble fetching some data points right now. Please try again later."
              />
            {/if}
          {:else}
            <Loading ring size="mini" />
          {/if}
        </div>
        <p>{stat.label}</p>
      </div>
    {/each}
  </div>
</div>
