// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within, waitFor } from '@testing-library/svelte';

vi.mock('#lib/telemetry/logger.ts', () => ({
  log: vi.fn(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createLog: vi.fn((...args: any[]) => args),
  getPageContext: vi.fn(() => 'test-context'),
}));

// The real ExpandableRow store eagerly imports explorer components that touch
// localStorage at module load. Row.svelte only needs the store contract.
vi.mock('#lib/explorer/ExpandableRow.ts', async () => {
  const { writable } = await import('svelte/store');
  return {
    activeTable: writable(''),
    activeRow: writable(''),
    activeComponent: writable(undefined),
    setActiveRow: vi.fn(),
  };
});

vi.mock('#lib/auth/session.svelte.ts', () => ({
  session: { isTopAdmin: true, onEnd: () => {} },
}));

vi.mock('#lib/ui/toaster.ts', () => ({
  toaster: { success: vi.fn(), error: vi.fn() },
}));

const psama = vi.hoisted(() => ({
  list: vi.fn(),
  revoke: vi.fn(),
}));

vi.mock('#lib/api/psama/apiKeys.ts', () => ({ ...psama, mintPlatform: vi.fn() }));

import ApiKeyTable from '#lib/admin/apiKeys/ApiKeyTable.svelte';
import type { ApiKeyMetadata } from '#lib/admin/apiKeys/model.ts';
import { ApiError } from '#lib/api/errors.ts';

const activeKey: ApiKeyMetadata = {
  uuid: 'uuid-active',
  displayPrefix: 'abc12345',
  keyType: 'USER',
  name: 'Alice',
  email: 'alice@example.org',
  createdAt: '2026-01-01T00:00:00Z',
  expiresAt: '2099-01-01T00:00:00Z',
  revokedAt: null,
  lastUsedAt: '2026-06-01T00:00:00Z',
};

const revokedKey: ApiKeyMetadata = {
  uuid: 'uuid-revoked',
  displayPrefix: 'def67890',
  keyType: 'PLATFORM',
  name: 'Pipeline',
  email: 'ops@example.org',
  createdAt: '2026-02-01T00:00:00Z',
  expiresAt: null,
  revokedAt: '2026-03-01T00:00:00Z',
  lastUsedAt: null,
};

const expiredKey: ApiKeyMetadata = {
  uuid: 'uuid-expired',
  displayPrefix: 'ghi13579',
  keyType: 'USER',
  name: null,
  email: null,
  createdAt: '2025-01-01T00:00:00Z',
  expiresAt: '2025-06-01T00:00:00Z',
  revokedAt: null,
  lastUsedAt: null,
};

function mockPage(keys: ApiKeyMetadata[]) {
  psama.list.mockResolvedValue({
    keys,
    totalCount: keys.length,
    page: 0,
    size: 10,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ApiKeyTable', () => {
  it('renders keys with masked prefix and derived status', async () => {
    mockPage([activeKey, revokedKey, expiredKey]);
    render(ApiKeyTable, { props: { keyType: 'USER', tableName: 'UserApiKeys' } });

    expect(await screen.findByText('picsure_u_abc12345…')).toBeInTheDocument();
    expect(screen.getByText('picsure_p_def67890…')).toBeInTheDocument();
    expect(screen.getByText('picsure_u_ghi13579…')).toBeInTheDocument();

    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Revoked')).toBeInTheDocument();
    expect(screen.getByText('Expired')).toBeInTheDocument();

    expect(screen.getByText('alice@example.org')).toBeInTheDocument();
    expect(screen.getAllByText('Never').length).toBeGreaterThan(0);
  });

  it('requests the first server page filtered by its key type', async () => {
    mockPage([activeKey]);
    render(ApiKeyTable, { props: { keyType: 'PLATFORM', tableName: 'PlatformApiKeys' } });

    await screen.findByText('picsure_u_abc12345…');
    expect(psama.list).toHaveBeenCalledWith(0, expect.any(Number), 'PLATFORM');
  });

  it('only offers revoke on active keys', async () => {
    mockPage([activeKey, revokedKey, expiredKey]);
    render(ApiKeyTable, { props: { keyType: 'USER', tableName: 'UserApiKeys' } });

    await screen.findByText('picsure_u_abc12345…');
    expect(screen.getByTestId('admin-api-key-revoke-uuid-active-trigger')).toBeInTheDocument();
    expect(
      screen.queryByTestId('admin-api-key-revoke-uuid-revoked-trigger'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('admin-api-key-revoke-uuid-expired-trigger'),
    ).not.toBeInTheDocument();
  });

  it('revokes a key through the confirmation dialog and refreshes the list', async () => {
    mockPage([activeKey]);
    psama.revoke.mockImplementation(async () => {
      psama.list.mockResolvedValue({
        keys: [{ ...activeKey, revokedAt: '2026-07-14T00:00:00Z' }],
        totalCount: 1,
        page: 0,
        size: 10,
      });
      return { ...activeKey, revokedAt: '2026-07-14T00:00:00Z' };
    });
    render(ApiKeyTable, { props: { keyType: 'USER', tableName: 'UserApiKeys' } });

    await fireEvent.click(await screen.findByTestId('admin-api-key-revoke-uuid-active-trigger'));

    const dialog = await screen.findByTestId('admin-api-key-revoke-uuid-active');
    expect(dialog).toHaveTextContent('permanent and cannot be undone');

    await fireEvent.click(within(dialog).getByRole('button', { name: 'Revoke' }));

    expect(psama.revoke).toHaveBeenCalledWith('uuid-active');
    expect(await screen.findByText('Revoked')).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.queryByTestId('admin-api-key-revoke-uuid-active-trigger'),
      ).not.toBeInTheDocument(),
    );
  });

  it('shows an inline alert when loading the list fails', async () => {
    const body = { errorType: 'error', message: 'list failed' };
    psama.list.mockRejectedValue(new ApiError(400, 'http', body, JSON.stringify(body)));
    render(ApiKeyTable, { props: { keyType: 'USER', tableName: 'UserApiKeys' } });

    const alert = await screen.findByTestId('admin-api-key-list-error');
    expect(alert).toHaveTextContent('list failed');
  });
});
