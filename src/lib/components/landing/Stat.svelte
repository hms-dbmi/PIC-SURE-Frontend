<script lang="ts">
  import type { Readable } from 'svelte/store';

  import type { StatResult } from '$lib/models/Stat';
  import { StatPromise } from '$lib/utilities/StatBuilder';
  import { countResult } from '$lib/utilities/PatientCount';
  import { sanitizeHTML } from '$lib/utilities/HTML';
  import Loading from '$lib/components/Loading.svelte';
  import { features } from '$lib/stores/Configuration';
  interface Props {
    stats: Readable<StatResult[]>;
    description: string;
    auth?: boolean;
  }

  let { stats, description, auth = false }: Props = $props();
  let authString = $derived(auth ? 'auth' : 'open');
  let width = $derived($stats.length > 4 ? 'w-full' : 'w-1/2');

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
    gridClasses[$stats.length as keyof typeof gridClasses] || 'grid-cols-1',
  );
</script>

<div data-testid="data-summary-{authString}" class="w-full flex flex-col items-center">
  <div class="w-2/4">
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html sanitizeHTML(description)}
  </div>
  <div class="grid {gridClass} grid-flow-col justify-center p-2 my-2 gap-y-9 {width}">
    {#each $stats as stat (`${authString}-${stat.key}-${stat.label}`)}
      <div class="p-2 not-last:border-r border-surface-500">
        <div
          data-testid="value-{authString}-{stat.key}-{stat.label}"
          class="flex flex-col justify-center items-center text-2xl"
        >
          {#await Promise.allSettled(StatPromise.list(stat))}
            <Loading ring size="mini" />
          {:then counts}
            <strong class="p-1 mb-3">
              {countResult(counts.filter(StatPromise.fullfiled).map(({ value }) => value))}
            </strong>
            {#if !$features.federated && counts.some(StatPromise.rejected)}
              <i class="fa-solid fa-circle-exclamation p-1 mb-4 mt-1"></i>
            {/if}
          {/await}
        </div>
        <p>{stat.label}</p>
      </div>
    {/each}
  </div>
</div>
