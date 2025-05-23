<script lang="ts">
  import { onMount } from 'svelte';
  import type { Root, Data, Layout } from 'plotly.js-basic-dist-min';

  import { type PlotMeta, type PlotlyNewPlot, defaultPlotlyConfig } from '$lib/utilities/Plotly';

  interface Props {
    index: number;
    data: Data[];
    meta: PlotMeta;
    layout: Partial<Layout>;
    newPlot: PlotlyNewPlot;
  }

  let { index, data, meta, layout, newPlot }: Props = $props();

  const screenReaderText = meta.isCategorical
    ? 'Column chart showing the visualization of '
    : 'Histogram showing the visualization of ';

  let plotContainer: Root = $state('');

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
