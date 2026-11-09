// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { error } from '@sveltejs/kit';

const { get, notReady } = vi.hoisted(() => ({
  get: vi.fn(),
  notReady: { status: 409, body: { message: '{"errorType":"result_not_ready"}' } },
}));

type Refusal = { status?: number; body?: { message?: string; errorType?: string } } | undefined;

vi.mock('$app/environment', () => ({ browser: true }));
vi.mock('$lib/api', () => ({
  get,
  isResultNotReady: (e: unknown) => e === notReady,
  isSampleDisabled: (e: Refusal) =>
    e?.status === 400 && String(e.body?.message).includes('sample_disabled'),
  consentDeniedMessage: (e: Refusal) =>
    e?.status === 403 && e.body?.errorType === 'consent_denied' ? e.body.message : undefined,
}));
vi.mock('$lib/logger', () => ({ log: vi.fn(), createLog: vi.fn() }));
vi.mock('$lib/configuration.svelte', () => ({
  config: {
    features: { confirmDownload: false, explorer: { allowDownload: true, enablePfbExport: true } },
    branding: { explorePage: {} },
  },
  resetConfig: () => {},
}));

import DownloadButton from '$lib/components/explorer/export/DownloadButton.svelte';
import type { QueryRequestInterfaceV3 } from '$lib/models/api/Request';
import { toaster } from '$lib/toaster';

const RESULT_PATH = 'picsure/hpds/auth/query/dataset-1/result';
const STATUS_PATH = 'picsure/hpds/auth/query/dataset-1/status';
const NOT_READY_TOAST = {
  title: 'The export is not ready yet. Please try again in a few minutes.',
  closable: true,
};
const PREPARE_FAILED_TOAST = {
  title:
    'An error occurred while preparing your dataset. Please try again. If this problem persists, please contact an administrator.',
  closable: true,
};
const STATUS_WAIT_LIMIT_MS = 11 * 60000;
const query = { query: { expectedResultType: 'DATAFRAME' } } as unknown as QueryRequestInterfaceV3;

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

describe('DownloadButton', () => {
  let saved: ReturnType<typeof vi.spyOn>;
  let toastError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:pic-sure');
    toastError = vi.spyOn(toaster, 'error').mockImplementation(() => '');
    saved = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('re-polls status and retries the download after result_not_ready', async () => {
    get
      .mockRejectedValueOnce(notReady)
      .mockResolvedValueOnce({ status: 'AVAILABLE' })
      .mockResolvedValueOnce('a,b\n1,2\n');
    render(DownloadButton, { query, datasetId: 'dataset-1' });

    await fireEvent.click(screen.getByRole('button', { name: /Download as CSV/ }));

    await waitFor(() => expect(saved).toHaveBeenCalledTimes(1));
    expect(get.mock.calls.map(([path]) => path)).toEqual([RESULT_PATH, STATUS_PATH, RESULT_PATH]);
    expect(toastError).not.toHaveBeenCalled();
  });

  it('stops after a second result_not_ready', async () => {
    get
      .mockRejectedValueOnce(notReady)
      .mockResolvedValueOnce({ status: 'AVAILABLE' })
      .mockRejectedValueOnce(notReady);
    render(DownloadButton, { query, datasetId: 'dataset-1' });

    await fireEvent.click(screen.getByRole('button', { name: /Download as CSV/ }));

    await waitFor(() => expect(get).toHaveBeenCalledTimes(3));
    await waitFor(() => expect(toastError).toHaveBeenCalledWith(NOT_READY_TOAST));
    expect(toastError).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledTimes(3);
    expect(saved).not.toHaveBeenCalled();
  });

  it('shows the not ready toast when the status wait runs out of attempts', async () => {
    vi.useFakeTimers();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    get.mockRejectedValueOnce(notReady).mockResolvedValue({ status: 'PENDING' });
    render(DownloadButton, { query, datasetId: 'dataset-1' });

    await fireEvent.click(screen.getByRole('button', { name: /Download as CSV/ }));
    await vi.advanceTimersByTimeAsync(STATUS_WAIT_LIMIT_MS);

    expect(toastError).toHaveBeenCalledTimes(1);
    expect(toastError).toHaveBeenCalledWith(NOT_READY_TOAST);
    expect(get.mock.calls.map(([path]) => path)).toEqual([
      RESULT_PATH,
      ...Array(15).fill(STATUS_PATH),
    ]);
    expect(saved).not.toHaveBeenCalled();
  });

  it('shows the preparation failure when the export reports ERROR', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    get.mockRejectedValueOnce(notReady).mockResolvedValueOnce({ status: 'ERROR' });
    render(DownloadButton, { query, datasetId: 'dataset-1' });

    await fireEvent.click(screen.getByRole('button', { name: /Download as CSV/ }));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith(PREPARE_FAILED_TOAST));
    expect(toastError).toHaveBeenCalledTimes(1);
    expect(get.mock.calls.map(([path]) => path)).toEqual([RESULT_PATH, STATUS_PATH]);
    expect(saved).not.toHaveBeenCalled();
  });

  it('starts no second request when clicked again during the status wait', async () => {
    let finishStatus: (value: { status: string }) => void = () => {};
    get
      .mockRejectedValueOnce(notReady)
      .mockReturnValueOnce(new Promise((resolve) => (finishStatus = resolve)))
      .mockResolvedValueOnce('a,b\n1,2\n');
    render(DownloadButton, { query, datasetId: 'dataset-1' });
    const button = screen.getByRole('button', { name: /Download as CSV/ });

    await fireEvent.click(button);
    await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
    expect(button).toBeDisabled();
    await fireEvent.click(button);
    button.removeAttribute('disabled');
    await fireEvent.click(button);

    expect(get.mock.calls.map(([path]) => path)).toEqual([RESULT_PATH, STATUS_PATH]);

    finishStatus({ status: 'AVAILABLE' });
    await waitFor(() => expect(saved).toHaveBeenCalledTimes(1));
    expect(get.mock.calls.map(([path]) => path)).toEqual([RESULT_PATH, STATUS_PATH, RESULT_PATH]);
    await waitFor(() => expect(button).toBeEnabled());
  });

  it('starts no download and shows no toast after the page is left during the wait', async () => {
    vi.useFakeTimers();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    get.mockRejectedValueOnce(notReady).mockResolvedValue({ status: 'PENDING' });
    const { unmount } = render(DownloadButton, { query, datasetId: 'dataset-1' });

    await fireEvent.click(screen.getByRole('button', { name: /Download as CSV/ }));
    await vi.advanceTimersByTimeAsync(700);
    expect(get).toHaveBeenCalledTimes(3);
    unmount();
    await vi.advanceTimersByTimeAsync(STATUS_WAIT_LIMIT_MS);

    expect(get).toHaveBeenCalledTimes(3);
    expect(toastError).not.toHaveBeenCalled();
    expect(saved).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  it('shows the sample message when the result answers 400 sample_disabled', async () => {
    get.mockRejectedValueOnce(httpError(400, SAMPLE_DISABLED_BODY));
    render(DownloadButton, { query, datasetId: 'dataset-1' });

    await fireEvent.click(screen.getByRole('button', { name: /Download as CSV/ }));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith(SAMPLE_DISABLED_TOAST));
    expect(toastError).toHaveBeenCalledTimes(1);
    expect(get.mock.calls.map(([path]) => path)).toEqual([RESULT_PATH]);
    expect(saved).not.toHaveBeenCalled();
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
  ])('stops the status wait on a $name and shows its message', async ({ refusal, toast }) => {
    vi.useFakeTimers();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    get.mockRejectedValueOnce(notReady).mockRejectedValue(refusal());
    render(DownloadButton, { query, datasetId: 'dataset-1' });

    await fireEvent.click(screen.getByRole('button', { name: /Download as CSV/ }));
    await vi.advanceTimersByTimeAsync(STATUS_WAIT_LIMIT_MS);

    expect(toastError).toHaveBeenCalledTimes(1);
    expect(toastError).toHaveBeenCalledWith(toast);
    expect(get.mock.calls.map(([path]) => path)).toEqual([RESULT_PATH, STATUS_PATH]);
    expect(saved).not.toHaveBeenCalled();
  });

  it('does not retry on 400', async () => {
    get.mockRejectedValueOnce({ status: 400, body: { message: 'Status : ERROR' } });
    render(DownloadButton, { query, datasetId: 'dataset-1' });

    await fireEvent.click(screen.getByRole('button', { name: /Download as CSV/ }));

    await waitFor(() => expect(console.error).toHaveBeenCalled());
    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith(RESULT_PATH);
    expect(toastError).not.toHaveBeenCalled();
    expect(saved).not.toHaveBeenCalled();
  });
});
