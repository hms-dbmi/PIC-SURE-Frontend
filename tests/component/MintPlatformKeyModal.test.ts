// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';

vi.mock('$lib/logger', () => ({
  log: vi.fn(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createLog: vi.fn((...args: any[]) => args),
  getPageContext: vi.fn(() => 'test-context'),
}));

vi.mock('$lib/stores/User', async () => {
  const { writable } = await import('svelte/store');
  return { isTopAdmin: writable(true) };
});

const storeMocks = vi.hoisted(() => ({
  mintPlatformKey: vi.fn(),
}));

vi.mock('$lib/stores/ApiKeys', async () => {
  const { writable } = await import('svelte/store');
  const listVersion = writable(0);
  return {
    listVersion,
    refreshApiKeys: () => listVersion.update((version) => version + 1),
    loadApiKeys: vi.fn(),
    revokeApiKey: vi.fn(),
    mintPlatformKey: storeMocks.mintPlatformKey,
  };
});

import MintPlatformKeyModal from '$lib/components/admin/api-key/MintPlatformKeyModal.svelte';
import { log, createLog } from '$lib/logger';

const FAKE_KEY = 'picsure_FAKE-TEST-FIXTURE-VALUE-0000000000000000000';

const mintedFixture = {
  apiKey: FAKE_KEY,
  uuid: 'uuid-new',
  displayPrefix: 'zzz99999',
  keyType: 'PLATFORM' as const,
  expiresAt: null,
};

async function openFormAndFill() {
  await fireEvent.click(screen.getByTestId('mint-platform-key-btn'));
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
    storeMocks.mintPlatformKey.mockResolvedValue(mintedFixture);
    render(MintPlatformKeyModal);

    await openFormAndFill();
    await fireEvent.click(screen.getByRole('button', { name: 'Mint Key' }));

    expect(storeMocks.mintPlatformKey).toHaveBeenCalledWith({
      name: 'CI Pipeline',
      email: 'ops@example.org',
    });

    const key = await screen.findByTestId('minted-api-key');
    expect(key).toHaveTextContent(FAKE_KEY);

    const warning = screen.getByRole('alert');
    expect(warning).toHaveTextContent(/shown only once/i);
    expect(warning).toHaveTextContent(/cannot be recovered/i);
  });

  it('sends the expiry date as a UTC start-of-day instant', async () => {
    storeMocks.mintPlatformKey.mockResolvedValue(mintedFixture);
    render(MintPlatformKeyModal);

    await openFormAndFill();
    await fireEvent.click(screen.getByLabelText(/custom date/i));
    await fireEvent.input(await screen.findByLabelText(/expiration date/i), {
      target: { value: '2099-01-01' },
    });
    await fireEvent.click(screen.getByRole('button', { name: 'Mint Key' }));

    expect(storeMocks.mintPlatformKey).toHaveBeenCalledWith({
      name: 'CI Pipeline',
      email: 'ops@example.org',
      expiresAt: '2099-01-01T00:00:00Z',
    });
  });

  it('sends neverExpires only when the never option is deliberately selected', async () => {
    storeMocks.mintPlatformKey.mockResolvedValue(mintedFixture);
    render(MintPlatformKeyModal);

    await openFormAndFill();
    await fireEvent.click(screen.getByTestId('expiry-never'));
    await fireEvent.click(screen.getByRole('button', { name: 'Mint Key' }));

    expect(storeMocks.mintPlatformKey).toHaveBeenCalledWith({
      name: 'CI Pipeline',
      email: 'ops@example.org',
      neverExpires: true,
    });
  });

  it('closes the reveal and clears the key from view when done', async () => {
    storeMocks.mintPlatformKey.mockResolvedValue(mintedFixture);
    render(MintPlatformKeyModal);

    await openFormAndFill();
    await fireEvent.click(screen.getByRole('button', { name: 'Mint Key' }));
    await screen.findByTestId('minted-api-key');

    await fireEvent.click(screen.getByTestId('done-minted-key'));
    await waitFor(() => expect(screen.queryByTestId('minted-api-key')).not.toBeInTheDocument());
  });

  it('never passes the plaintext key to the logger', async () => {
    storeMocks.mintPlatformKey.mockResolvedValue(mintedFixture);
    render(MintPlatformKeyModal);

    await openFormAndFill();
    await fireEvent.click(screen.getByRole('button', { name: 'Mint Key' }));
    await screen.findByTestId('minted-api-key');
    await fireEvent.click(screen.getByTestId('done-minted-key'));

    const logged = JSON.stringify([vi.mocked(log).mock.calls, vi.mocked(createLog).mock.calls]);
    expect(logged).not.toContain(FAKE_KEY);
    expect(logged).not.toContain(mintedFixture.displayPrefix);
  });

  it('shows the backend message inline when minting fails', async () => {
    storeMocks.mintPlatformKey.mockRejectedValue({
      status: 400,
      body: {
        message: JSON.stringify({ errorType: 'error', message: 'Expiry must be in the future' }),
      },
    });
    render(MintPlatformKeyModal);

    await openFormAndFill();
    await fireEvent.click(screen.getByRole('button', { name: 'Mint Key' }));

    const alert = await screen.findByTestId('mint-key-error');
    expect(alert).toHaveTextContent('Expiry must be in the future');
    expect(screen.queryByTestId('minted-api-key')).not.toBeInTheDocument();
  });
});
