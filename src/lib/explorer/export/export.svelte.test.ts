import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getQueryStatus: vi.fn(),
  createDatasetName: vi.fn(),
  total: 100 as unknown,
  countFailed: false,
  filters: [] as unknown[],
  settings: { maxDataPointsForExport: 0 },
}));

vi.mock('$app/env', () => ({ browser: true }));
vi.mock('#lib/api/picsure/query.ts', () => ({ getQueryStatus: mocks.getQueryStatus }));
vi.mock('#lib/api/picsure/datasets.ts', () => ({ createDatasetName: mocks.createDatasetName }));
// No waiting between attempts; the attempt count and the retry rule are the real ones.
vi.mock('#lib/utils/backoff.ts', () => ({
  async withBackoff<T>(
    fn: () => Promise<T>,
    maxAttempts: number,
    _base: number,
    _max: number,
    shouldRetry: (error: unknown, attempt: number) => boolean,
  ) {
    let lastError: unknown;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (!shouldRetry(error, attempt)) throw error;
      }
    }
    throw lastError;
  },
}));
vi.mock('#lib/query/counts/resultCounts.svelte.ts', () => ({
  resultCountsState: {
    get total() {
      return mocks.total;
    },
    get snapshot() {
      return { summary: { hasError: mocks.countFailed } };
    },
  },
}));
vi.mock('#lib/query/filters.svelte.ts', () => ({
  filterState: {
    get phenotypic() {
      return mocks.filters;
    },
  },
}));
vi.mock('#lib/config/config.svelte.ts', () => ({
  config: {
    get settings() {
      return mocks.settings;
    },
  },
}));

import type { SearchResult } from '#lib/api/picsure/dictionary.types.ts';
import { ApiError } from '#lib/api/errors.ts';
import {
  ExportStatusError,
  exportState,
  mapSearchResultAsExport,
} from '#lib/explorer/export/export.svelte.ts';
import { explorerPanel } from '#lib/explorer/panel.svelte.ts';

const variable = (conceptPath: string, studyId?: string) => ({
  ...mapSearchResultAsExport({ conceptPath, name: conceptPath } as SearchResult),
  studyId,
});

beforeEach(() => {
  mocks.total = 100;
  mocks.countFailed = false;
  mocks.filters = [];
  mocks.settings.maxDataPointsForExport = 0;
});

afterEach(() => {
  exportState.clear();
  exportState.resetStepper();
  explorerPanel.hide();
  vi.clearAllMocks();
});

describe('the variables to export', () => {
  it('are added once per concept path', () => {
    exportState.add(variable('\\a\\'));
    exportState.add(variable('\\a\\'));
    exportState.addAll([variable('\\a\\'), variable('\\b\\')]);

    expect(exportState.variables.map((v) => v.conceptPath)).toEqual(['\\a\\', '\\b\\']);
  });

  it('remove a study’s variables with the study', () => {
    const study = variable('\\study\\');
    exportState.addAll([study, variable('\\study\\x\\', study.id), variable('\\other\\')]);

    exportState.removeById(study.id);

    expect(exportState.variables.map((v) => v.conceptPath)).toEqual(['\\other\\']);
  });

  it('open the results panel when there are some to list', () => {
    exportState.clear();
    expect(explorerPanel.open).toBe(false);

    exportState.add(variable('\\a\\'));

    expect(explorerPanel.open).toBe(true);
  });
});

describe('the data limit', () => {
  it('compares participants times variables with the configured maximum', () => {
    mocks.settings.maxDataPointsForExport = 300;
    mocks.filters = [{ filterType: 'Categorical' }, { filterType: 'numeric' }];
    exportState.add(variable('\\a\\'));

    expect(exportState.variableCount).toBe(3);
    expect(exportState.dataPoints).toBe(300);
    expect(exportState.dataLimitExceeded).toBe(false);

    exportState.add(variable('\\b\\'));

    expect(exportState.dataLimitExceeded).toBe(true);
  });

  it('is a million when not configured', () => {
    expect(exportState.maxDataPoints).toBe(1000000);
  });

  it('is exceeded while the participant count is unknown', () => {
    mocks.total = '< 10';

    expect(exportState.dataLimitExceeded).toBe(true);
  });

  // A failed count is stored as a total of 0 with an error flag.
  it('is exceeded when the participant count failed', () => {
    mocks.total = 0;
    mocks.countFailed = true;

    expect(exportState.dataLimitExceeded).toBe(true);
  });
});

describe('the dataset', () => {
  it('can be saved with an id and a name longer than two characters', () => {
    exportState.setDatasetId('id');
    exportState.setDatasetName('ab');
    expect(exportState.canSave).toBe(false);

    exportState.setDatasetName('abc');
    expect(exportState.canSave).toBe(true);
  });

  it('is saved under the name entered', async () => {
    exportState.setDatasetId('id');
    exportState.setDatasetName('my set');

    await exportState.saveDataset();

    expect(mocks.createDatasetName).toHaveBeenCalledWith('id', 'my set');
  });

  it('is not saved without an id', async () => {
    await expect(exportState.saveDataset()).rejects.toThrow('No dataset ID provided');
    expect(mocks.createDatasetName).not.toHaveBeenCalled();
  });
});

describe('waiting for the export', () => {
  beforeEach(() => exportState.setDatasetId('id'));

  it('unlocks the download once the export is available', async () => {
    mocks.getQueryStatus.mockResolvedValueOnce({ status: 'QUEUED' });
    mocks.getQueryStatus.mockResolvedValueOnce({ status: 'AVAILABLE' });

    await exportState.waitForExport();

    expect(mocks.getQueryStatus).toHaveBeenCalledTimes(2);
    expect(mocks.getQueryStatus).toHaveBeenCalledWith('id', exportState.request);
    expect(exportState.downloadLocked).toBe(false);
  });

  it('stops at a failed export and keeps the download locked', async () => {
    mocks.getQueryStatus.mockResolvedValue({ status: 'ERROR' });

    const error = await exportState.waitForExport().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ExportStatusError);
    expect((error as Error).message).toBe('Export failed with status: ERROR');
    expect(mocks.getQueryStatus).toHaveBeenCalledTimes(1);
    expect(exportState.downloadLocked).toBe(true);
  });

  it('gives up with the last status after every attempt', async () => {
    mocks.getQueryStatus.mockResolvedValue({ status: 'RUNNING' });

    await expect(exportState.waitForExport()).rejects.toThrow('Export not ready. Status: RUNNING');
    expect(mocks.getQueryStatus).toHaveBeenCalledTimes(15);
  });

  it('retries a failed status request', async () => {
    mocks.getQueryStatus.mockRejectedValueOnce(new ApiError(503, 'http', null, 'unavailable'));
    mocks.getQueryStatus.mockResolvedValueOnce({ status: 'SUCCESS' });

    await exportState.waitForExport();

    expect(exportState.downloadLocked).toBe(false);
  });
});

describe('the result type', () => {
  it('defaults to a data frame on the request', () => {
    exportState.useChosenResultType();
    expect(exportState.request.query.expectedResultType).toBe('DATAFRAME');

    exportState.setResultType('DATAFRAME_PFB');
    exportState.useChosenResultType();
    expect(exportState.request.query.expectedResultType).toBe('DATAFRAME_PFB');
  });
});
