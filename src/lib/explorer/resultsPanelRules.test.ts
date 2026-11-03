import { describe, expect, it } from 'vitest';
import { resultsPanelRules, type ResultsPanelInput } from '#lib/explorer/resultsPanelRules.ts';

function input(overrides: Partial<ResultsPanelInput> = {}): ResultsPanelInput {
  return {
    mode: 'explorer',
    features: {
      discover: true,
      explorer: {
        allowExport: true,
        exportsEnableExport: true,
        distributionExplorer: true,
        variantExplorer: true,
      } as ResultsPanelInput['features']['explorer'],
    },
    filterTypes: ['Categorical'],
    hasGenomicFilter: false,
    exportCount: 0,
    counts: { loading: false, hasNonZero: true, total: 42 },
    ...overrides,
  };
}

describe('resultsPanelRules', () => {
  it('offers export, distributions and nothing genomic for a phenotypic filter in explorer', () => {
    expect(resultsPanelRules(input())).toEqual({
      hasFilterOrExport: true,
      showExportButton: true,
      distributionsPage: 'explorer/distributions',
      distributionsDisabled: false,
      showVariantExplorer: false,
    });
  });

  it('counts exports as something to reset only when exports are enabled', () => {
    const exportsOnly = { filterTypes: [], exportCount: 2 };
    expect(resultsPanelRules(input(exportsOnly)).hasFilterOrExport).toBe(true);

    const disabled = input(exportsOnly);
    disabled.features.explorer.exportsEnableExport = false;
    expect(resultsPanelRules(disabled).hasFilterOrExport).toBe(false);
  });

  it('hides the export button while every count is zero, but not while counting', () => {
    const zero = { loading: false, hasNonZero: false, total: 0 };
    expect(resultsPanelRules(input({ counts: zero })).showExportButton).toBe(false);
    expect(resultsPanelRules(input({ counts: { ...zero, loading: true } })).showExportButton).toBe(
      true,
    );
  });

  it('needs a filter on a phenotypic variable for distributions', () => {
    const rules = resultsPanelRules(input({ filterTypes: ['genomic', 'snp', 'AnyRecordOf'] }));
    expect(rules.distributionsPage).toBeUndefined();
  });

  it('links discover to its own distributions page, and only when discover is on', () => {
    const discover = input({ mode: 'discover' });
    expect(resultsPanelRules(discover)).toMatchObject({
      showExportButton: false,
      distributionsPage: 'discover/distributions',
    });

    discover.features.discover = false;
    expect(resultsPanelRules(discover).distributionsPage).toBeUndefined();
  });

  it('disables distributions on a zero count, or below the threshold in discover', () => {
    expect(
      resultsPanelRules(input({ counts: { loading: false, hasNonZero: false, total: 0 } }))
        .distributionsDisabled,
    ).toBe(true);
    const belowThreshold = { loading: false, hasNonZero: true, total: '< 10' };
    expect(
      resultsPanelRules(input({ mode: 'discover', counts: belowThreshold })).distributionsDisabled,
    ).toBe(true);
    expect(resultsPanelRules(input({ counts: belowThreshold })).distributionsDisabled).toBe(false);
  });

  it('offers the variant explorer for a genomic filter outside discover', () => {
    expect(resultsPanelRules(input({ hasGenomicFilter: true })).showVariantExplorer).toBe(true);
    expect(
      resultsPanelRules(input({ mode: 'discover', hasGenomicFilter: true })).showVariantExplorer,
    ).toBe(false);
  });
});
