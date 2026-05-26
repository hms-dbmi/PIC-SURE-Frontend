<script lang="ts">
  import { onMount } from 'svelte';
  import * as api from '$lib/api';
  import PlotlyPlot from '$lib/components/plots/PlotlyPlot.svelte';
  import {
    type PlotValues,
    type PlotlyNewPlot,
    createContinuousPlot,
    createCategoryPlot,
  } from '$lib/utilities/Plotly';
  import { getQueryRequestV3 } from '$lib/utilities/QueryBuilder';
  import { toaster } from '$lib/toaster';
  import Loading from '$lib/components/Loading.svelte';
  import { Picsure } from '$lib/paths';
  import { resources } from '$lib/stores/Resources';
  import { isOpenAccess } from '$lib/AccessState';
  import LogicTreeSummary from '$lib/components/explorer/advanced/LogicTreeSummary.svelte';
  import { filterTree, genomicFilters } from '$lib/stores/Filter';
  import { type FilterGroupInterface } from '$lib/models/Filter.svelte';

  let plotValues: PlotValues[] = $state([]);
  let newPlot: PlotlyNewPlot = $state() as PlotlyNewPlot;
  let loading = $state(true);

  async function loadPlotData() {
    const query = getQueryRequestV3(!isOpenAccess(), $resources.visualization);

    await api
      .post(
        Picsure.Visualization.Distributions,
        {
          query: query.query,
          hpdsResourceUUID: isOpenAccess() ? $resources.hpdsOpenV3 : $resources.hpdsAuth,
        },
        undefined,
        !isOpenAccess(),
      )
      .then((resp) => {
        plotValues = [
          ...(resp?.categoricalData || []).map(createCategoryPlot),
          ...(resp?.continuousData || []).map(createContinuousPlot),
        ];
      })
      .catch((error) => {
        console.error('Viusalzation failed with query: ' + JSON.stringify(query), error);
        toaster.error({
          description:
            'An error occured while parsing your token. Please try again later. If this problem persists, please contact an administrator.',
        });
      })
      .finally(() => {
        loading = false;
      });
  }
  onMount(async () => {
    // Plotly cannot be imported normally, and must be pulled into the already rendered page.
    // Instead of loading it in each plot component, I'm passing down it's newPlot method.
    const Plotly = await import('plotly.js-basic-dist-min');
    newPlot = Plotly.newPlot;
    await loadPlotData();
  });
</script>

<p class="mb-8 text-center">
  All visualizations display the distributions of each variable filter for the specified cohort.
</p>
<LogicTreeSummary
  root={$filterTree.root as FilterGroupInterface}
  genomicFilters={$genomicFilters}
  widthClass="w-3/4"
/>
<div id="visualizations" class="flex flex-row flex-wrap gap-6 items-center justify-center">
  {#if loading}
    <Loading ring size="medium" />
  {:else if plotValues.length}
    {#each plotValues as { data, layout, meta }, index}
      <PlotlyPlot {index} {data} {layout} {meta} {newPlot} />
    {/each}
  {:else}
    <div>No Visualizations Available</div>
  {/if}
</div>
