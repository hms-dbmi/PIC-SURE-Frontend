// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';

import PublicAccessKey from '$lib/components/PublicAccessKey.svelte';

const { post, log } = vi.hoisted(() => ({ post: vi.fn(), log: vi.fn() }));

vi.mock('$lib/api', () => ({ post }));
vi.mock('$lib/logger', () => ({
  log,
  createLog: (eventType: string, action?: string, metadata?: Record<string, unknown>) => ({
    event_type: eventType,
    action,
    metadata,
  }),
}));

const mockKeyResponse = {
  apiKey: 'picsure_0Zx9AbCdEfGhIjKlMnOpQrStUvWxYz0123456789abc',
  uuid: '0b6cf65e-6f9e-4a3c-9d0e-1f2a3b4c5d6e',
  displayPrefix: '0Zx9AbCd',
  keyType: 'USER',
  expiresAt: '2026-10-11T12:13:14Z',
};

async function openForm() {
  await fireEvent.click(screen.getByRole('button', { name: 'Request Public Key' }));
}

async function submitForm() {
  await fireEvent.submit(screen.getByTestId('public-access-key').querySelector('form') as Element);
}

describe('PublicAccessKey', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts idle with an enabled request button', () => {
    render(PublicAccessKey, { props: { enabled: true } });

    const button = screen.getByRole('button', { name: 'Request Public Key' });
    expect(button).toBeEnabled();
    expect(screen.getByText('Public Access Key')).toBeInTheDocument();
    expect(screen.getByText('No account required')).toBeInTheDocument();
  });

  it('shows unavailable content instead of the button when the deployment disables it', () => {
    render(PublicAccessKey);

    expect(screen.queryByRole('button', { name: 'Request Public Key' })).not.toBeInTheDocument();
    expect(screen.getByTestId('public-key-unavailable')).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it('requests an unauthenticated key with a null captcha token and reveals it', async () => {
    post.mockResolvedValue(mockKeyResponse);
    render(PublicAccessKey, { props: { enabled: true } });

    await openForm();
    await submitForm();

    expect(post).toHaveBeenCalledWith(
      'psama/open/apiKey',
      { captchaToken: null, name: null, email: null },
      undefined,
      false,
    );
    await waitFor(() => {
      expect(screen.getByTestId('public-key-value')).toHaveTextContent(mockKeyResponse.apiKey);
    });
    expect(screen.getByTestId('public-key-warning')).toHaveTextContent(
      'This key is shown only once and cannot be recovered.',
    );
    expect(screen.getByTestId('public-key-expires').textContent).not.toBe('');
  });

  it('sends trimmed name and email when entered', async () => {
    post.mockResolvedValue(mockKeyResponse);
    render(PublicAccessKey, { props: { enabled: true } });

    await openForm();
    await fireEvent.input(screen.getByLabelText(/Name/), {
      target: { value: '  Jane Doe  ' },
    });
    await fireEvent.input(screen.getByLabelText(/Email/), {
      target: { value: '  researcher@example.org  ' },
    });
    await submitForm();

    expect(post).toHaveBeenCalledWith(
      'psama/open/apiKey',
      { captchaToken: null, name: 'Jane Doe', email: 'researcher@example.org' },
      undefined,
      false,
    );
  });

  it('never logs the key value, only uuid and displayPrefix', async () => {
    post.mockResolvedValue(mockKeyResponse);
    render(PublicAccessKey, { props: { enabled: true } });

    await openForm();
    await submitForm();
    await waitFor(() => {
      expect(screen.getByTestId('public-key-value')).toBeInTheDocument();
    });

    expect(log).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(log.mock.calls)).not.toContain(mockKeyResponse.apiKey);
    expect(log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'api.public_key.success',
        metadata: { uuid: mockKeyResponse.uuid, displayPrefix: mockKeyResponse.displayPrefix },
      }),
    );
  });

  it('shows the server message inline on failure and returns to the form on retry', async () => {
    post.mockRejectedValue({ status: 400, body: { message: 'CAPTCHA verification failed.' } });
    render(PublicAccessKey, { props: { enabled: true } });

    await openForm();
    await submitForm();

    const alert = await screen.findByTestId('error-alert');
    expect(alert).toHaveTextContent('CAPTCHA verification failed.');
    expect(screen.queryByTestId('public-key-value')).not.toBeInTheDocument();

    await fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
    expect(screen.getByRole('button', { name: 'Generate Key' })).toBeInTheDocument();
  });

  it('unwraps a JSON error body from the server', async () => {
    post.mockRejectedValue({
      status: 400,
      body: { message: '{"message":"Public key generation is not enabled."}' },
    });
    render(PublicAccessKey, { props: { enabled: true } });

    await openForm();
    await submitForm();

    const alert = await screen.findByTestId('error-alert');
    expect(alert).toHaveTextContent('Public key generation is not enabled.');
  });
});
