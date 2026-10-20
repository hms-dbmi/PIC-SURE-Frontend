export type ObfuscatedCount = {
  count: number;
  display: string;
  variance?: number | null;
};

// For backwards compatibility
export type CountValue = ObfuscatedCount | number;

export type CountMap = { [key: string]: CountValue };

export type PlotData = {
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
