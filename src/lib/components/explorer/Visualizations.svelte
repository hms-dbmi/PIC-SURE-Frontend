<script lang="ts">
  import { ProgressRing } from '@skeletonlabs/skeleton-svelte';
  import { onMount } from 'svelte';
  import { resources } from '$lib/configuration';
  import * as api from '$lib/api';
  import PlotlyPlot from '$lib/components/plots/PlotlyPlot.svelte';
  import {
    type PlotValues,
    type PlotlyNewPlot,
    createContinuousPlot,
    createCategoryPlot,
  } from '$lib/utilities/Plotly';
  import { getQueryRequest } from '$lib/QueryBuilder';
  import { page } from '$app/stores';

  const SYNC_URL = '/picsure/query/sync';

  const toastStore = getToastStore();

  let plotValues: PlotValues[] = $state([]);
  let newPlot: PlotlyNewPlot = $state() as PlotlyNewPlot;
  let loading = $state(true);

  const isOpenAccess = $page.url.pathname.includes('/discover');

  async function loadPlotData() {
    const query = getQueryRequest(!isOpenAccess, resources.visualization);
    const token = localStorage.getItem('token');

    await api
      .post(SYNC_URL, {
        query: query.query,
        resourceUUID: resources.visualization,
        resourceCredentials: token ? { Authorization: 'Bearer ' + token } : {},
      })
      .then((resp) => {
        plotValues = [
          ...(resp?.categoricalData || []).map(createCategoryPlot),
          ...(resp?.continuousData || []).map(createContinuousPlot),
        ];
      })
      .catch((error) => {
        console.error('Viusalzation failed with query: ' + JSON.stringify(query), error);
        toastStore.trigger({
          message:
            'An error occured while parsing your token. Please try again later. If this problem persists, please contact an administrator.',
          background: 'preset-filled-error-500',
        });
      })
      .finally(() => {
        loading = false;
      });
  }
  onMount(async () => {
    // Plotly cannot be imported normally, and must be pulled into the already rendered page.
    // Instead of loading it in each plot component, I'm passing down it's newPlot method.
    const Plotly = await import('plotly.js-dist-min');
    newPlot = Plotly.newPlot;
    await loadPlotData();
  });
</script>

<p class="mb-8 text-center">
  All visualizations display the distributions of each variable filter for the specified cohort.
</p>
<div id="visualizations" class="flex flex-row flex-wrap gap-6 items-center justify-center">
  {#if loading}
    <ProgressRing />
  {:else if plotValues.length}
    {#each plotValues as { data, layout, meta }, index}
      <PlotlyPlot {index} {data} {layout} {meta} {newPlot} />
    {/each}
  {:else}
    <div>No Visualizations Available</div>
  {/if}
</div>
