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
vi.mock('$lib/ExportStepperManager.svelte', () => ({
  getDatasetId: () => 'dataset-1',
  getQueryRequest: () => ({ query: { expectedResultType: 'DATAFRAME_PFB' } }),
}));
vi.mock('$lib/logger', () => ({ log: vi.fn(), createLog: vi.fn() }));
vi.mock('$lib/configuration.svelte', () => ({
  config: {
    features: { explorer: { allowDownload: false } },
    branding: {
      explorePage: {
        pfbExportUrls: [
          { title: 'Terra', url: 'https://terra.example/import?url=' },
          { title: 'Seven Bridges', url: 'https://sb.example/import?url=' },
        ],
      },
    },
  },
  resetConfig: () => {},
}));

import PfbExport from '$lib/components/explorer/export/PfbExport.svelte';
import { toaster } from '$lib/toaster';

const platforms = [
  { clicked: 'Terra', other: 'Seven Bridges' },
  { clicked: 'Seven Bridges', other: 'Terra' },
];

const SIGNED_URL_PATH = 'picsure/hpds/auth/query/dataset-1/signed-url';
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

describe('PfbExport', () => {
  let toastError: ReturnType<typeof vi.spyOn>;
  let toastInfo: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'open').mockReturnValue({} as Window);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    toastError = vi.spyOn(toaster, 'error').mockImplementation(() => '');
    toastInfo = vi.spyOn(toaster, 'info').mockImplementation(() => '');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it.each(platforms)(
    'shows the loading state only on the clicked $clicked button',
    async ({ clicked, other }) => {
      get.mockReturnValue(new Promise(() => {}));
      render(PfbExport);

      await fireEvent.click(screen.getByRole('button', { name: `Export to ${clicked}` }));

      const busy = screen.getByRole('button', { name: `Exporting to ${clicked}` });
      expect(busy).toHaveAttribute('aria-busy', 'true');
      expect(busy).toHaveTextContent('Exporting…');
      expect(busy).toBeDisabled();

      const idle = screen.getByRole('button', { name: `Export to ${other}` });
      expect(idle).not.toHaveAttribute('aria-busy');
      expect(idle).not.toHaveTextContent('Exporting');
      expect(idle).toBeDisabled();
    },
  );

  it('restores both buttons once the export finishes', async () => {
    let resolveSignedUrl: (value: { signedUrl: string }) => void = () => {};
    get.mockReturnValue(new Promise((resolve) => (resolveSignedUrl = resolve)));
    render(PfbExport);

    await fireEvent.click(screen.getByRole('button', { name: 'Export to Terra' }));
    expect(screen.getByRole('button', { name: 'Exporting to Terra' })).toBeDisabled();
    resolveSignedUrl({ signedUrl: 'https://signed.example/file.avro' });

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Export to Terra' })).toBeEnabled(),
    );
    expect(screen.getByRole('button', { name: 'Export to Seven Bridges' })).toBeEnabled();
    expect(screen.queryByText('Exporting…')).not.toBeInTheDocument();
  });

  it('re-polls status and retries after result_not_ready', async () => {
    get
      .mockRejectedValueOnce(notReady)
      .mockResolvedValueOnce({ status: 'AVAILABLE' })
      .mockResolvedValueOnce({ signedUrl: 'https://signed.example/file.avro' });
    render(PfbExport);

    await fireEvent.click(screen.getByRole('button', { name: 'Export to Terra' }));

    await waitFor(() =>
      expect(window.open).toHaveBeenCalledWith(
        'https://terra.example/import?url=' +
          encodeURIComponent('https://signed.example/file.avro'),
        '_blank',
      ),
    );
    expect(get.mock.calls.map(([path]) => path)).toEqual([
      SIGNED_URL_PATH,
      STATUS_PATH,
      SIGNED_URL_PATH,
    ]);
    expect(toastInfo).not.toHaveBeenCalled();
    expect(toastError).not.toHaveBeenCalled();
  });

  it('asks for another click when the popup is blocked after the status wait', async () => {
    vi.mocked(window.open).mockReturnValue(null);
    get
      .mockRejectedValueOnce(notReady)
      .mockResolvedValueOnce({ status: 'AVAILABLE' })
      .mockResolvedValueOnce({ signedUrl: 'https://signed.example/file.avro' });
    render(PfbExport);

    await fireEvent.click(screen.getByRole('button', { name: 'Export to Terra' }));

    await waitFor(() =>
      expect(toastInfo).toHaveBeenCalledWith({
        title: 'Your export is ready. Click the export button again to open it.',
        closable: true,
      }),
    );
    expect(window.open).toHaveBeenCalledTimes(1);
    expect(toastError).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Export to Terra' })).toBeEnabled();
  });

  it('shows no toast when the popup is blocked and there was no status wait', async () => {
    vi.mocked(window.open).mockReturnValue(null);
    get.mockResolvedValueOnce({ signedUrl: 'https://signed.example/file.avro' });
    render(PfbExport);

    await fireEvent.click(screen.getByRole('button', { name: 'Export to Terra' }));

    await waitFor(() => expect(window.open).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Export to Terra' })).toBeEnabled(),
    );
    expect(get.mock.calls.map(([path]) => path)).toEqual([SIGNED_URL_PATH]);
    expect(toastInfo).not.toHaveBeenCalled();
    expect(toastError).not.toHaveBeenCalled();
  });

  it('shows the not ready toast after a second result_not_ready', async () => {
    get
      .mockRejectedValueOnce(notReady)
      .mockResolvedValueOnce({ status: 'AVAILABLE' })
      .mockRejectedValueOnce(notReady);
    render(PfbExport);

    await fireEvent.click(screen.getByRole('button', { name: 'Export to Terra' }));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith(NOT_READY_TOAST));
    expect(toastError).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledTimes(3);
    expect(window.open).not.toHaveBeenCalled();
  });

  it('shows the not ready toast when the status wait runs out of attempts', async () => {
    vi.useFakeTimers();
    get.mockRejectedValueOnce(notReady).mockResolvedValue({ status: 'PENDING' });
    render(PfbExport);

    await fireEvent.click(screen.getByRole('button', { name: 'Export to Terra' }));
    await vi.advanceTimersByTimeAsync(STATUS_WAIT_LIMIT_MS);

    expect(toastError).toHaveBeenCalledTimes(1);
    expect(toastError).toHaveBeenCalledWith(NOT_READY_TOAST);
    expect(get.mock.calls.map(([path]) => path)).toEqual([
      SIGNED_URL_PATH,
      ...Array(15).fill(STATUS_PATH),
    ]);
    expect(window.open).not.toHaveBeenCalled();
  });

  it('stops the status wait and shows no toast when a 401 has logged the user out', async () => {
    vi.useFakeTimers();
    get.mockRejectedValueOnce(notReady).mockResolvedValue(undefined);
    render(PfbExport);

    await fireEvent.click(screen.getByRole('button', { name: 'Export to Terra' }));
    await vi.advanceTimersByTimeAsync(STATUS_WAIT_LIMIT_MS);

    expect(toastError).not.toHaveBeenCalled();
    expect(get.mock.calls.map(([path]) => path)).toEqual([SIGNED_URL_PATH, STATUS_PATH]);
    expect(window.open).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Export to Terra' })).toBeEnabled();
  });

  it('shows the preparation failure when the export reports ERROR', async () => {
    get.mockRejectedValueOnce(notReady).mockResolvedValueOnce({ status: 'ERROR' });
    render(PfbExport);

    await fireEvent.click(screen.getByRole('button', { name: 'Export to Terra' }));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith(PREPARE_FAILED_TOAST));
    expect(toastError).toHaveBeenCalledTimes(1);
    expect(get.mock.calls.map(([path]) => path)).toEqual([SIGNED_URL_PATH, STATUS_PATH]);
    expect(window.open).not.toHaveBeenCalled();
  });

  it('shows the sample message when the signed URL answers 400 sample_disabled', async () => {
    get.mockRejectedValueOnce(httpError(400, SAMPLE_DISABLED_BODY));
    render(PfbExport);

    await fireEvent.click(screen.getByRole('button', { name: 'Export to Terra' }));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith(SAMPLE_DISABLED_TOAST));
    expect(toastError).toHaveBeenCalledTimes(1);
    expect(get.mock.calls.map(([path]) => path)).toEqual([SIGNED_URL_PATH]);
    expect(window.open).not.toHaveBeenCalled();
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
    get.mockRejectedValueOnce(notReady).mockRejectedValue(refusal());
    render(PfbExport);

    await fireEvent.click(screen.getByRole('button', { name: 'Export to Terra' }));
    await vi.advanceTimersByTimeAsync(STATUS_WAIT_LIMIT_MS);

    expect(toastError).toHaveBeenCalledTimes(1);
    expect(toastError).toHaveBeenCalledWith(toast);
    expect(get.mock.calls.map(([path]) => path)).toEqual([SIGNED_URL_PATH, STATUS_PATH]);
    expect(window.open).not.toHaveBeenCalled();
  });

  it('shows the generic export error for any other failure', async () => {
    get.mockRejectedValueOnce({ status: 500, body: { message: 'Server Error' } });
    render(PfbExport);

    await fireEvent.click(screen.getByRole('button', { name: 'Export to Terra' }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith({
        title: 'Export failed. Please try again.',
        closable: true,
      }),
    );
    expect(toastError).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledTimes(1);
    expect(window.open).not.toHaveBeenCalled();
  });

  it('opens nothing and shows no toast after the page is left during the wait', async () => {
    vi.useFakeTimers();
    get.mockRejectedValueOnce(notReady).mockResolvedValue({ status: 'PENDING' });
    const { unmount } = render(PfbExport);

    await fireEvent.click(screen.getByRole('button', { name: 'Export to Terra' }));
    await vi.advanceTimersByTimeAsync(700);
    expect(get).toHaveBeenCalledTimes(3);
    unmount();
    await vi.advanceTimersByTimeAsync(STATUS_WAIT_LIMIT_MS);

    expect(get).toHaveBeenCalledTimes(3);
    expect(window.open).not.toHaveBeenCalled();
    expect(toastError).not.toHaveBeenCalled();
    expect(toastInfo).not.toHaveBeenCalled();
  });
});
