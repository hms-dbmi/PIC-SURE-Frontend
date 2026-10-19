// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';

import EntityActions from '#lib/admin/access/cell/EntityActions.svelte';
import * as admin from '#lib/admin/entities.ts';
import { toaster } from '#lib/ui/toaster.ts';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('#lib/ui/toaster.ts', () => ({ toaster: { success: vi.fn(), error: vi.fn() } }));
vi.mock('#lib/auth/session.svelte.ts', () => ({
  session: { isTopAdmin: true, onEnd: () => {} },
}));
vi.mock('#lib/admin/entities.ts', () => {
  const resource = () => ({ remove: vi.fn() });
  return { connections: resource(), privileges: resource(), roles: resource() };
});

const row = { label: 'Okta', name: 'ADMIN' };

async function confirmDelete(kind: string) {
  await fireEvent.click(screen.getByTestId(`admin-${kind}-delete-u-1-trigger`));
  await fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
}

describe('EntityActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it.each([
    ['connection', admin.connections, "connection 'Okta'"],
    ['privilege', admin.privileges, "privilege 'ADMIN'"],
    ['role', admin.roles, "role 'ADMIN'"],
  ] as const)('deletes a %s by uuid', async (kind, resource, subject) => {
    render(EntityActions, { kind, data: { cell: 'u-1', row } });

    await confirmDelete(kind);

    expect(resource.remove).toHaveBeenCalledWith('u-1');
    expect(toaster.success).toHaveBeenCalledWith({ title: `Successfully deleted ${subject}` });
  });

  it.each([
    [
      'connection',
      admin.connections,
      "connection 'Okta' as it is still in use by an application or user",
    ],
    ['privilege', admin.privileges, "privilege 'ADMIN' as it is still in use by a role"],
    ['role', admin.roles, "role 'ADMIN' as it is still in use by a user"],
  ] as const)('says what still uses a %s it cannot delete', async (kind, resource, message) => {
    vi.mocked(resource.remove).mockRejectedValue({ status: 409 });
    render(EntityActions, { kind, data: { cell: 'u-1', row } });

    await confirmDelete(kind);

    expect(toaster.error).toHaveBeenCalledWith({ title: `Cannot delete ${message}` });
  });
});
