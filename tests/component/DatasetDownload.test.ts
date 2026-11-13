// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { error } from '@sveltejs/kit';

const { get, post, put, createLog, notReady, features } = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  createLog: vi.fn(),
  notReady: { status: 409, body: { message: '{"errorType":"result_not_ready"}' } },
  features: {
    confirmDownload: false,
    explorer: {
      allowDownload: true,
      enablePfbExport: true,
      enableExportTimeseries: true,
      enableSampleDataset: true,
    },
  },
}));

type Refusal = { status?: number; body?: { message?: string; errorType?: string } } | undefined;

vi.mock('$app/environment', () => ({ browser: true }));
vi.mock('$lib/api', () => ({
  get,
  post,
  put,
  isResultNotReady: (e: unknown) => e === notReady,
  isSampleDisabled: (e: Refusal) =>
    e?.status === 400 && String(e.body?.message).includes('sample_disabled'),
  consentDeniedMessage: (e: Refusal) =>
    e?.status === 403 && e.body?.errorType === 'consent_denied' ? e.body.message : undefined,
  serverErrorMessage: (e: Refusal) => {
    if (!e?.status || e.status < 400 || e.status > 499) {
      return undefined;
    }
    try {
      return JSON.parse(String(e.body?.message)).message as string | undefined;
    } catch {
      return undefined;
    }
  },
}));
vi.mock('$lib/logger', () => ({ log: vi.fn(), createLog }));
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

function httpError(status: number, body: string | App.Error): unknown {
  try {
    error(status, body as string);
  } catch (e) {
    return e;
  }
}

const SAMPLE_DISABLED_BODY = '{"errorType":"sample_disabled","message":"Sampling is off"}';
const CONSENT_DENIED_BODY = { message: 'You no longer have consent', errorType: 'consent_denied' };
const SAMPLE_DISABLED_TOAST = {
  title: 'Sample datasets are not available at this time',
  closable: true,
};
const CONSENT_DENIED_TOAST = { title: 'You no longer have consent', closable: true };

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

function fullButton(): HTMLElement {
  return screen.getByRole('button', { name: /Full dataset/ });
}

function sampleButton(): HTMLElement {
  return screen.getByRole('button', { name: /Sample dataset/ });
}

function typeControl(): HTMLSelectElement {
  return screen.getByLabelText('Export type') as HTMLSelectElement;
}

function offeredTypes(): string[] {
  return Array.from(typeControl().options).map((option) => option.value);
}

async function chooseType(type: string): Promise<void> {
  await fireEvent.change(typeControl(), { target: { value: type } });
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
    features.explorer.enableExportTimeseries = true;
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

  it('shows neither option for a federated dataset', () => {
    render(DatasetDownload, {
      dataset: { ...makeDataset(), federated: { commonId: 'common-area-uuid' } },
    });

    expect(screen.queryByTestId('dataset-download')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('reuses a sample query the dataset lists', async () => {
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

  it('submits and sends no PUT when the variant is not listed', async () => {
    post.mockResolvedValueOnce({ picsureResultId: 'sample-id' });
    get.mockResolvedValueOnce({ status: 'AVAILABLE' }).mockResolvedValueOnce('a,b\n1,2\n');
    render(DatasetDownload, { dataset: makeDataset() });

    await fireEvent.click(sampleButton());
    await fireEvent.click(await screen.findByRole('button', { name: /Download as CSV/ }));

    await waitFor(() => expect(saved).toHaveBeenCalledTimes(1));
    expect(paths(post)).toEqual([QUERY_PATH]);
    const body = JSON.parse(JSON.stringify(post.mock.calls[0][1]));
    expect(body.query.sample).toBe(true);
    expect(body.query.expectedResultType).toBe('DATAFRAME');
    expect(body.query.select).toEqual(['\\study\\age\\']);
    expect(put).not.toHaveBeenCalled();
    expect(paths(get)).toEqual([statusPath('sample-id'), `${QUERY_PATH}/sample-id/result`]);
    expect(toastError).not.toHaveBeenCalled();
  });

  it('submits the full variant for a dataset that lists no queries', async () => {
    post.mockResolvedValueOnce({ picsureResultId: 'full-id' });
    get.mockResolvedValueOnce({ status: 'AVAILABLE' }).mockResolvedValueOnce('a,b\n1,2\n');
    render(DatasetDownload, { dataset: makeDataset('DATAFRAME', []) });

    await fireEvent.click(fullButton());
    await fireEvent.click(await screen.findByRole('button', { name: /Download as CSV/ }));

    await waitFor(() => expect(saved).toHaveBeenCalledTimes(1));
    expect(paths(post)).toEqual([QUERY_PATH]);
    const body = JSON.parse(JSON.stringify(post.mock.calls[0][1]));
    expect(body.query).not.toHaveProperty('sample');
    expect(body.query.expectedResultType).toBe('DATAFRAME');
    expect(put).not.toHaveBeenCalled();
    expect(paths(get)).toEqual([statusPath('full-id'), `${QUERY_PATH}/full-id/result`]);
    expect(toastError).not.toHaveBeenCalled();
  });

  it.each([
    { label: 'sample', sample: true, queryId: 'sample-id' },
    { label: 'full', sample: false, queryId: 'full-id' },
  ])('logs the $label variant on the download', async ({ label, sample, queryId }) => {
    get.mockResolvedValueOnce({ status: 'AVAILABLE' }).mockResolvedValueOnce('a,b\n1,2\n');
    render(DatasetDownload, { dataset: makeDataset('DATAFRAME', [FULL_LINK, SAMPLE_LINK]) });

    await fireEvent.click(label === 'sample' ? sampleButton() : fullButton());
    await fireEvent.click(await screen.findByRole('button', { name: /Download as CSV/ }));

    await waitFor(() => expect(saved).toHaveBeenCalledTimes(1));
    const variant = { type: 'DATAFRAME', datasetId: queryId, sample };
    expect(createLog).toHaveBeenCalledWith('DOWNLOAD', 'export.download_clicked', variant);
    expect(createLog).toHaveBeenCalledWith(
      'DOWNLOAD',
      'export.download_success',
      variant,
      expect.anything(),
    );
    expect(post).not.toHaveBeenCalled();
  });

  it('logs the sample variant on the PFB signed URL export', async () => {
    get
      .mockResolvedValueOnce({ status: 'AVAILABLE' })
      .mockResolvedValueOnce({ signedUrl: 'https://signed.example/file.avro' });
    render(DatasetDownload, {
      dataset: makeDataset('DATAFRAME_PFB', [
        { ...FULL_LINK, resultType: 'DATAFRAME_PFB' },
        { queryId: 'sample-pfb', sample: true, resultType: 'DATAFRAME_PFB' },
      ]),
    });

    await fireEvent.click(sampleButton());
    await fireEvent.click(await screen.findByRole('button', { name: 'Export to Terra' }));

    await waitFor(() => expect(window.open).toHaveBeenCalledTimes(1));
    expect(createLog).toHaveBeenCalledWith('EXPORT', 'export.pfb_signed_url', {
      platform: 'Terra',
      datasetId: 'sample-pfb',
      sample: true,
    });
  });

  it('a second click submits again and uses the id the server returns', async () => {
    post
      .mockResolvedValueOnce({ picsureResultId: 'sample-id' })
      .mockResolvedValueOnce({ picsureResultId: 'sample-id-again' });
    get.mockResolvedValue({ status: 'AVAILABLE' });
    render(DatasetDownload, { dataset: makeDataset() });

    await fireEvent.click(sampleButton());
    await screen.findByRole('button', { name: /Download as CSV/ });
    await waitFor(() => expect(sampleButton()).toBeEnabled());
    await fireEvent.click(sampleButton());
    await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
    await screen.findByRole('button', { name: /Download as CSV/ });
    await waitFor(() => expect(sampleButton()).toBeEnabled());

    expect(paths(post)).toEqual([QUERY_PATH, QUERY_PATH]);
    expect(post.mock.calls[1][1]).toEqual(post.mock.calls[0][1]);
    expect(put).not.toHaveBeenCalled();
    expect(paths(get)).toEqual([statusPath('sample-id'), statusPath('sample-id-again')]);
    expect(toastError).not.toHaveBeenCalled();
  });

  it('shows the not available message on sample_disabled', async () => {
    post.mockRejectedValueOnce(httpError(400, SAMPLE_DISABLED_BODY));
    render(DatasetDownload, { dataset: makeDataset() });

    await fireEvent.click(sampleButton());

    await waitFor(() => expect(toastError).toHaveBeenCalledWith(SAMPLE_DISABLED_TOAST));
    expect(toastError).toHaveBeenCalledTimes(1);
    expect(put).not.toHaveBeenCalled();
    expect(get).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: /Download as CSV/ })).not.toBeInTheDocument();
    await waitFor(() => expect(sampleButton()).toBeEnabled());
  });

  it('shows the consent message when the submit is denied', async () => {
    post.mockRejectedValueOnce(httpError(403, CONSENT_DENIED_BODY));
    render(DatasetDownload, { dataset: makeDataset() });

    await fireEvent.click(sampleButton());

    await waitFor(() => expect(toastError).toHaveBeenCalledWith(CONSENT_DENIED_TOAST));
    expect(toastError).toHaveBeenCalledTimes(1);
  });

  it.each([
    {
      name: '400 sample_disabled',
      refusal: () => httpError(400, SAMPLE_DISABLED_BODY),
      toast: SAMPLE_DISABLED_TOAST,
    },
    {
      name: 'consent-denied 403',
      refusal: () => httpError(403, CONSENT_DENIED_BODY),
      toast: CONSENT_DENIED_TOAST,
    },
    { name: '404', refusal: () => httpError(404, 'Not Found'), toast: PREPARE_FAILED_TOAST },
    {
      name: '403 that ended the session',
      refusal: () => httpError(403, 'Forbidden'),
      toast: PREPARE_FAILED_TOAST,
    },
  ])('stops the status wait on a $name and shows its message', async ({ refusal, toast }) => {
    vi.useFakeTimers();
    get.mockRejectedValue(refusal());
    render(DatasetDownload, { dataset: makeDataset('DATAFRAME', [FULL_LINK, SAMPLE_LINK]) });

    await fireEvent.click(sampleButton());
    await vi.advanceTimersByTimeAsync(STATUS_WAIT_LIMIT_MS);

    expect(toastError).toHaveBeenCalledTimes(1);
    expect(toastError).toHaveBeenCalledWith(toast);
    expect(paths(get)).toEqual([statusPath('sample-id')]);
    expect(screen.queryByRole('button', { name: /Download as CSV/ })).not.toBeInTheDocument();
    expect(sampleButton()).toBeEnabled();
  });

  it('stops the status wait and shows no toast when a 401 has logged the user out', async () => {
    vi.useFakeTimers();
    get.mockResolvedValue(undefined);
    render(DatasetDownload, { dataset: makeDataset('DATAFRAME', [FULL_LINK, SAMPLE_LINK]) });

    await fireEvent.click(sampleButton());
    await vi.advanceTimersByTimeAsync(STATUS_WAIT_LIMIT_MS);

    expect(toastError).not.toHaveBeenCalled();
    expect(paths(get)).toEqual([statusPath('sample-id')]);
    expect(screen.queryByRole('button', { name: /Download as CSV/ })).not.toBeInTheDocument();
    expect(sampleButton()).toBeEnabled();
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

  it('lists every export type and selects the stored one', () => {
    render(DatasetDownload, { dataset: makeDataset('DATAFRAME_TIMESERIES') });

    expect(offeredTypes()).toEqual(['DATAFRAME', 'DATAFRAME_TIMESERIES', 'DATAFRAME_PFB']);
    expect(typeControl().value).toBe('DATAFRAME_TIMESERIES');
  });

  it('lists only the enabled types', () => {
    features.explorer.enablePfbExport = false;
    features.explorer.enableExportTimeseries = false;
    render(DatasetDownload, { dataset: makeDataset() });

    expect(offeredTypes()).toEqual(['DATAFRAME']);
  });

  it('lists the stored type when its switch is off', () => {
    features.explorer.enablePfbExport = false;
    features.explorer.enableExportTimeseries = false;
    render(DatasetDownload, { dataset: makeDataset('DATAFRAME_TIMESERIES') });

    expect(offeredTypes()).toEqual(['DATAFRAME', 'DATAFRAME_TIMESERIES']);
    expect(typeControl().value).toBe('DATAFRAME_TIMESERIES');
  });

  it('submits the chosen type with sample set when the sample is clicked', async () => {
    post.mockResolvedValueOnce({ picsureResultId: 'sample-timeseries' });
    get.mockResolvedValueOnce({ status: 'AVAILABLE' }).mockResolvedValueOnce('a,b\n1,2\n');
    render(DatasetDownload, { dataset: makeDataset('DATAFRAME', [FULL_LINK, SAMPLE_LINK]) });

    await chooseType('DATAFRAME_TIMESERIES');
    await fireEvent.click(sampleButton());
    await fireEvent.click(await screen.findByRole('button', { name: /Download as CSV/ }));

    await waitFor(() => expect(saved).toHaveBeenCalledTimes(1));
    expect(paths(post)).toEqual([QUERY_PATH]);
    const body = JSON.parse(JSON.stringify(post.mock.calls[0][1]));
    expect(body.query.sample).toBe(true);
    expect(body.query.expectedResultType).toBe('DATAFRAME_TIMESERIES');
    expect(put).not.toHaveBeenCalled();
    expect(paths(get)).toEqual([
      statusPath('sample-timeseries'),
      `${QUERY_PATH}/sample-timeseries/result`,
    ]);
    expect((saved.mock.contexts[0] as HTMLAnchorElement).download).toBe('pic-sure-data.csv');
    expect(createLog).toHaveBeenCalledWith('DOWNLOAD', 'export.download_clicked', {
      type: 'DATAFRAME_TIMESERIES',
      datasetId: 'sample-timeseries',
      sample: true,
    });
  });

  it('leaves sample off when the full variant of a chosen type is submitted', async () => {
    post.mockResolvedValueOnce({ picsureResultId: 'full-pfb' });
    get.mockResolvedValueOnce({ status: 'AVAILABLE' });
    render(DatasetDownload, { dataset: makeDataset() });

    await chooseType('DATAFRAME_PFB');
    await fireEvent.click(fullButton());
    await screen.findByRole('button', { name: /Download as PFB/ });

    const body = JSON.parse(JSON.stringify(post.mock.calls[0][1]));
    expect(body.query).not.toHaveProperty('sample');
    expect(body.query.expectedResultType).toBe('DATAFRAME_PFB');
  });

  it('goes straight to status with the listed row of the chosen type', async () => {
    get.mockResolvedValueOnce({ status: 'AVAILABLE' }).mockResolvedValueOnce(new ArrayBuffer(4));
    render(DatasetDownload, {
      dataset: makeDataset('DATAFRAME', [
        FULL_LINK,
        SAMPLE_LINK,
        { queryId: 'full-pfb', sample: false, resultType: 'DATAFRAME_PFB' },
        { queryId: 'sample-pfb', sample: true, resultType: 'DATAFRAME_PFB' },
      ]),
    });

    await chooseType('DATAFRAME_PFB');
    await fireEvent.click(sampleButton());
    await fireEvent.click(await screen.findByRole('button', { name: /Download as PFB/ }));

    await waitFor(() => expect(saved).toHaveBeenCalledTimes(1));
    expect(post).not.toHaveBeenCalled();
    expect(paths(get)).toEqual([statusPath('sample-pfb'), `${QUERY_PATH}/sample-pfb/result`]);
    expect((saved.mock.contexts[0] as HTMLAnchorElement).download).toBe('pic-sure-data.avro');
    expect(screen.getByRole('button', { name: 'Export to Terra' })).toBeInTheDocument();
  });

  it('saves a data frame as a CSV file', async () => {
    get.mockResolvedValueOnce({ status: 'AVAILABLE' }).mockResolvedValueOnce('a,b\n1,2\n');
    render(DatasetDownload, { dataset: makeDataset('DATAFRAME_PFB', [FULL_LINK]) });

    await chooseType('DATAFRAME');
    await fireEvent.click(fullButton());
    await fireEvent.click(await screen.findByRole('button', { name: /Download as CSV/ }));

    await waitFor(() => expect(saved).toHaveBeenCalledTimes(1));
    expect(post).not.toHaveBeenCalled();
    expect(paths(get)).toEqual([statusPath('full-id'), `${QUERY_PATH}/full-id/result`]);
    expect((saved.mock.contexts[0] as HTMLAnchorElement).download).toBe('pic-sure-data.csv');
    expect(screen.queryByRole('button', { name: 'Export to Terra' })).not.toBeInTheDocument();
  });

  it('disables the type control while a download is being prepared', async () => {
    let finishSubmit: (value: { picsureResultId: string }) => void = () => {};
    post.mockReturnValueOnce(new Promise((resolve) => (finishSubmit = resolve)));
    get.mockResolvedValueOnce({ status: 'AVAILABLE' });
    render(DatasetDownload, { dataset: makeDataset() });

    await chooseType('DATAFRAME_TIMESERIES');
    await fireEvent.click(sampleButton());
    expect(typeControl()).toBeDisabled();

    typeControl().removeAttribute('disabled');
    await chooseType('DATAFRAME_PFB');

    finishSubmit({ picsureResultId: 'sample-timeseries' });
    await screen.findByRole('button', { name: /Download as CSV/ });
    await waitFor(() => expect(typeControl()).toBeEnabled());
    expect(typeControl().value).toBe('DATAFRAME_TIMESERIES');
    expect(screen.queryByRole('button', { name: /Download as PFB/ })).not.toBeInTheDocument();
    expect(paths(get)).toEqual([statusPath('sample-timeseries')]);
  });

  it('drops the prepared download when another type is chosen', async () => {
    get.mockResolvedValueOnce({ status: 'AVAILABLE' });
    render(DatasetDownload, { dataset: makeDataset() });

    await fireEvent.click(fullButton());
    await screen.findByRole('button', { name: /Download as CSV/ });
    await waitFor(() => expect(typeControl()).toBeEnabled());
    await chooseType('DATAFRAME_PFB');

    expect(screen.queryByTestId('dataset-download-ready')).not.toBeInTheDocument();
  });

  it('shows the message the server refused the submit with', async () => {
    post.mockRejectedValueOnce(httpError(400, '{"message":"Result type is not allowed"}'));
    render(DatasetDownload, { dataset: makeDataset() });

    await chooseType('DATAFRAME_PFB');
    await fireEvent.click(fullButton());

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith({
        title: 'Result type is not allowed',
        closable: true,
      }),
    );
    expect(toastError).toHaveBeenCalledTimes(1);
    expect(get).not.toHaveBeenCalled();
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
