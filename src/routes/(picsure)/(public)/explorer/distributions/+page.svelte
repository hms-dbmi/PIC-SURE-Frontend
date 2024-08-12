<script lang="ts">
  import { getToastStore } from '@skeletonlabs/skeleton';
  import { onMount } from 'svelte';

  import { resources } from '$lib/configuration';
  import * as api from '$lib/api';
  import FilterStore from '$lib/stores/Filter';

  import { branding } from '$lib/configuration';
  import Content from '$lib/components/Content.svelte';
  import PlotlyPlot from '$lib/components/plots/PlotlyPlot.svelte';

  import {
    type PlotValues,
    type PlotlyNewPlot,
    createContinuousPlot,
    createCategoryPlot,
  } from '$lib/utilities/Plotly';

  const SYNC_URL = '/picsure/query/sync';

  const { getQueryRequest } = FilterStore;
  const toastStore = getToastStore();

  let plotValues: PlotValues[] = [];
  let newPlot: PlotlyNewPlot;

  async function loadPlotData() {
    const query = getQueryRequest();
    const token = localStorage.getItem('token');

    await api
      .post(SYNC_URL, {
        ...query,
        resourceUUID: resources.Visualizer,
        resourceCredentials: { Authorization: 'Bearer ' + token },
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
          background: 'variant-filled-error',
        });
      });
  }
  onMount(async () => {
    // Plotly cannot be imported normally, and must be pulled into the already rendered page.
    // Instead of loading it in each plot component, I'm passing down it's newPlot method.
    const Plotly = await import('plotly.js-dist-min');
    newPlot = Plotly.newPlot;
    loadPlotData();
  });
</script>

<svelte:head>
  <title>{branding.applicationName} | Variant Explorer</title>
</svelte:head>

<Content full={true} backUrl="/explorer" backTitle="Back to Cohort Builder">
  {#each plotValues as { data, layout, meta }, index}
    <PlotlyPlot {index} {data} {layout} {meta} {newPlot} />
  {/each}
</Content>
