<script lang="ts">
  import type { Readable } from 'svelte/store';

  import type { Stat } from '$lib/types';
  import { promiseList } from '$lib/utilities/StatBuilder';
  import { countResult } from '$lib/utilities/PatientCount';
  import Loading from '$lib/components/Loading.svelte';

  interface Props {
    stats: Readable<Stat[]>;
    description: string;
    auth?: boolean;
  }

  let { stats, description, auth = false }: Props = $props();
  let authString = $derived(auth ? 'auth' : 'open');
  let width = $derived($stats.length > 4 ? 'w-full' : 'w-1/2');

  /* eslint-disable svelte/no-at-html-tags */
  // @html explanation is passed down from a static file
</script>

<div data-testid="data-summary-{authString}" class="w-full flex flex-col items-center">
  <div class="w-2/4">
    {@html description}
  </div>
  <div class="grid grid-cols-{$stats.length} grid-flow-col justify-center p-4 my-4 gap-y-9 {width}">
    {#each $stats as stat (`${authString}-${stat.key}-${stat.label}`)}
      <div class="p-4 not-last:border-r border-surface-500">
        <div
          data-testid="value-{authString}-{stat.key}-{stat.label}"
          class="flex flex-col justify-center items-center text-2xl"
        >
          {#await Promise.allSettled(promiseList(stat))}
            <Loading ring size="mini" />
          {:then counts}
            <strong class="p-1 mb-3">
              {countResult(
                counts.filter((count) => count.status === 'fulfilled').map((count) => count.value),
              )}
            </strong>
            {#if counts.some((count) => count.status === 'rejected')}
              <i class="fa-solid fa-circle-exclamation p-1 mb-4 mt-1"></i>
            {/if}
          {/await}
        </div>
        <p>{stat.label}</p>
      </div>
    {/each}
  </div>
</div>
