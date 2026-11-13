// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';

const { get, post, put, features } = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  features: {
    confirmDownload: false,
    explorer: {
      allowDownload: true,
      enablePfbExport: true,
      enableExportTimeseries: false,
      enableSampleDataset: true,
    },
  },
}));

vi.mock('$app/environment', () => ({ browser: true }));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/paths', () => ({ resolve: (path: string) => path }));
vi.mock('$app/state', () => ({ page: { params: { uuid: 'dataset-uuid' } } }));
vi.mock('$lib/api', () => ({
  get,
  post,
  put,
  consentDeniedMessage: () => undefined,
  isResultNotReady: () => false,
  isSampleDisabled: () => false,
  serverErrorMessage: () => undefined,
}));
vi.mock('$lib/logger', () => ({ log: vi.fn(), createLog: vi.fn() }));
vi.mock('$lib/configuration.svelte', () => ({
  config: { features, branding: { applicationName: 'PIC-SURE', explorePage: {} } },
  resetConfig: () => {},
}));
vi.mock('$lib/components/query/QuerySummary.svelte', async () => ({
  default: (await import('./fixtures/StubComponent.svelte')).default,
}));

import DatasetPage from '../../src/routes/(picsure)/(authorized)/dataset/[uuid]/+page.svelte';
import { datasets } from '$lib/stores/Dataset.svelte';

const QUERY_PATH = 'picsure/hpds/auth/query';
const DATASET_PATH = 'picsure/operations/dataset/named/dataset-uuid';

function serverDataset(): Record<string, unknown> {
  const stored = {
    query: {
      select: ['\\study\\age\\'],
      authorizationFilters: [],
      phenotypicClause: null,
      genomicFilters: [],
      expectedResultType: 'DATAFRAME',
      picsureId: null,
      id: null,
    },
  };
  return {
    uuid: 'dataset-uuid',
    user: 'user@example.org',
    name: 'My cohort',
    archived: false,
    metadata: {},
    query: {
      uuid: 'full-id',
      query: JSON.stringify(stored),
      startTime: 1794000000000,
      status: 'AVAILABLE',
    },
    queries: [{ queryId: 'full-id', sample: false, resultType: 'DATAFRAME' }],
  };
}

function paths(mock: ReturnType<typeof vi.fn>): unknown[] {
  return mock.mock.calls.map(([path]) => path);
}

describe('dataset page', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    datasets.set([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps the Dataset ID and sends no PUT when the sample is requested twice', async () => {
    get.mockResolvedValueOnce(serverDataset()).mockResolvedValue({ status: 'AVAILABLE' });
    post.mockResolvedValue({ picsureResultId: 'sample-id' });
    render(DatasetPage);

    const datasetId = await screen.findByTestId('dataset-summary-uuid');
    expect(datasetId).toHaveTextContent('full-id');

    const sample = screen.getByRole('button', { name: /Sample dataset/ });
    await fireEvent.click(sample);
    await screen.findByText('Your sample dataset is ready.');

    expect(paths(post)).toEqual([QUERY_PATH]);
    expect(put).not.toHaveBeenCalled();
    expect(screen.getByTestId('dataset-summary-uuid')).toHaveTextContent('full-id');
    expect(screen.getByTestId('dataset-summary-uuid')).not.toHaveTextContent('sample-id');
    expect(screen.getByTestId('dataset-summary-name')).toHaveTextContent('My cohort');

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Sample dataset/ })).toBeEnabled(),
    );
    await fireEvent.click(screen.getByRole('button', { name: /Sample dataset/ }));
    await waitFor(() => expect(get).toHaveBeenCalledTimes(3));

    expect(paths(post)).toEqual([QUERY_PATH, QUERY_PATH]);
    expect(put).not.toHaveBeenCalled();
    expect(paths(get)).toEqual([
      DATASET_PATH,
      `${QUERY_PATH}/sample-id/status`,
      `${QUERY_PATH}/sample-id/status`,
    ]);
    expect(screen.getByTestId('dataset-summary-uuid')).toHaveTextContent('full-id');
  });

  it('offers the enabled export types and submits the chosen one as a sample', async () => {
    get.mockResolvedValueOnce(serverDataset()).mockResolvedValue({ status: 'AVAILABLE' });
    post.mockResolvedValue({ picsureResultId: 'sample-pfb' });
    render(DatasetPage);

    const control = (await screen.findByLabelText('Export type')) as HTMLSelectElement;
    expect(Array.from(control.options).map((option) => option.value)).toEqual([
      'DATAFRAME',
      'DATAFRAME_PFB',
    ]);
    expect(control.value).toBe('DATAFRAME');

    await fireEvent.change(control, { target: { value: 'DATAFRAME_PFB' } });
    await fireEvent.click(screen.getByRole('button', { name: /Sample dataset/ }));
    await screen.findByRole('button', { name: /Download as PFB/ });

    expect(paths(post)).toEqual([QUERY_PATH]);
    const body = JSON.parse(JSON.stringify(post.mock.calls[0][1]));
    expect(body.query.expectedResultType).toBe('DATAFRAME_PFB');
    expect(body.query.sample).toBe(true);
    expect(put).not.toHaveBeenCalled();
    expect(paths(get)).toEqual([DATASET_PATH, `${QUERY_PATH}/sample-pfb/status`]);
    expect(screen.getByTestId('dataset-summary-uuid')).toHaveTextContent('full-id');
  });
});
