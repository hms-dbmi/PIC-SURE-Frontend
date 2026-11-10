// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';

import ConnectionForm from '#lib/components/admin/configuration/ConnectionForm.svelte';
import PrivilegeForm from '#lib/components/admin/configuration/PrivilegeForm.svelte';
import RoleForm from '#lib/components/admin/configuration/RoleForm.svelte';
import { toaster } from '#lib/toaster.ts';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('#lib/toaster.ts', () => ({ toaster: { success: vi.fn(), error: vi.fn() } }));
vi.mock('#lib/stores/User.ts', async () => {
  const { readable } = await import('svelte/store');
  return { isTopAdmin: readable(true) };
});
vi.mock('#lib/stores/Connections.ts', () => ({
  addConnection: vi.fn(),
  updateConnection: vi.fn(),
}));
vi.mock('#lib/stores/Privileges.ts', () => ({ addPrivilege: vi.fn(), updatePrivilege: vi.fn() }));
vi.mock('#lib/stores/Roles.ts', () => ({ addRole: vi.fn(), updateRole: vi.fn() }));

const connection = {
  uuid: 'c-1',
  id: 'okta',
  label: 'Okta',
  subPrefix: 'okta|',
  requiredFields: '[]',
};
const privilege = { uuid: 'p-1', name: 'ADMIN', description: 'Admin', application: 'app-1' };
const role = { uuid: 'r-1', name: 'Researcher', description: 'Reads data', privileges: ['p-1'] };
const privilegeList = [['ADMIN', 'p-1']];
const applicationList = [['App', 'app-1']];

async function save(container: HTMLElement) {
  await fireEvent.submit(container.querySelector('form')!);
}

describe('admin configuration forms', () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([
    ['connection', () => render(ConnectionForm, { connection }), "connection 'Okta'"],
    ['privilege', () => render(PrivilegeForm, { privilege, applicationList }), "privilege 'ADMIN'"],
    ['role', () => render(RoleForm, { role, privilegeList }), "role 'Researcher'"],
  ])('editing a %s does not call it new', async (_kind, renderForm, subject) => {
    const { container } = renderForm();

    await save(container);

    expect(toaster.success).toHaveBeenCalledWith({ title: `Successfully saved ${subject}` });
  });

  it('creating a role calls it new', async () => {
    const { container } = render(RoleForm, { privilegeList });
    await fireEvent.input(screen.getByLabelText('Name:'), { target: { value: 'Analyst' } });
    await fireEvent.input(screen.getByLabelText('Description:'), { target: { value: 'Analyses' } });
    await fireEvent.click(screen.getByLabelText('ADMIN'));

    await save(container);

    expect(toaster.success).toHaveBeenCalledWith({
      title: "Successfully saved new role 'Analyst'",
    });
  });
});
