// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import { error } from '@sveltejs/kit';

const { post, stepper } = vi.hoisted(() => ({
  post: vi.fn(),
  stepper: {
    request: { query: { expectedResultType: 'COUNT' } as Record<string, unknown> },
    datasetId: undefined as string | undefined,
  },
}));

vi.mock('$app/environment', () => ({ browser: true }));
vi.mock('$app/paths', () => ({ resolve: (path: string) => path }));
vi.mock('$lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('$lib/api')>()),
  post,
}));
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
const SERVER_REFUSAL = 'Sample datasets are switched off for this project.';
const DATASET_ID_FAILED = 'An error occurred while getting the dataset ID. Please try again later.';

function httpError(status: 400 | 500 | 502, text: string): unknown {
  try {
    error(status, text);
  } catch (e) {
    return e;
  }
}

describe('SaveDatasetStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stepper.datasetId = undefined;
    stepper.request = { query: { expectedResultType: 'COUNT' } };
  });

  it('submits a sample query and shows its id', async () => {
    stepper.request = { query: { expectedResultType: 'DATAFRAME', sample: true } };
    post.mockResolvedValueOnce({ picsureResultId: 'sample-csv' });

    render(SaveDatasetStep);

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith(QUERY_PATH, stepper.request);
    expect(stepper.request.query.sample).toBe(true);
    expect(await screen.findByText('sample-csv')).toBeInTheDocument();
    expect(screen.getByLabelText('Dataset Name:')).toBeInTheDocument();
  });

  it('shows the message the server refused a sample query with', async () => {
    stepper.request = { query: { expectedResultType: 'DATAFRAME', sample: true } };
    post.mockRejectedValue(
      httpError(400, JSON.stringify({ errorType: 'sample_disabled', message: SERVER_REFUSAL })),
    );

    render(SaveDatasetStep);

    expect(await screen.findByText(SERVER_REFUSAL)).toBeInTheDocument();
    expect(post).toHaveBeenCalledWith(QUERY_PATH, stepper.request);
    expect(screen.queryByText(DATASET_ID_FAILED)).not.toBeInTheDocument();
  });

  it('shows the generic message when the server gives none', async () => {
    post.mockRejectedValue(httpError(500, '<html>Bad Gateway</html>'));

    render(SaveDatasetStep);

    expect(await screen.findByText(DATASET_ID_FAILED)).toBeInTheDocument();
  });

  it('shows the generic message for a 502 whose body carries a message', async () => {
    const internal = 'HPDS call failed: http://hpds.internal:8080/query';
    post.mockRejectedValue(httpError(502, JSON.stringify({ message: internal })));

    render(SaveDatasetStep);

    expect(await screen.findByText(DATASET_ID_FAILED)).toBeInTheDocument();
    expect(screen.queryByText(internal)).not.toBeInTheDocument();
  });

  it('shows the generic message for a 400 whose message is too long for the alert', async () => {
    const long = 'a'.repeat(301);
    post.mockRejectedValue(httpError(400, JSON.stringify({ message: long })));

    render(SaveDatasetStep);

    expect(await screen.findByText(DATASET_ID_FAILED)).toBeInTheDocument();
    expect(screen.queryByText(long)).not.toBeInTheDocument();
  });

  it('submits the query and shows its id for a query that is not a sample', async () => {
    post.mockResolvedValueOnce({ picsureResultId: 'full-csv' });

    render(SaveDatasetStep);

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith(QUERY_PATH, stepper.request);
    expect(await screen.findByText('full-csv')).toBeInTheDocument();
    expect(screen.getByLabelText('Dataset Name:')).toBeInTheDocument();
  });
});
