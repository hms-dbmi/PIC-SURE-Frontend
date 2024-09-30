<script lang="ts">
  import * as api from '$lib/api';
  import { ProgressRadial } from '@skeletonlabs/skeleton';
  import { branding, resources } from '$lib/configuration';
  import { browser } from '$app/environment';
  import { getBlankQueryRequest } from '$lib/QueryBuilder';
  import { getStudiesCount, getConceptCount } from '$lib/services/dictionary';

  const ERROR_VALUE = '-';
  type ApiMap = { [key: string]: () => Promise<string> };

  const isUserLoggedIn = () => {
    if (browser) {
      return !!localStorage.getItem('token');
    }
    return false;
  };

  const apiMap: ApiMap = {
    'Data Sources': () =>
      getStudiesCount(!isUserLoggedIn()).then((response) => {
        if (response) {
          return response.toLocaleString();
        }
        hasError = true;
        return ERROR_VALUE;
      }),
    Participants: () =>
      api
        .post(
          'picsure/query/sync',
          getBlankQueryRequest(
            isUserLoggedIn(),
            isUserLoggedIn() ? resources.hpds : resources.openHPDS,
          ),
        )
        .then((response) => {
          if (response) {
            return response.toLocaleString();
          }
          hasError = true;
          return ERROR_VALUE;
        }),
    Variables: () =>
      getConceptCount(!isUserLoggedIn()).then((response) => {
        if (response) {
          return response.toLocaleString();
        }
        hasError = true;
        return ERROR_VALUE;
      }),
  };

  async function getOrApi(key: string): Promise<string> {
    return apiMap[key]();
  }

  let width = branding?.landing?.stats.length;

  let hasError = false;

  let statMap: Map<string, Promise<string>> = new Map();
  branding?.landing?.stats?.forEach((stat) => {
    statMap.set(stat, getOrApi(stat));
  });
  let promises = statMap.values();
  //if any of the promises fail, we will set hasError to true
  Promise.allSettled(Array.from(promises)).then((results) => {
    results.forEach((result) => {
      if (result.status === 'rejected') {
        hasError = true;
      }
    });
  });
  /* eslint-disable svelte/no-at-html-tags */
  // @html branding.landing.explanation is from a static file and will only be populated by staff.
</script>

<section class="stats flex flex-col items-center w-full mt-auto p-4">
  <h2 class="m-4">Data Summary</h2>
  <div class="flex flex-wrap justify-evenlyp-4 my-4 gap-y-9 w-1/2">
    {#each Array.from(statMap) as [key, value] (key)}
      <div
        class="flex flex-col w-1/{width} p-4 [&:not(:last-child)]:border-r border-surface-400-500-token"
      >
        <div data-testid="value-{key}" class="flex flex-col justify-center items-center text-2xl">
          {#await value}
            <ProgressRadial
              width="w-10"
              meter="stroke-surface-50 dark:stroke-surface-900"
              track="stroke-secondary-500/30"
              value={undefined}
            />
          {:then statValue}
            <strong class="p-1 mb-3">{statValue}</strong>
          {:catch}
            <i class="fa-solid fa-circle-exclamation p-1 mb-4 mt-1"></i>
          {/await}
        </div>
        <p>{key}</p>
      </div>
    {/each}
  </div>
  <div class="w-2/4 p-8">
    {@html isUserLoggedIn() ? branding?.landing?.authExplanation : branding?.landing?.explanation}
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
