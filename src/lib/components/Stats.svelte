<script lang="ts">
  import { ProgressRadial } from '@skeletonlabs/skeleton';

  import { getOrApi, ERROR_VALUE } from '$lib/utilities/Stats';
  import { branding } from '$lib/configuration';
  import type { Value } from '$lib/models/Value';

  let stats: Value[] = [];

  let getValues = async function () {
    stats = await Promise.all(
      branding.landing.stats.map(async (stat) => {
        let value = await getOrApi(stat);
        return { value, title: stat } as Value;
      }),
    );
  };
  let width = branding.landing.stats.length;

  $: hasError = stats.find((stat) => stat.value === ERROR_VALUE) || false;

  /* eslint-disable svelte/no-at-html-tags */
  // @html branding.landing.explanation is from a static file and will only be populated by staff.
</script>

<section class="stats flex flex-row flex-wrap justify-evenly items-center w-full px-4 gap-y-4">
  {#await getValues()}
    {#each branding.landing.stats as stat}
      <div id="value-{stat}" class="flex flex-col justify-center items-center">
        <ProgressRadial
          width="w-10"
          meter="stroke-surface-50 dark:stroke-surface-900"
          track="stroke-secondary-500/30"
          value={undefined}
        />
        <p>{stat}</p>
      </div>
    {/each}
  {:then}
    {#each stats as stat}
      <div class="flex flex-col w-1/{width}">
        <div data-testid="value-{stat.title}" class="flex flex-col justify-center items-center">
          {#if stat.value === ERROR_VALUE}
            <i class="fa-solid fa-circle-exclamation"></i>
          {:else}
            {stat.value}
          {/if}
        </div>
        <p>{stat.title}</p>
      </div>
    {/each}
  {/await}
  <div class="w-3/4">
    {@html branding.landing.explanation}
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
