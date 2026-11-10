// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';

const { post, stepper } = vi.hoisted(() => ({
  post: vi.fn(),
  stepper: {
    request: { query: { expectedResultType: 'COUNT' } as Record<string, unknown> },
    datasetId: undefined as string | undefined,
  },
}));

vi.mock('$app/environment', () => ({ browser: true }));
vi.mock('$app/paths', () => ({ resolve: (path: string) => path }));
vi.mock('$lib/api', () => ({ post }));
vi.mock('$lib/logger', () => ({ log: vi.fn(), createLog: vi.fn() }));
vi.mock('$lib/configuration.svelte', () => ({
  config: { settings: { exportSystemFields: [] } },
  resetConfig: () => {},
}));
vi.mock('$lib/state/resultCounts.svelte', () => ({
  resultCountsState: { total: 0, ensureLoaded: async () => {} },
}));
vi.mock('$lib/stores/Filter', async () => {
  const { readable } = await import('svelte/store');
  return { allFilters: readable([]) };
});
vi.mock('$lib/stores/Export', async () => {
  const { readable } = await import('svelte/store');
  const exports = readable([]);
  return { default: { exports }, exports };
});
vi.mock('$lib/ExportStepperManager.svelte', () => ({
  getActiveType: () => 'DATAFRAME',
  getDatasetId: () => stepper.datasetId,
  setDatasetId: (id: string | undefined) => {
    stepper.datasetId = id;
  },
  getDatasetNameInput: () => undefined,
  setDatasetNameInput: () => {},
  setSaveable: () => {},
  getQueryRequest: () => stepper.request,
  buildSaveDatasetRequest: () => stepper.request,
}));

import SaveDatasetStep from '$lib/components/explorer/export/SaveDatasetStep.svelte';

const QUERY_PATH = 'picsure/hpds/auth/query';
const SAMPLE_SAVE_REFUSED =
  'A sample query cannot be saved as a dataset. Save the full query instead.';

describe('SaveDatasetStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stepper.datasetId = undefined;
    stepper.request = { query: { expectedResultType: 'COUNT' } };
  });

  it('submits nothing and shows the sample message for a sample query', async () => {
    stepper.request = { query: { expectedResultType: 'DATAFRAME', sample: true } };

    render(SaveDatasetStep);

    expect(await screen.findByText(SAMPLE_SAVE_REFUSED)).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
    expect(stepper.datasetId).toBeUndefined();
    expect(screen.queryByLabelText('Dataset Name:')).not.toBeInTheDocument();
  });

  it('submits the query and shows its id for a query that is not a sample', async () => {
    post.mockResolvedValueOnce({ picsureResultId: 'full-csv' });

    render(SaveDatasetStep);

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith(QUERY_PATH, stepper.request);
    expect(await screen.findByText('full-csv')).toBeInTheDocument();
    expect(screen.getByLabelText('Dataset Name:')).toBeInTheDocument();
    expect(screen.queryByText(SAMPLE_SAVE_REFUSED)).not.toBeInTheDocument();
  });
});
