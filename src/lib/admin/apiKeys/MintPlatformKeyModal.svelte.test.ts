// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';

vi.mock('#lib/telemetry/logger.ts', () => ({
  log: vi.fn(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createLog: vi.fn((...args: any[]) => args),
  getPageContext: vi.fn(() => 'test-context'),
}));

vi.mock('#lib/auth/session.svelte.ts', () => ({
  session: { isTopAdmin: true, onEnd: () => {} },
}));

const psama = vi.hoisted(() => ({
  mintPlatform: vi.fn(),
}));

vi.mock('#lib/api/psama/apiKeys.ts', () => ({ ...psama, list: vi.fn(), revoke: vi.fn() }));

import MintPlatformKeyModal from '#lib/admin/apiKeys/MintPlatformKeyModal.svelte';
import { log, createLog } from '#lib/telemetry/logger.ts';
import { ApiError } from '#lib/api/errors.ts';

const FAKE_KEY = 'picsure_FAKE-TEST-FIXTURE-VALUE-0000000000000000000';

const mintedFixture = {
  apiKey: FAKE_KEY,
  uuid: 'uuid-new',
  displayPrefix: 'zzz99999',
  keyType: 'PLATFORM' as const,
  expiresAt: null,
};

async function openFormAndFill() {
  await fireEvent.click(screen.getByTestId('admin-api-key-mint-trigger'));
  await fireEvent.input(await screen.findByLabelText(/name/i), {
    target: { value: 'CI Pipeline' },
  });
  await fireEvent.input(screen.getByLabelText(/email/i), {
    target: { value: 'ops@example.org' },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('MintPlatformKeyModal', () => {
  it('mints a key and reveals it once with a see-once warning', async () => {
    psama.mintPlatform.mockResolvedValue(mintedFixture);
    render(MintPlatformKeyModal);

    await openFormAndFill();
    await fireEvent.click(screen.getByRole('button', { name: 'Mint Key' }));

    expect(psama.mintPlatform).toHaveBeenCalledWith({
      name: 'CI Pipeline',
      email: 'ops@example.org',
    });

    const key = await screen.findByTestId('admin-api-key-minted-value');
    expect(key).toHaveTextContent(FAKE_KEY);
    expect(screen.getByText('picsure_p_zzz99999…')).toBeInTheDocument();

    const warning = screen.getByRole('alert');
    expect(warning).toHaveTextContent(/shown only once/i);
    expect(warning).toHaveTextContent(/cannot be recovered/i);
  });

  it('sends the expiry date as a UTC start-of-day instant', async () => {
    psama.mintPlatform.mockResolvedValue(mintedFixture);
    render(MintPlatformKeyModal);

    await openFormAndFill();
    await fireEvent.click(screen.getByLabelText(/custom date/i));
    await fireEvent.input(await screen.findByLabelText(/expiration date/i), {
      target: { value: '2099-01-01' },
    });
    await fireEvent.click(screen.getByRole('button', { name: 'Mint Key' }));

    expect(psama.mintPlatform).toHaveBeenCalledWith({
      name: 'CI Pipeline',
      email: 'ops@example.org',
      expiresAt: '2099-01-01T00:00:00Z',
    });
  });

  it('sends neverExpires only when the never option is deliberately selected', async () => {
    psama.mintPlatform.mockResolvedValue(mintedFixture);
    render(MintPlatformKeyModal);

    await openFormAndFill();
    await fireEvent.click(screen.getByTestId('admin-api-key-expiry-never'));
    await fireEvent.click(screen.getByRole('button', { name: 'Mint Key' }));

    expect(psama.mintPlatform).toHaveBeenCalledWith({
      name: 'CI Pipeline',
      email: 'ops@example.org',
      neverExpires: true,
    });
  });

  it('closes the reveal and clears the key from view when done', async () => {
    psama.mintPlatform.mockResolvedValue(mintedFixture);
    render(MintPlatformKeyModal);

    await openFormAndFill();
    await fireEvent.click(screen.getByRole('button', { name: 'Mint Key' }));
    await screen.findByTestId('admin-api-key-minted-value');

    await fireEvent.click(screen.getByTestId('admin-api-key-minted-done'));
    await waitFor(() =>
      expect(screen.queryByTestId('admin-api-key-minted-value')).not.toBeInTheDocument(),
    );
  });

  it('never passes the plaintext key to the logger', async () => {
    psama.mintPlatform.mockResolvedValue(mintedFixture);
    render(MintPlatformKeyModal);

    await openFormAndFill();
    await fireEvent.click(screen.getByRole('button', { name: 'Mint Key' }));
    await screen.findByTestId('admin-api-key-minted-value');
    await fireEvent.click(screen.getByTestId('admin-api-key-minted-done'));

    const logged = JSON.stringify([vi.mocked(log).mock.calls, vi.mocked(createLog).mock.calls]);
    expect(logged).not.toContain(FAKE_KEY);
    expect(logged).not.toContain(mintedFixture.displayPrefix);
  });

  it('shows the backend message inline when minting fails', async () => {
    const body = { errorType: 'error', message: 'Expiry must be in the future' };
    psama.mintPlatform.mockRejectedValue(new ApiError(400, 'http', body, JSON.stringify(body)));
    render(MintPlatformKeyModal);

    await openFormAndFill();
    await fireEvent.click(screen.getByRole('button', { name: 'Mint Key' }));

    const alert = await screen.findByTestId('admin-api-key-mint-error');
    expect(alert).toHaveTextContent('Expiry must be in the future');
    expect(screen.queryByTestId('admin-api-key-minted-value')).not.toBeInTheDocument();
  });
});
