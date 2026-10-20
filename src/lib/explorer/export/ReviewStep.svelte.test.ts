// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';

const mocks = vi.hoisted(() => ({ searchDictionary: vi.fn(), runCrossCount: vi.fn(), total: 10 }));

vi.mock('$app/env', () => ({ browser: true }));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('#lib/telemetry/logger.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('#lib/telemetry/logger.ts')>()),
  log: vi.fn(),
}));
vi.mock('#lib/explorer/Dictionary.ts', () => ({
  searchDictionary: mocks.searchDictionary,
  getConceptDetails: vi.fn(),
}));
vi.mock('#lib/api/picsure/query.ts', () => ({ runCrossCount: mocks.runCrossCount }));
vi.mock('#lib/explorer/export/Summary.svelte', () => ({ default: () => {} }));
vi.mock('#lib/query/counts/resultCounts.svelte.ts', () => ({
  resultCountsState: {
    get total() {
      return mocks.total;
    },
    snapshot: { summary: { hasError: false } },
  },
}));
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
  mocks.total = 10;
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

  it('lets the user untick sample identifiers that took the export over the limit', async () => {
    const other = { conceptPath: '\\ds\\SAMPLE_ID_2\\', name: 'SAMPLE_ID_2' } as SearchResult;
    mocks.searchDictionary.mockResolvedValue({ content: [other] });
    mocks.runCrossCount.mockResolvedValue({ [other.conceptPath]: 5 });
    mocks.total = 600;
    render(ReviewStep, { query: buildRequest(null), rows: [] });
    const checkbox = await screen.findByRole('checkbox', { name: 'Include sample identifiers' });
    exportState.add(mapSearchResultAsExport(sampleId));

    await fireEvent.click(checkbox);

    expect(await screen.findByTestId('export-review-error')).toBeVisible();
    await fireEvent.click(
      await screen.findByRole('checkbox', { name: 'Include sample identifiers' }),
    );
    await vi.waitFor(() => expect(screen.queryByTestId('export-review-error')).toBeNull());
  });
});
