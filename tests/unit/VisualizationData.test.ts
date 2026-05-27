import { describe, expect, it } from 'vitest';
import {
  categoricalHasData,
  continuousHasData,
  getExcludedVisualizationVariables,
  getIncludedConceptPaths,
  isVisualizationFilter,
  visualizationVariableLabel,
} from '$lib/utilities/VisualizationData';
import type { CategoricalPlotData, ContinuousPlotData } from '$lib/utilities/Plotly';
import type { Filter } from '$lib/models/Filter.svelte';

function categorical(conceptPath: string | undefined, categoricalMap: Record<string, number>) {
  return { conceptPath, categoricalMap } as CategoricalPlotData;
}

function continuous(conceptPath: string | undefined, continuousMap: Record<string, number>) {
  return { conceptPath, continuousMap } as ContinuousPlotData;
}

function filter(overrides: Partial<Filter> = {}) {
  return {
    id: '\\study\\variable\\',
    filterType: 'Categorical',
    variableName: 'Variable name',
    searchResult: {
      display: 'Display label',
      name: 'Search result name',
      studyAcronym: 'STUDY',
      dataset: 'dataset',
    },
    ...overrides,
  } as Filter;
}

describe('VisualizationData', () => {
  it('treats empty and zero categorical charts as insufficient', () => {
    expect(categoricalHasData(categorical('empty', {}), 1)).toBe(false);
    expect(categoricalHasData(categorical('zero', { Yes: 0, No: 0 }), 1)).toBe(false);
  });

  it('uses minimum count threshold for categorical and continuous charts', () => {
    expect(categoricalHasData(categorical('cat', { Yes: 9 }), 9)).toBe(true);
    expect(categoricalHasData(categorical('cat', { Yes: 8 }), 9)).toBe(false);
    expect(continuousHasData(continuous('con', { '0 - 10': 9 }), 9)).toBe(true);
    expect(continuousHasData(continuous('con', { '0 - 10': 8 }), 9)).toBe(false);
  });

  it('excludes selected visualization filters missing from graphable response data', () => {
    const included = getIncludedConceptPaths(
      [categorical('\\study\\included\\', { Yes: 10 })],
      [continuous('\\study\\continuous\\', { '0 - 10': 10 })],
    );

    expect(
      getExcludedVisualizationVariables(
        [
          filter({ id: '\\study\\included\\' }),
          filter({ id: '\\study\\excluded\\', variableName: 'Excluded variable' }),
        ],
        included,
      ),
    ).toEqual(['STUDY - Display label']);
  });

  it('does not consider genomic, snp, AnyRecordOf, or groups visualization filters', () => {
    expect(isVisualizationFilter(filter({ filterType: 'Categorical' }))).toBe(true);
    expect(isVisualizationFilter(filter({ filterType: 'numeric' }))).toBe(true);
    expect(isVisualizationFilter(filter({ filterType: 'genomic' }))).toBe(false);
    expect(isVisualizationFilter(filter({ filterType: 'snp' }))).toBe(false);
    expect(isVisualizationFilter(filter({ filterType: 'AnyRecordOf' }))).toBe(false);
    expect(isVisualizationFilter(filter({ filterType: 'FilterGroup' }))).toBe(false);
  });

  it('formats variable labels with display, variableName, search result name fallback order', () => {
    expect(visualizationVariableLabel(filter())).toBe('STUDY - Display label');
    expect(
      visualizationVariableLabel(
        filter({
          variableName: 'Variable fallback',
          searchResult: { name: 'Name fallback', studyAcronym: 'STUDY' } as Filter['searchResult'],
        }),
      ),
    ).toBe('STUDY - Variable fallback');
    expect(
      visualizationVariableLabel(
        filter({
          variableName: '',
          searchResult: { name: 'Name fallback', dataset: 'dataset' } as Filter['searchResult'],
        }),
      ),
    ).toBe('dataset - Name fallback');
  });
});
