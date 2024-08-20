<script lang="ts">
  import { onMount } from 'svelte';
  import type { Root, Data, Layout } from 'plotly.js';

  import { type PlotMeta, type PlotlyNewPlot, defaultPlotlyConfig } from '$lib/utilities/Plotly';

  export let index: number;
  export let data: Data[];
  export let meta: PlotMeta;
  export let layout: Partial<Layout>;
  export let newPlot: PlotlyNewPlot;

  const screenReaderText = meta.isCategorical
    ? 'Column chart showing the visualization of '
    : 'Histogram showing the visualization of ';

  let plotContainer: Root;

  onMount(async () => {
    newPlot(plotContainer, data, layout, {
      ...defaultPlotlyConfig,
      toImageButtonOptions: {
        filename: meta.unformatedTitle,
      },
    });
  });
</script>

<div
  id="plot-{index}"
  aria-label={screenReaderText + meta.unformatedTitle}
  title={'Visualization of ' + meta.unformatedTitle}
  bind:this={plotContainer}
></div>
