<script lang="ts">
  import { onMount } from 'svelte';
  import * as api from '$lib/api';
  import PlotlyPlot from '$lib/components/plots/PlotlyPlot.svelte';
  import {
    type PlotValues,
    type PlotlyNewPlot,
    type CategoricalPlotData,
    type ContinuousPlotData,
    createContinuousPlot,
    createCategoryPlot,
  } from '$lib/utilities/Plotly';
  import { getQueryRequestV3 } from '$lib/utilities/QueryBuilder';
  import {
    categoricalHasData,
    continuousHasData,
    getExcludedVisualizationVariables,
    getIncludedConceptPaths,
    isVisualizationFilter,
  } from '$lib/utilities/VisualizationData';
  import { toaster } from '$lib/toaster';
  import Loading from '$lib/components/Loading.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import { Picsure } from '$lib/paths';
  import { isOpenAccess } from '$lib/AccessState';
  import LogicTreeSummary from '$lib/components/explorer/advanced/LogicTreeSummary.svelte';
  import { filters, filterTree, genomicFilters } from '$lib/stores/Filter';
  import { type Filter, type FilterGroupInterface } from '$lib/models/Filter.svelte';
  import { get } from 'svelte/store';

  let plotValues: PlotValues[] = $state([]);
  let excludedVariables: string[] = $state([]);
  let newPlot: PlotlyNewPlot = $state() as PlotlyNewPlot;
  let loading = $state(true);

  function getSubtitleByConceptPath(filters: Filter[]) {
    return new Map(
      filters.map((filter) => {
        const dataset = filter.searchResult?.table?.display ?? filter.searchResult?.table?.dataset;
        return [
          filter.id,
          [
            filter.searchResult?.studyAcronym && `Study: ${filter.searchResult.studyAcronym}`,
            dataset && `Dataset: ${dataset}`,
          ]
            .filter(Boolean)
            .join(' '),
        ];
      }),
    );
  }

  async function loadPlotData() {
    const plotFilters = get(filters);
    const visualizationFilters = plotFilters.filter(isVisualizationFilter);
    const subtitleByConceptPath = getSubtitleByConceptPath(plotFilters);
    const minimumCount = 1;

    const getSubtitle = (conceptPath?: string) =>
      conceptPath ? subtitleByConceptPath.get(conceptPath) : undefined;
    const withSubtitle = <T extends { conceptPath?: string }>(
      data: T,
    ): T & { subtitle?: string } => ({
      ...data,
      subtitle: getSubtitle(data.conceptPath),
    });

    const query = getQueryRequestV3(!isOpenAccess());

    // ⚠ GATEWAY GAP (see paths.ts VIZ): the visualization service still selects its HPDS backend from
    // `hpdsResourceUUID` in the body, which came from the now-removed resource registry. This is left
    // empty pending the wiring of the gateway `/visualization` route and the viz service's own
    // migration to path-based backend selection. Tracked in the PR's open questions.
    await api
      .post(
        Picsure.Visualization.Distributions,
        {
          query: query.query,
          hpdsResourceUUID: '',
        },
        undefined,
        !isOpenAccess(),
      )
      .then((resp) => {
        const categoricalData = (resp?.categoricalData || []).filter((data: CategoricalPlotData) =>
          categoricalHasData(data, minimumCount),
        );
        const continuousData = (resp?.continuousData || []).filter((data: ContinuousPlotData) =>
          continuousHasData(data, minimumCount),
        );
        const includedConceptPaths = getIncludedConceptPaths(categoricalData, continuousData);

        excludedVariables = getExcludedVisualizationVariables(
          visualizationFilters,
          includedConceptPaths,
        );

        plotValues = [
          ...categoricalData.map((data: CategoricalPlotData) =>
            createCategoryPlot(withSubtitle(data)),
          ),
          ...continuousData.map((data: ContinuousPlotData) =>
            createContinuousPlot(withSubtitle(data)),
          ),
        ];
      })
      .catch((error) => {
        console.error('Viusalzation failed with query: ' + JSON.stringify(query), error);
        toaster.error({
          description:
            'An error occured while loading your visualization(s). Please try again later. If this problem persists, please contact an administrator.',
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
{#if excludedVariables.length}
  <div class="w-3/4 mx-auto my-4">
    <ErrorAlert color="warning" iconSize="4xl" data-testid="excluded-visualizations-warning">
      <p class="mb-1">
        Some variables were excluded from visualization because there was insufficient participant
        data for the selected query.
      </p>
      <p class="font-bold py-0 my-0">Variables not included:</p>
      <ul class="list-disc list-inside ml-8">
        {#each excludedVariables as variable}
          <li>{variable}</li>
        {/each}
      </ul>
    </ErrorAlert>
  </div>
{/if}
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
