<script lang="ts">
  import { onMount } from 'svelte';
  import { getDistributions } from '#lib/api/picsure/visualization.ts';
  import PlotlyPlot from '#lib/explorer/visualizations/PlotlyPlot.svelte';
  import {
    type PlotValues,
    type PlotlyNewPlot,
    createContinuousPlot,
    createCategoryPlot,
  } from '#lib/explorer/visualizations/plotly.ts';
  import type {
    CategoricalPlotData,
    ContinuousPlotData,
  } from '#lib/api/picsure/visualization.types.ts';
  import { buildRequest } from '#lib/query/build.ts';
  import {
    categoricalHasData,
    continuousHasData,
    getExcludedVisualizationVariables,
    getIncludedConceptPaths,
    isVisualizationFilter,
  } from '#lib/explorer/visualizations/data.ts';
  import { toaster } from '#lib/ui/toaster.ts';
  import TimedLoading, { type TimedMessage } from '#lib/ui/TimedLoading.svelte';
  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';
  import { isOpenAccess, useOpenAccess } from '#lib/explorer/mode.ts';
  import LogicTreeSummary from '#lib/explorer/advanced/LogicTreeSummary.svelte';
  import { filterState } from '#lib/query/filters.svelte.ts';
  import { type Filter, type FilterGroupInterface } from '#lib/query/filter.svelte.ts';

  const LOADING_MESSAGES: TimedMessage[] = [
    { afterMs: 0, text: 'Generating visualizations…' },
    { afterMs: 3000, text: 'Still working on it…' },
    { afterMs: 7000, text: 'Hang tight…' },
  ];

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
    const plotFilters = filterState.phenotypic;
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

    const query = buildRequest(filterState.queryFilters);

    const openAccess = isOpenAccess();
    await getDistributions(query.query, { openEndpoint: useOpenAccess(openAccess), openAccess })
      .then((resp) => {
        const categoricalData = resp.categoricalData.filter((data) =>
          categoricalHasData(data, minimumCount),
        );
        const continuousData = resp.continuousData.filter((data) =>
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
  root={filterState.tree.root as FilterGroupInterface}
  genomicFilters={filterState.genomic}
  widthClass="w-3/4"
/>
{#if excludedVariables.length}
  <div class="w-3/4 mx-auto my-4">
    <ErrorAlert
      color="warning"
      iconSize="4xl"
      data-testid="explorer-visualizations-excluded-warning"
    >
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
<div id="explorer-visualizations" class="flex flex-row flex-wrap gap-6 items-center justify-center">
  {#if loading}
    <TimedLoading size="medium" messages={LOADING_MESSAGES} />
  {:else if plotValues.length}
    {#each plotValues as { data, layout, meta }, index}
      <PlotlyPlot {index} {data} {layout} {meta} {newPlot} />
    {/each}
  {:else}
    <div>No Visualizations Available</div>
  {/if}
</div>
