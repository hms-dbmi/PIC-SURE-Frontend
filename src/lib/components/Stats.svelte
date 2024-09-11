<script lang="ts">
  import { onMount } from 'svelte';
  import { ProgressRadial } from '@skeletonlabs/skeleton';

  import { getOrApi, ERROR_VALUE } from '$lib/stores/Stats';
  import { branding } from '$lib/configuration';
  import type { Value } from '$lib/models/Value';

  let stats: Value[] = branding?.landing?.stats?.map((stat) => ({
    title: stat,
    value: ERROR_VALUE,
    loading: true,
  }));
  let width = branding?.landing?.stats.length;
  $: hasError = stats.find((stat) => !stat.loading && stat.value === ERROR_VALUE) || false;

  onMount(async () => {
    stats = await Promise.all(
      branding?.landing?.stats?.map(async (stat) => {
        let value = await getOrApi(stat);
        return { value, title: stat, loading: false } as Value;
      }),
    );
  });

  /* eslint-disable svelte/no-at-html-tags */
  // @html branding.landing.explanation is from a static file and will only be populated by staff.
</script>

<section class="stats flex flex-col items-center w-full mt-auto p-4">
  <h2 class="m-4">Data Summary</h2>
  <div class="flex flex-wrap justify-evenlyp-4 my-4 gap-y-9 w-1/2">
    {#each stats as stat}
      <div
        class="flex flex-col w-1/{width} p-4 [&:not(:last-child)]:border-r border-surface-400-500-token"
      >
        <div
          data-testid="value-{stat.title}"
          class="flex flex-col justify-center items-center text-2xl"
        >
          {#if stat.loading}
            <ProgressRadial
              width="w-10"
              meter="stroke-surface-50 dark:stroke-surface-900"
              track="stroke-secondary-500/30"
              value={undefined}
            />
          {:else if stat.value === ERROR_VALUE}
            <i class="fa-solid fa-circle-exclamation p-1 mb-4 mt-1"></i>
          {:else}
            <strong class="p-1 mb-3">{stat.value}</strong>
          {/if}
        </div>
        <p>{stat.title}</p>
      </div>
    {/each}
  </div>
  <div class="w-2/4 p-8">
    {@html branding?.landing?.explanation}
  </div>
  {#if hasError}
    <div
      id="landing-errors"
      class="alert variant-ghost-secondary text-surface-200-700-token w-3/4 px-4"
    >
      <div><i class="fa-solid fa-circle-exclamation text-4xl"></i></div>
      <div class="alert-message">
        <p>We're having trouble fetching some data points right now. Please try again later.</p>
      </div>
    </div>
  {/if}
</section>

<style lang="postcss">
  .stats {
    font-size: 1rem;
    padding: 1rem;
    @apply bg-surface-300-600-token;
  }

  .stats a {
    text-decoration: underline;
  }
</style>
