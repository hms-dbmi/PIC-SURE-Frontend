import type { PlotlyHTMLElement, Root, Data, Config, Layout } from 'plotly.js-basic-dist-min';
import { config } from '$lib/configuration.svelte';

const MAX_TITLE_LENGTH = 60;
const defaultColors = config.settings.distributionExplorer.graphColors;

export const defaultPlotlyConfig: Partial<Config> = {
  editable: true,
  toImageButtonOptions: {
    format: 'png', //png, svg, jpeg, webp
  },
  displayModeBar: true,
  modeBarButtonsToRemove: [
    'pan2d',
    'select2d',
    'lasso2d',
    'zoomIn2d',
    'zoomOut2d',
    'autoScale2d',
    'sendDataToCloud',
  ],
};

export type PlotlyNewPlot = (
  root: Root,
  data: Data[],
  layout?: Partial<Layout>,
  config?: Partial<Config>,
) => Promise<PlotlyHTMLElement>;

export type ObfuscatedCount = {
  count: number;
  display: string;
  variance?: number | null;
};

// For backwards compatibility
export type CountValue = ObfuscatedCount | number;

type CountMap = { [key: string]: CountValue };

type PlotData = {
  title: string;
  conceptPath?: string;
  subtitle?: string;
  continuous: boolean;
  colors: string[];
  chartWidth: number;
  chartHeight: number;
  obfuscated: boolean;
  xaxisName: string;
  yaxisName: string;
};

export type CategoricalPlotData = PlotData & {
  categoricalMap: CountMap;
};

export type ContinuousPlotData = PlotData & {
  continuousMap: CountMap;
};

export type PlotMeta = {
  isCategorical: boolean;
  unformatedTitle: string;
};

export type PlotValues = {
  data: Data[];
  layout: Partial<Layout>;
  meta: PlotMeta;
};

function getColors(num: number) {
  const colors = [];
  for (let i = 0; i < num; i++) {
    colors.push(defaultColors[i % defaultColors.length]);
  }
  return colors;
}

function getSubTitle(inData: CategoricalPlotData | ContinuousPlotData) {
  return inData.subtitle || '';
}

function shortenTitle(title: string) {
  return title.length > MAX_TITLE_LENGTH ? title.substring(0, MAX_TITLE_LENGTH - 3) + '...' : title;
}

export function normalizeCount(value: CountValue): ObfuscatedCount {
  return typeof value === 'number'
    ? { count: value, display: String(value), variance: null }
    : value;
}

function toBars(values: ObfuscatedCount[]) {
  const solidBar: number[] = [];
  const hatchedBar: number[] = [];
  const labels: string[] = [];

  values.forEach(({ count, display, variance }) => {
    const halfWidth = variance ?? 0;
    const solid = Math.max(0, count - halfWidth);
    solidBar.push(solid);
    hatchedBar.push(count + halfWidth - solid);
    labels.push(display);
  });
  return { solidBar, hatchedBar, labels };
}

export function createCategoryPlot(inData: CategoricalPlotData): PlotValues {
  const keys = Object.keys(inData.categoricalMap);
  const values = Object.values(inData.categoricalMap).map(normalizeCount);
  const { solidBar, hatchedBar, labels } = toBars(values);

  const colors: string[] = getColors(values.length);
  const title = shortenTitle(inData.title);
  const subtitle = getSubTitle(inData);
  const data: Data[] = [
    {
      x: keys,
      y: solidBar,
      name: title,
      type: 'bar',
      showlegend: false,
      marker: {
        color: colors,
      },
    },
    {
      // Hatched uncertainty band stacked on the solid bar
      x: keys,
      y: hatchedBar,
      name: 'Obfuscated Data',
      showlegend: false,
      type: 'bar',
      marker: {
        color: colors,
        pattern: {
          shape: '/',
          size: 20,
          solidity: 0.5,
        },
      },
      text: labels,
      textposition: 'outside',
    },
  ];

  const layout: Partial<Layout> = {
    title: {
      text: title,
      subtitle: {
        text: subtitle,
      },
    },
    width: inData.chartWidth || 500,
    height: inData.chartHeight || 600,
    hovermode: false,
    font: {
      family: 'Nunito Sans, sans-serif',
    },
    xaxis: {
      title: {
        text: inData.xaxisName,
      },
      automargin: true,
    },
    yaxis: {
      title: {
        text: inData.yaxisName,
      },
      automargin: true,
    },
    barmode: 'stack',
  };

  return {
    data,
    layout,
    meta: {
      isCategorical: true,
      unformatedTitle: inData.title,
    },
  };
}

export function createContinuousPlot(inData: ContinuousPlotData): PlotValues {
  const orderedKeys: string[] = [];
  const orderedValues: ObfuscatedCount[] = [];
  Object.keys(inData.continuousMap)
    .sort((a, b) => {
      // sort the keys by the lower limit of the range
      let aLowerLimit = parseFloat(a.split(' -')[0]);
      let bLowerLimit = parseFloat(b.split(' -')[0]);

      // If the lower limit is NaN, then it is a single value
      if (isNaN(aLowerLimit)) aLowerLimit = parseFloat(a.split(' +')[0]);
      if (isNaN(bLowerLimit)) bLowerLimit = parseFloat(b.split(' +')[0]);

      return aLowerLimit - bLowerLimit;
    })
    .forEach((key) => {
      orderedKeys.push(key);
      orderedValues.push(normalizeCount(inData.continuousMap[key]));
    });

  const { solidBar, hatchedBar, labels } = toBars(orderedValues);
  const title = shortenTitle(inData.title);
  const subtitle = getSubTitle(inData);
  const data: Data[] = [
    {
      x: orderedKeys,
      y: solidBar,
      name: title,
      type: 'bar',
      showlegend: false,
      marker: {
        color: '#c31f3f',
        line: {
          color: '#616265',
          width: 1,
        },
      },
    },
    {
      // Hatched uncertainty band stacked on the solid bar
      x: orderedKeys,
      y: hatchedBar,
      name: 'Obfuscated Data',
      showlegend: false,
      type: 'bar',
      marker: {
        color: '#c31f3f',
        pattern: {
          shape: '/',
          size: 20,
          solidity: 0.5,
        },
        line: {
          color: '#616265',
          width: 1,
        },
      },
      text: labels,
      textposition: 'outside',
    },
  ];

  const layout: Partial<Layout> = {
    title: {
      text: title,
      subtitle: {
        text: subtitle,
      },
    },
    width: inData.chartWidth || 500,
    height: inData.chartHeight || 600,
    autosize: false,
    hovermode: false,
    bargap: 0.01,
    font: {
      family: 'Nunito Sans, sans-serif',
    },
    xaxis: {
      title: {
        text: inData.xaxisName,
      },
      automargin: true,
    },
    yaxis: {
      title: {
        text: inData.yaxisName,
      },
      automargin: true,
    },
    barmode: 'stack',
  };

  return {
    data,
    layout,
    meta: {
      isCategorical: false,
      unformatedTitle: inData.title,
    },
  };
}
