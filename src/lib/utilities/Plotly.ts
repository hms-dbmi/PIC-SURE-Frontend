import type { PlotlyHTMLElement, Root, Data, Config, Layout } from 'plotly.js';
import { config } from '$lib/configuration.svelte';

const MAX_TITLE_LENGTH = 60;
const OBFUSCATION_RANGE = 6;
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

type PlotData = {
  title: string;
  continuous: boolean;
  colors: string[];
  chartWidth: number;
  chartHeight: number;
  categoricalMap: { [key: string]: number };
  obfuscated: boolean;
  xaxisName: string;
  yaxisName: string;
};

export type CategoricalPlotData = PlotData & {
  categoricalMap: { [key: string]: number };
};

export type ContinuousPlotData = PlotData & {
  continuousMap: { [key: string]: number };
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

function shortenTitle(title: string) {
  return title.length > MAX_TITLE_LENGTH ? title.substring(0, MAX_TITLE_LENGTH - 3) + '...' : title;
}

function obfuscateData(values: number[], obfuscated: boolean) {
  // shaded area at top of bar chart
  const topBar: number[] = Array(values.length).fill(OBFUSCATION_RANGE);
  const bottomBar: string[] = [];

  values.forEach((value, i) => {
    // If the value is less than 10 and the section obfuscated, then we need to obfuscate the value
    if (value < 10 && obfuscated) {
      topBar[i] = 9;

      // Set the text to < 10 so that it shows up in the bar chart
      bottomBar[i] = '< 10';

      // set the value in the topBar array to 0 so that it doesn't show up in the bar chart
      values[i] = 0;
    } else if (obfuscated) {
      // The value has been obfuscated by +- obfuscationRange
      bottomBar[i] = value + ' \u00B1 3';
    } else {
      topBar[i] = 0;
      bottomBar[i] = value + '';
    }
  });
  return { topBar, bottomBar };
}

function cutForShading(values: number[], obfuscated: boolean) {
  return values.map((value) => (obfuscated && value > 0 ? value - OBFUSCATION_RANGE / 2 : value));
}

export function createCategoryPlot(inData: CategoricalPlotData): PlotValues {
  const values = Object.values(inData.categoricalMap);
  const { topBar, bottomBar } = obfuscateData(values, inData.obfuscated);

  const colors: string[] = getColors(values.length);
  const title = shortenTitle(inData.title);
  const data: Data[] = [
    {
      x: Object.keys(inData.categoricalMap),
      // Remove half of the obfuscation range value from the top of the bar
      // chart to make room for the shaded area
      y: cutForShading(values, inData.obfuscated),
      name: title,
      type: 'bar',
      showlegend: false,
      marker: {
        color: colors,
      },
    },
    {
      // Shaded portion
      x: Object.keys(inData.categoricalMap),
      y: topBar,
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
      text: bottomBar,
      textposition: 'outside',
    },
  ];

  const layout: Partial<Layout> = {
    title: {
      text: title,
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
  const isObfuscated = inData.obfuscated;

  /*
   * The dataMap.continuousMap is an object with the key being the range and the value being the count.
   * When converting the keys, which are a string of the range, to an array of numbers, we are not
   * guaranteed that the keys will be in order. We need to sort the keys by the lower limit of the range.
   * If the lower limit is NaN, then it is a single value. We need to sort the keys by the lower limit of
   * the range.
   *
   * This doesn't happen when the data isn't obfuscated because the keys are the same as the values.
   */
  const orderedKeys: string[] = [];
  const orderedValues: number[] = [];
  Object.keys(inData.continuousMap)
    .sort((a, b) => {
      // sort the keys by the lower limit of the range
      let aLowerLimit = parseFloat(a.split(' -')[0]);
      let bLowerLimit = parseFloat(b.split(' -')[0]);

      // If the lower limit is NaN, then it is a single value
      if (isNaN(aLowerLimit)) aLowerLimit = parseFloat(a.split(' +')[0]);
      if (isNaN(bLowerLimit)) bLowerLimit = parseFloat(a.split(' +')[0]);

      return aLowerLimit - bLowerLimit;
    })
    .forEach((key) => {
      orderedKeys.push(key);
      orderedValues.push(inData.continuousMap[key]);
    });

  const { topBar, bottomBar } = obfuscateData(orderedValues, isObfuscated);

  const title = shortenTitle(inData.title);
  const data: Data[] = [
    {
      x: orderedKeys,
      y: cutForShading(orderedValues, inData.obfuscated),
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
      x: orderedKeys,
      y: topBar,
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
      text: bottomBar,
      textposition: 'outside',
    },
  ];

  const layout: Partial<Layout> = {
    title: {
      text: title,
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
