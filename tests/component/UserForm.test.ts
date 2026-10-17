// @vitest-environment happy-dom

import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';

import UserForm from '#lib/components/admin/user/UserForm.svelte';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('#lib/toaster.ts', () => ({ toaster: { success: vi.fn(), error: vi.fn() } }));
vi.mock('#lib/stores/Users.ts', () => ({}));
vi.mock('#lib/stores/Connections.ts', () => ({}));
vi.mock('#lib/stores/Roles.ts', () => ({}));
vi.mock('#lib/stores/Privileges.ts', () => ({}));

const connections = [{ uuid: 'c-1', id: 'okta', label: 'Okta', subPrefix: '', requiredFields: '' }];
const roleList = [['Researcher', 'r-1']];

function fieldLabel(text: string) {
  return screen.getByText(text).closest('label')!;
}

describe('UserForm', () => {
  it('marks email and connection required for a new user', () => {
    render(UserForm, { connections, roleList });

    expect(fieldLabel('Email:')).toHaveClass('label', 'required', { exact: true });
    expect(fieldLabel('Connection:')).toHaveClass('label', 'required', { exact: true });
  });

  it('keeps the email out of the label classes when editing', () => {
    const user = {
      uuid: 'u-1',
      email: 'someone@example.org',
      connection: 'c-1',
      generalMetadata: '{}',
      active: true,
      roles: ['r-1'],
    };
    render(UserForm, { user, connections, roleList });

    expect(fieldLabel('Email:')).toHaveClass('label', { exact: true });
    expect(fieldLabel('Connection:')).toHaveClass('label', { exact: true });
  });
});
