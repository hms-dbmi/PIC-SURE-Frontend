// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { error } from '@sveltejs/kit';

const { get, post, put, notReady, sampleDisabled, consentDenied, features } = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  notReady: { status: 409, body: { message: '{"errorType":"result_not_ready"}' } },
  sampleDisabled: { status: 400, body: { message: '{"errorType":"sample_disabled"}' } },
  consentDenied: { status: 403, body: { message: 'You no longer have consent' } },
  features: {
    confirmDownload: false,
    explorer: { allowDownload: true, enablePfbExport: true, enableSampleDataset: true },
  },
}));

vi.mock('$app/environment', () => ({ browser: true }));
vi.mock('$lib/api', () => ({
  get,
  post,
  put,
  consentDeniedMessage: (e: unknown) =>
    e === consentDenied ? consentDenied.body.message : undefined,
  isResultNotReady: (e: unknown) => e === notReady,
  isSampleDisabled: (e: unknown) => e === sampleDisabled,
}));
vi.mock('$lib/logger', () => ({ log: vi.fn(), createLog: vi.fn() }));
vi.mock('$lib/configuration.svelte', () => ({
  config: {
    features,
    branding: {
      explorePage: {
        pfbExportUrls: [{ title: 'Terra', url: 'https://terra.example/import?url=' }],
      },
    },
  },
  resetConfig: () => {},
}));

import DatasetDownload from '$lib/components/dataset/DatasetDownload.svelte';
import { QueryVersion, type DataSet, type LinkedQuery } from '$lib/models/Dataset';
import { QueryV3, type ExpectedResultType } from '$lib/models/query/Query';
import { toaster } from '$lib/toaster';

const QUERY_PATH = 'picsure/hpds/auth/query';
const DATASET_PATH = 'picsure/operations/dataset/named/dataset-uuid';
const STATUS_WAIT_LIMIT_MS = 11 * 60000;
const FULL_LINK: LinkedQuery = { queryId: 'full-id', sample: false, resultType: 'DATAFRAME' };
const SAMPLE_LINK: LinkedQuery = { queryId: 'sample-id', sample: true, resultType: 'DATAFRAME' };
const PREPARE_FAILED_TOAST = {
  title:
    'An error occurred while preparing your dataset. Please try again. If this problem persists, please contact an administrator.',
  closable: true,
};
const NOT_READY_TOAST = {
  title: 'The export is not ready yet. Please try again in a few minutes.',
  closable: true,
};

function statusPath(queryId: string): string {
  return `${QUERY_PATH}/${queryId}/status`;
}

function makeDataset(
  expectedResultType: ExpectedResultType = 'DATAFRAME',
  queries: LinkedQuery[] = [FULL_LINK],
): DataSet {
  return {
    version: QueryVersion.V3,
    uuid: 'dataset-uuid',
    user: 'user@example.org',
    name: 'My cohort',
    archived: false,
    metadata: { note: 'kept' },
    query: new QueryV3({
      select: ['\\study\\age\\'],
      authorizationFilters: [],
      phenotypicClause: null,
      genomicFilters: [],
      expectedResultType,
      picsureId: null,
      id: null,
    }),
    queryId: 'full-id',
    queries,
    startTime: '2026-11-09',
    rawStartTime: 1,
    status: 'AVAILABLE',
  };
}

function conflict(): unknown {
  try {
    error(409, '{"errorType":"conflict"}');
  } catch (e) {
    return e;
  }
}

function fullButton(): HTMLElement {
  return screen.getByRole('button', { name: /Full dataset/ });
}

function sampleButton(): HTMLElement {
  return screen.getByRole('button', { name: /Sample dataset/ });
}

function paths(mock: ReturnType<typeof vi.fn>): unknown[] {
  return mock.mock.calls.map(([path]) => path);
}

describe('DatasetDownload', () => {
  let saved: ReturnType<typeof vi.spyOn>;
  let toastError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetAllMocks();
    features.explorer.allowDownload = true;
    features.explorer.enablePfbExport = true;
    features.explorer.enableSampleDataset = true;
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:pic-sure');
    vi.spyOn(window, 'open').mockReturnValue({} as Window);
    toastError = vi.spyOn(toaster, 'error').mockImplementation(() => '');
    saved = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('shows both options when the flag is on', () => {
    render(DatasetDownload, { dataset: makeDataset() });

    expect(fullButton()).toBeEnabled();
    expect(sampleButton()).toBeEnabled();
  });

  it('hides the sample option when the flag is off', () => {
    features.explorer.enableSampleDataset = false;
    render(DatasetDownload, { dataset: makeDataset() });

    expect(fullButton()).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Sample dataset/ })).not.toBeInTheDocument();
  });

  it('shows neither option for a V2 dataset', () => {
    const dataset = {
      ...makeDataset(),
      version: QueryVersion.V2,
      query: { expectedResultType: 'DATAFRAME', fields: [] } as unknown as DataSet['query'],
    };
    render(DatasetDownload, { dataset });

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows neither option when the stored result type is not an export type', () => {
    render(DatasetDownload, { dataset: makeDataset('COUNT') });

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows neither option for a PFB dataset when PFB export is off', () => {
    features.explorer.enablePfbExport = false;
    render(DatasetDownload, { dataset: makeDataset('DATAFRAME_PFB') });

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows neither option for a CSV dataset when downloads are off', () => {
    features.explorer.allowDownload = false;
    render(DatasetDownload, { dataset: makeDataset() });

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('reuses an already linked sample query', async () => {
    get.mockResolvedValueOnce({ status: 'AVAILABLE' }).mockResolvedValueOnce('a,b\n1,2\n');
    render(DatasetDownload, { dataset: makeDataset('DATAFRAME', [FULL_LINK, SAMPLE_LINK]) });

    await fireEvent.click(sampleButton());
    await fireEvent.click(await screen.findByRole('button', { name: /Download as CSV/ }));

    await waitFor(() => expect(saved).toHaveBeenCalledTimes(1));
    expect(post).not.toHaveBeenCalled();
    expect(put).not.toHaveBeenCalled();
    expect(paths(get)).toEqual([statusPath('sample-id'), `${QUERY_PATH}/sample-id/result`]);
    expect(toastError).not.toHaveBeenCalled();
  });

  it('downloads the full dataset through the query behind the Dataset ID', async () => {
    get.mockResolvedValueOnce({ status: 'AVAILABLE' }).mockResolvedValueOnce('a,b\n1,2\n');
    render(DatasetDownload, { dataset: makeDataset() });

    await fireEvent.click(fullButton());
    await fireEvent.click(await screen.findByRole('button', { name: /Download as CSV/ }));

    await waitFor(() => expect(saved).toHaveBeenCalledTimes(1));
    expect(post).not.toHaveBeenCalled();
    expect(put).not.toHaveBeenCalled();
    expect(paths(get)).toEqual([statusPath('full-id'), `${QUERY_PATH}/full-id/result`]);
  });

  it('submits with sample true and links the new query when none is linked', async () => {
    post.mockResolvedValueOnce({ picsureResultId: 'sample-id' });
    put.mockResolvedValueOnce({});
    get.mockResolvedValueOnce({ status: 'AVAILABLE' });
    const onlinked = vi.fn();
    render(DatasetDownload, { dataset: makeDataset(), onlinked });

    await fireEvent.click(sampleButton());
    await screen.findByRole('button', { name: /Download as CSV/ });

    expect(paths(post)).toEqual([QUERY_PATH]);
    const body = JSON.parse(JSON.stringify(post.mock.calls[0][1]));
    expect(body.query.sample).toBe(true);
    expect(body.query.expectedResultType).toBe('DATAFRAME');
    expect(body.query.select).toEqual(['\\study\\age\\']);
    expect(paths(put)).toEqual([DATASET_PATH]);
    expect(put.mock.calls[0][1]).toEqual({
      queryId: 'sample-id',
      name: 'My cohort',
      archived: false,
      metadata: { note: 'kept' },
    });
    expect(paths(get)).toEqual([statusPath('sample-id')]);
    expect(onlinked).toHaveBeenCalledTimes(1);
    expect(onlinked.mock.calls[0][0].queryId).toBe('full-id');
    expect(onlinked.mock.calls[0][0].queries).toEqual([FULL_LINK, SAMPLE_LINK]);
    expect(toastError).not.toHaveBeenCalled();
  });

  it('treats a 409 on link as already linked', async () => {
    post.mockResolvedValueOnce({ picsureResultId: 'sample-id' });
    put.mockRejectedValueOnce(conflict());
    get.mockResolvedValueOnce({ status: 'AVAILABLE' });
    const onlinked = vi.fn();
    render(DatasetDownload, { dataset: makeDataset(), onlinked });

    await fireEvent.click(sampleButton());
    await screen.findByRole('button', { name: /Download as CSV/ });

    expect(paths(get)).toEqual([statusPath('sample-id')]);
    expect(onlinked.mock.calls[0][0].queries).toEqual([FULL_LINK, SAMPLE_LINK]);
    expect(toastError).not.toHaveBeenCalled();
  });

  it('reuses the newly linked query on a second click without another submit', async () => {
    post.mockResolvedValueOnce({ picsureResultId: 'sample-id' });
    put.mockResolvedValueOnce({});
    get.mockResolvedValue({ status: 'AVAILABLE' });
    const onlinked = vi.fn();
    const { rerender } = render(DatasetDownload, { dataset: makeDataset(), onlinked });

    await fireEvent.click(sampleButton());
    await waitFor(() => expect(onlinked).toHaveBeenCalledTimes(1));
    await rerender({ dataset: onlinked.mock.calls[0][0], onlinked });
    await waitFor(() => expect(sampleButton()).toBeEnabled());
    await fireEvent.click(sampleButton());
    await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(sampleButton()).toBeEnabled());

    expect(post).toHaveBeenCalledTimes(1);
    expect(put).toHaveBeenCalledTimes(1);
    expect(onlinked).toHaveBeenCalledTimes(1);
    expect(paths(get)).toEqual([statusPath('sample-id'), statusPath('sample-id')]);
  });

  it('shows the not available message on sample_disabled', async () => {
    post.mockRejectedValueOnce(sampleDisabled);
    render(DatasetDownload, { dataset: makeDataset() });

    await fireEvent.click(sampleButton());

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith({
        title: 'Sample datasets are not available at this time',
        closable: true,
      }),
    );
    expect(toastError).toHaveBeenCalledTimes(1);
    expect(put).not.toHaveBeenCalled();
    expect(get).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: /Download as CSV/ })).not.toBeInTheDocument();
    await waitFor(() => expect(sampleButton()).toBeEnabled());
  });

  it('shows the consent message when the submit is denied', async () => {
    post.mockRejectedValueOnce(consentDenied);
    render(DatasetDownload, { dataset: makeDataset() });

    await fireEvent.click(sampleButton());

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith({
        title: 'You no longer have consent',
        closable: true,
      }),
    );
    expect(toastError).toHaveBeenCalledTimes(1);
  });

  it('shows the preparation failure once when the submit fails', async () => {
    post.mockRejectedValueOnce({ status: 500, body: { message: 'Server Error' } });
    render(DatasetDownload, { dataset: makeDataset() });

    await fireEvent.click(sampleButton());

    await waitFor(() => expect(toastError).toHaveBeenCalledWith(PREPARE_FAILED_TOAST));
    expect(toastError).toHaveBeenCalledTimes(1);
  });

  it('shows the preparation failure once when the export reports ERROR', async () => {
    get.mockResolvedValueOnce({ status: 'ERROR' });
    render(DatasetDownload, { dataset: makeDataset() });

    await fireEvent.click(fullButton());

    await waitFor(() => expect(toastError).toHaveBeenCalledWith(PREPARE_FAILED_TOAST));
    expect(toastError).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: /Download as CSV/ })).not.toBeInTheDocument();
  });

  it('shows the not ready toast once when the status wait runs out of attempts', async () => {
    vi.useFakeTimers();
    get.mockResolvedValue({ status: 'PENDING' });
    render(DatasetDownload, { dataset: makeDataset() });

    await fireEvent.click(fullButton());
    await vi.advanceTimersByTimeAsync(STATUS_WAIT_LIMIT_MS);

    expect(toastError).toHaveBeenCalledTimes(1);
    expect(toastError).toHaveBeenCalledWith(NOT_READY_TOAST);
    expect(paths(get)).toEqual(Array(15).fill(statusPath('full-id')));
  });

  it('disables both buttons while a request is in flight', async () => {
    let finishSubmit: (value: { picsureResultId: string }) => void = () => {};
    post.mockReturnValueOnce(new Promise((resolve) => (finishSubmit = resolve)));
    put.mockResolvedValueOnce({});
    get.mockResolvedValueOnce({ status: 'AVAILABLE' });
    render(DatasetDownload, { dataset: makeDataset() });

    await fireEvent.click(sampleButton());

    expect(sampleButton()).toBeDisabled();
    expect(sampleButton()).toHaveAttribute('aria-busy', 'true');
    expect(fullButton()).toBeDisabled();
    expect(fullButton()).not.toHaveAttribute('aria-busy');

    sampleButton().removeAttribute('disabled');
    await fireEvent.click(sampleButton());
    expect(post).toHaveBeenCalledTimes(1);

    finishSubmit({ picsureResultId: 'sample-id' });
    await waitFor(() => expect(fullButton()).toBeEnabled());
    expect(sampleButton()).toBeEnabled();
    expect(sampleButton()).not.toHaveAttribute('aria-busy');
  });

  it('hands a PFB dataset to the signed URL export with the linked query id', async () => {
    const samplePfb: LinkedQuery = {
      queryId: 'sample-pfb',
      sample: true,
      resultType: 'DATAFRAME_PFB',
    };
    get
      .mockResolvedValueOnce({ status: 'AVAILABLE' })
      .mockResolvedValueOnce({ signedUrl: 'https://signed.example/file.avro' });
    render(DatasetDownload, {
      dataset: makeDataset('DATAFRAME_PFB', [
        { ...FULL_LINK, resultType: 'DATAFRAME_PFB' },
        samplePfb,
      ]),
    });

    await fireEvent.click(sampleButton());
    await fireEvent.click(await screen.findByRole('button', { name: 'Export to Terra' }));

    await waitFor(() =>
      expect(window.open).toHaveBeenCalledWith(
        'https://terra.example/import?url=' +
          encodeURIComponent('https://signed.example/file.avro'),
        '_blank',
      ),
    );
    expect(paths(get)).toEqual([statusPath('sample-pfb'), `${QUERY_PATH}/sample-pfb/signed-url`]);
    expect(screen.getByRole('button', { name: /Download as PFB/ })).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it('stops waiting and shows no toast after the page is left', async () => {
    vi.useFakeTimers();
    get.mockResolvedValue({ status: 'PENDING' });
    const { unmount } = render(DatasetDownload, { dataset: makeDataset() });

    await fireEvent.click(fullButton());
    await vi.advanceTimersByTimeAsync(700);
    expect(get).toHaveBeenCalledTimes(2);
    unmount();
    await vi.advanceTimersByTimeAsync(STATUS_WAIT_LIMIT_MS);

    expect(get).toHaveBeenCalledTimes(2);
    expect(toastError).not.toHaveBeenCalled();
  });
});
