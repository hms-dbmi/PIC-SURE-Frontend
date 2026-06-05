import {
  normalizeCount,
  type CategoricalPlotData,
  type ContinuousPlotData,
  type CountValue,
} from '$lib/utilities/Plotly';
import type { Filter } from '$lib/models/Filter.svelte';

export type VisualizationPlotData = CategoricalPlotData | ContinuousPlotData;

export function isVisualizationFilter(filter: Filter) {
  return !['genomic', 'snp', 'AnyRecordOf', 'FilterGroup'].includes(filter.filterType);
}

export function visualizationVariableLabel(filter: Filter) {
  const label =
    filter.searchResult?.display || filter.variableName || filter.searchResult?.name || filter.id;
  const study = filter.searchResult?.studyAcronym || filter.searchResult?.dataset;
  return study ? `${study} - ${label}` : label;
}

// Sums the upper bound of each value's uncertainty band (count + variance), so a chart
// whose only bucket is "< 10" (count 0, variance 9) still counts as potentially having
// data. Plain-number values from older backends are normalized to exact counts.
export function totalMapCount(map?: Record<string, CountValue>) {
  return Object.values(map || {}).reduce((total: number, value) => {
    const { count, variance } = normalizeCount(value);
    return total + count + (variance ?? 0);
  }, 0);
}

export function categoricalHasData(data: CategoricalPlotData, minimumCount: number) {
  return totalMapCount(data.categoricalMap) >= minimumCount;
}

export function continuousHasData(data: ContinuousPlotData, minimumCount: number) {
  return totalMapCount(data.continuousMap) >= minimumCount;
}

export function getIncludedConceptPaths(
  categoricalData: CategoricalPlotData[],
  continuousData: ContinuousPlotData[],
) {
  return new Set([
    ...categoricalData.map((data) => data.conceptPath),
    ...continuousData.map((data) => data.conceptPath),
  ]);
}

export function getExcludedVisualizationVariables(
  filters: Filter[],
  includedConceptPaths: Set<string | undefined>,
) {
  return filters
    .filter(isVisualizationFilter)
    .filter((filter) => !includedConceptPaths.has(filter.id))
    .map(visualizationVariableLabel);
}
