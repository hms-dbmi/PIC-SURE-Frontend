// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';

const mocks = vi.hoisted(() => ({ searchDictionary: vi.fn(), runCrossCount: vi.fn() }));

vi.mock('$app/env', () => ({ browser: true }));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('#lib/explorer/Dictionary.ts', () => ({
  searchDictionary: mocks.searchDictionary,
  getConceptDetails: vi.fn(),
}));
vi.mock('#lib/api/picsure/query.ts', () => ({ runCrossCount: mocks.runCrossCount }));
vi.mock('#lib/explorer/export/Summary.svelte', () => ({ default: () => {} }));
vi.mock('#lib/query/counts/resultCounts.svelte.ts', () => ({ resultCountsState: { total: 10 } }));
vi.mock('#lib/config/config.svelte.ts', () => ({
  config: {
    features: { explorer: { enableSampleIdCheckbox: true } },
    settings: { maxDataPointsForExport: 1000 },
  },
}));

import ReviewStep from '#lib/explorer/export/ReviewStep.svelte';
import { exportState, mapSearchResultAsExport } from '#lib/explorer/export/export.svelte.ts';
import type { SearchResult } from '#lib/api/picsure/dictionary.types.ts';
import { buildRequest } from '#lib/query/build.ts';

const sampleId = { conceptPath: '\\ds\\SAMPLE_ID\\', name: 'SAMPLE_ID' } as SearchResult;

afterEach(() => {
  exportState.clear();
  vi.clearAllMocks();
});

describe('ReviewStep', () => {
  it.each([
    ['the genomic concept search', () => mocks.searchDictionary.mockRejectedValue(new Error('x'))],
    [
      'the cross count',
      () => {
        mocks.searchDictionary.mockResolvedValue({ content: [sampleId] });
        mocks.runCrossCount.mockRejectedValue(new Error('x'));
      },
    ],
  ])('offers the sample identifiers again when %s fails', async (_step, fail) => {
    fail();
    exportState.add(mapSearchResultAsExport(sampleId));

    render(ReviewStep, { query: buildRequest(null), rows: [] });

    const checkbox = await screen.findByRole('checkbox', { name: 'Include sample identifiers' });
    expect(checkbox).not.toBeChecked();
  });

  it('ticks the box when every genomic sample identifier is already exported', async () => {
    mocks.searchDictionary.mockResolvedValue({ content: [sampleId] });
    mocks.runCrossCount.mockResolvedValue({ [sampleId.conceptPath]: 5 });
    exportState.add(mapSearchResultAsExport(sampleId));

    render(ReviewStep, { query: buildRequest(null), rows: [] });

    await vi.waitFor(() =>
      expect(screen.getByRole('checkbox', { name: 'Include sample identifiers' })).toBeChecked(),
    );
  });
});
