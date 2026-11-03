// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';

import Actions from '#lib/admin/users/cell/Actions.svelte';
import * as admin from '#lib/admin/entities.ts';
import { toaster } from '#lib/ui/toaster.ts';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('#lib/ui/toaster.ts', () => ({ toaster: { success: vi.fn(), error: vi.fn() } }));
vi.mock('#lib/admin/entities.ts', () => ({
  users: { get: vi.fn(), update: vi.fn() },
  connections: { get: vi.fn() },
  rolesForSave: (uuids: string[]) => uuids.map((uuid) => ({ uuid })),
}));

const connection = { uuid: 'c-1', id: 'okta', label: 'Okta', subPrefix: '', requiredFields: '' };
const user = {
  uuid: 'u-1',
  email: 'a@example.com',
  connection: 'c-1',
  generalMetadata: '',
  active: true,
  roles: ['r-1'],
};

async function deactivate() {
  render(Actions, { uuid: 'u-1', status: 'Active', email: user.email });
  await fireEvent.click(screen.getByTestId('admin-user-deactivate-u-1-trigger'));
  await fireEvent.click(screen.getByRole('button', { name: 'Deactivate' }));
}

describe('users Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(admin.users.get).mockResolvedValue(user);
    vi.mocked(admin.connections.get).mockResolvedValue(connection);
  });

  it('deactivates a user with role refs and its connection', async () => {
    await deactivate();

    expect(admin.users.update).toHaveBeenCalledWith({
      ...user,
      active: false,
      connection,
      roles: [{ uuid: 'r-1' }],
    });
    expect(toaster.success).toHaveBeenCalledWith({
      title: "Successfully deactivated user 'a@example.com'",
    });
  });

  it('deactivates a user with no roles', async () => {
    vi.mocked(admin.users.get).mockResolvedValue({ ...user, roles: [] });

    await deactivate();

    expect(admin.users.update).toHaveBeenCalledWith(expect.objectContaining({ roles: [] }));
    expect(toaster.success).toHaveBeenCalled();
  });

  it.each([
    ['user', () => vi.mocked(admin.users.get).mockRejectedValue(new Error('failed'))],
    ['connection', () => vi.mocked(admin.connections.get).mockRejectedValue(new Error('failed'))],
  ])('reports a failed %s lookup', async (_, fail) => {
    fail();

    await deactivate();

    expect(admin.users.update).not.toHaveBeenCalled();
    expect(toaster.error).toHaveBeenCalledWith({
      title: "An error occurred while deactivating user 'a@example.com'",
    });
  });
});
