import type { Features } from '#lib/config/schema.ts';
import type { FilterType } from '#lib/query/filter.svelte.ts';
import { isObfuscatedBelowThreshold, type PatientCount } from '#lib/query/counts/format.ts';
import type { ExploreMode } from '#lib/explorer/mode.ts';

export interface ResultsPanelInput {
  mode: ExploreMode | undefined;
  features: Pick<Features, 'discover' | 'explorer'>;
  filterTypes: FilterType[];
  hasGenomicFilter: boolean;
  exportCount: number;
  counts: { loading: boolean; hasNonZero: boolean; total: PatientCount };
}

export interface ResultsPanelRules {
  /** Whether there is anything for the Reset button to clear. */
  hasFilterOrExport: boolean;
  showExportButton: boolean;
  /** The mode's distributions page, or undefined when the button is hidden. */
  distributionsPage: 'explorer/distributions' | 'discover/distributions' | undefined;
  distributionsDisabled: boolean;
  showVariantExplorer: boolean;
}

// Distributions need at least one filter on a phenotypic variable.
const NON_DISTRIBUTION_FILTERS: FilterType[] = ['genomic', 'snp', 'AnyRecordOf'];

/** Which of the results panel's export and tool-suite controls show, and whether they are usable. */
export function resultsPanelRules({
  mode,
  features,
  filterTypes,
  hasGenomicFilter,
  exportCount,
  counts,
}: ResultsPanelInput): ResultsPanelRules {
  const isDiscover = mode === 'discover';
  const hasFilterOrExport =
    filterTypes.length !== 0 || (features.explorer.exportsEnableExport && exportCount !== 0);
  const hasDistributionFilter = filterTypes.some(
    (type) => !NON_DISTRIBUTION_FILTERS.includes(type),
  );
  const showDistributions =
    features.explorer.distributionExplorer &&
    hasDistributionFilter &&
    (!isDiscover || features.discover);

  return {
    hasFilterOrExport,
    showExportButton:
      features.explorer.allowExport &&
      !isDiscover &&
      hasFilterOrExport &&
      (counts.loading || counts.hasNonZero),
    distributionsPage: showDistributions
      ? isDiscover
        ? 'discover/distributions'
        : 'explorer/distributions'
      : undefined,
    distributionsDisabled:
      counts.loading ||
      (isDiscover ? isObfuscatedBelowThreshold(counts.total) : counts.total === 0),
    showVariantExplorer: !isDiscover && features.explorer.variantExplorer && hasGenomicFilter,
  };
}
