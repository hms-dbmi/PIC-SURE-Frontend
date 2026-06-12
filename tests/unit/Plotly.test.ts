import { describe, it, expect, vi } from 'vitest';

vi.mock('$lib/configuration', () => ({
  settings: { distributionExplorer: { graphColors: ['#111111', '#222222'] } },
}));

import {
  createCategoryPlot,
  createContinuousPlot,
  type CategoricalPlotData,
  type ContinuousPlotData,
} from '$lib/utilities/Plotly';

const baseChart = {
  title: 'demographics: race',
  continuous: false,
  colors: [],
  chartWidth: 500,
  chartHeight: 600,
  xaxisName: 'race',
  yaxisName: 'Number of Participants',
};

type BarTrace = { x: string[]; y: number[]; text?: string[] };

function categoricalPlot(map: CategoricalPlotData['categoricalMap'], obfuscated = false) {
  const plot = createCategoryPlot({
    ...baseChart,
    obfuscated,
    categoricalMap: map,
  } as CategoricalPlotData);
  const [solid, hatched] = plot.data as unknown as [BarTrace, BarTrace];
  return { plot, solid, hatched };
}

describe('createCategoryPlot', () => {
  it('renders exact (authorized) values as plain bars with no uncertainty band', () => {
    const { solid, hatched } = categoricalPlot({
      White: { count: 45000, display: '45000', variance: null },
      Black: { count: 12000, display: '12000', variance: null },
    });

    expect(solid.y).toEqual([45000, 12000]);
    expect(hatched.y).toEqual([0, 0]);
    expect(hatched.text).toEqual(['45000', '12000']);
  });

  it('renders variance values with a band spanning count ± variance', () => {
    const { solid, hatched } = categoricalPlot(
      { White: { count: 222, display: '222 ±3', variance: 3 } },
      true,
    );

    // Solid bar to count - variance, band of 2 * variance on top (top of stack = count + variance)
    expect(solid.y).toEqual([219]);
    expect(hatched.y).toEqual([6]);
    expect(hatched.text).toEqual(['222 ±3']);
  });

  it('renders below-threshold values as a fully hatched bar up to the threshold band', () => {
    const { solid, hatched } = categoricalPlot(
      { Other: { count: 0, display: '< 10', variance: 9 } },
      true,
    );

    expect(solid.y).toEqual([0]);
    expect(hatched.y).toEqual([9]);
    expect(hatched.text).toEqual(['< 10']);
  });

  it('clamps the band at zero when variance exceeds count', () => {
    const { solid, hatched } = categoricalPlot(
      { Rare: { count: 2, display: '2 ±3', variance: 3 } },
      true,
    );

    expect(solid.y).toEqual([0]);
    // Band runs from 0 to count + variance
    expect(hatched.y).toEqual([5]);
  });

  it('normalizes legacy plain-number values into exact bars', () => {
    const { solid, hatched } = categoricalPlot({ White: 45000, Black: 12000 });

    expect(solid.y).toEqual([45000, 12000]);
    expect(hatched.y).toEqual([0, 0]);
    expect(hatched.text).toEqual(['45000', '12000']);
  });
});

describe('createContinuousPlot', () => {
  function continuousPlot(map: ContinuousPlotData['continuousMap'], obfuscated = false) {
    const plot = createContinuousPlot({
      ...baseChart,
      title: 'measurements: bmi',
      continuous: true,
      obfuscated,
      continuousMap: map,
    } as ContinuousPlotData);
    const [solid, hatched] = plot.data as unknown as [BarTrace, BarTrace];
    return { plot, solid, hatched };
  }

  it('orders bins by their lower limit and renders counts and labels', () => {
    const { solid, hatched } = continuousPlot({
      '30.0 +': { count: 150, display: '150 ±3', variance: 3 },
      '18.0 - 24.0': { count: 600, display: '600 ±3', variance: 3 },
      '24.0 - 30.0': { count: 0, display: '< 10', variance: 9 },
    });

    expect(solid.x).toEqual(['18.0 - 24.0', '24.0 - 30.0', '30.0 +']);
    expect(solid.y).toEqual([597, 0, 147]);
    expect(hatched.y).toEqual([6, 9, 6]);
    expect(hatched.text).toEqual(['600 ±3', '< 10', '150 ±3']);
  });

  it('normalizes legacy plain-number values', () => {
    const { solid, hatched } = continuousPlot({
      '18.0 - 24.0': 600,
      '24.0 - 30.0': 700,
    });

    expect(solid.y).toEqual([600, 700]);
    expect(hatched.y).toEqual([0, 0]);
    expect(hatched.text).toEqual(['600', '700']);
  });
});
