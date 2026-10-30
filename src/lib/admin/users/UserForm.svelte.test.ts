// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';

import UserForm from '#lib/admin/users/UserForm.svelte';
import * as admin from '#lib/admin/entities.ts';
import { toaster } from '#lib/ui/toaster.ts';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('#lib/ui/toaster.ts', () => ({ toaster: { success: vi.fn(), error: vi.fn() } }));
vi.mock('#lib/admin/entities.ts', async (importOriginal) => {
  const { rolesForSave } = await importOriginal<typeof import('#lib/admin/entities.ts')>();
  return {
    rolesForSave,
    connections: { get: vi.fn(async () => connections[0]) },
    users: { add: vi.fn(), update: vi.fn() },
    findUserByEmailAndConnection: vi.fn(),
  };
});

const connections = [{ uuid: 'c-1', id: 'okta', label: 'Okta', subPrefix: '', requiredFields: '' }];
const roleList: [string, string][] = [
  ['Researcher', 'r-1'],
  ['Admin', 'r-2'],
];
const user = {
  uuid: 'u-1',
  email: 'someone@example.org',
  connection: 'c-1',
  generalMetadata: '{}',
  active: true,
  roles: ['r-1'],
};

function fieldLabel(text: string) {
  return screen.getByText(text).closest('label')!;
}

async function save(container: HTMLElement) {
  await fireEvent.submit(container.querySelector('form')!);
}

describe('UserForm', () => {
  beforeEach(() => vi.clearAllMocks());

  it('marks email and connection required for a new user', () => {
    render(UserForm, { connections, roleList });

    expect(fieldLabel('Email:')).toHaveClass('label required', { exact: true });
    expect(fieldLabel('Connection:')).toHaveClass('label required', { exact: true });
  });

  it('keeps the email out of the label classes when editing', () => {
    render(UserForm, { user, connections, roleList });

    expect(fieldLabel('Email:')).toHaveClass('label', { exact: true });
    expect(fieldLabel('Connection:')).toHaveClass('label', { exact: true });
  });

  it('sends each role as a uuid ref, in list order', async () => {
    const { container } = render(UserForm, { user, connections, roleList });
    await fireEvent.click(screen.getByLabelText('Admin'));

    await save(container);

    expect(admin.users.update).toHaveBeenCalledWith(
      expect.objectContaining({ uuid: 'u-1', roles: [{ uuid: 'r-1' }, { uuid: 'r-2' }] }),
    );
    expect(toaster.success).toHaveBeenCalledWith({
      title: "Successfully saved user 'someone@example.org'",
    });
  });

  it('asks for a role instead of saving without one', async () => {
    const { container } = render(UserForm, { user, connections, roleList });
    await fireEvent.click(screen.getByLabelText('Researcher'));

    await save(container);

    expect(screen.getByText('At least one role must be selected.')).toBeInTheDocument();
    expect(admin.users.update).not.toHaveBeenCalled();
  });

  it('refuses a user and connection pair that already exists', async () => {
    vi.mocked(admin.findUserByEmailAndConnection).mockResolvedValue({ ...user });
    const { container } = render(UserForm, { connections, roleList });
    await fireEvent.input(screen.getByLabelText('Email:'), { target: { value: user.email } });
    await fireEvent.click(screen.getByLabelText('Researcher'));

    await save(container);

    expect(toaster.error).toHaveBeenCalledWith({
      title: 'Cannot add a user and connection pair that already exists.',
    });
    expect(admin.users.add).not.toHaveBeenCalled();
    expect(toaster.success).not.toHaveBeenCalled();
  });
});
