import { request } from '#lib/api/client.ts';
import { Picsure } from '#lib/api/paths.ts';
import type { QueryInterfaceV3 } from '#lib/query/query.ts';
import type {
  CategoricalPlotData,
  ContinuousPlotData,
} from '#lib/explorer/visualizations/plotly.ts';

export interface Distributions {
  categoricalData: CategoricalPlotData[];
  continuousData: ContinuousPlotData[];
}

/**
 * Plot data for each variable the query filters on. `openEndpoint` asks the open variant's
 * obfuscated distributions; `anonymous` sends the open-access session even when someone is signed
 * in. They differ when the deployment explores without login: open pages then use the full
 * endpoint, still anonymously.
 */
export async function getDistributions(
  query: QueryInterfaceV3,
  { openEndpoint, anonymous }: { openEndpoint: boolean; anonymous: boolean },
): Promise<Distributions> {
  const response = await request<unknown>(
    openEndpoint ? Picsure.Visualization.DistributionsOpen : Picsure.Visualization.Distributions,
    { method: 'POST', body: { query }, auth: anonymous ? 'anonymous' : 'open' },
  );
  const { categoricalData, continuousData } =
    typeof response === 'object' && response !== null ? (response as Record<string, unknown>) : {};
  return {
    categoricalData: Array.isArray(categoricalData) ? categoricalData : [],
    continuousData: Array.isArray(continuousData) ? continuousData : [],
  };
}
