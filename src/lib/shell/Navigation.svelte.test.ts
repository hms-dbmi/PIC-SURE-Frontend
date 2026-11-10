// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/svelte';
import { flushSync } from 'svelte';

const mockPage = vi.hoisted(() => ({ url: new URL('http://localhost/') }));

vi.mock('$app/env', () => ({ browser: true }));
vi.mock('$app/state', () => ({ page: mockPage }));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$app/paths', () => ({
  resolve: (path: string) => (path.startsWith('/') ? path : `/${path}`),
}));
vi.mock('#lib/telemetry/logger.ts', () => ({
  log: vi.fn(),
  createLog: vi.fn(() => ({})),
  registerSignedInUser: vi.fn(),
}));
vi.mock('#lib/config/config.svelte.ts', () => ({
  config: {
    features: {
      dashboard: true,
      discover: true,
      analyzeApi: true,
      login: { open: true },
    },
    branding: { logo: { src: '', alt: 'PIC-SURE' } },
  },
}));

import Navigation from '#lib/shell/Navigation.svelte';
import { session } from '#lib/auth/session.svelte.ts';
import { PicsurePrivileges } from '#lib/auth/model/privilege.ts';

const { QUERY, NAMED_DATASET, API_ACCESS, ADMIN, SUPER } = PicsurePrivileges;

const roles = {
  signedOut: { privileges: undefined, links: ['/dashboard', '/discover', '/api', '/help'] },
  general: {
    privileges: [QUERY, NAMED_DATASET, API_ACCESS],
    links: ['/dashboard', '/discover', '/explorer', '/api', '/dataset', '/help'],
  },
  admin: {
    privileges: [QUERY, ADMIN, NAMED_DATASET, API_ACCESS],
    links: [
      '/dashboard',
      '/discover',
      '/explorer',
      '/api',
      '/dataset',
      '/admin/configuration',
      '/admin/users',
      '/help',
    ],
  },
  super: {
    privileges: [QUERY, SUPER, NAMED_DATASET, API_ACCESS],
    links: [
      '/dashboard',
      '/discover',
      '/explorer',
      '/api',
      '/dataset',
      '/admin/configuration',
      '/admin/users',
      '/help',
    ],
  },
  // The admin pages need query access too (D3).
  adminWithoutQuery: {
    privileges: [ADMIN, NAMED_DATASET, API_ACCESS],
    links: ['/dashboard', '/discover', '/api', '/help'],
  },
};

function signIn(privileges?: string[]) {
  if (privileges) {
    session.setToken('token');
    session.user = { email: 'test@pic-sure.org', privileges };
  } else {
    session.clear();
  }
}

function renderAt(pathname: string) {
  mockPage.url = new URL(`http://localhost${pathname}`);
  render(Navigation);
  return screen.getByRole('navigation');
}

const linkPaths = (nav: HTMLElement) =>
  Array.from(nav.querySelectorAll('a')).map((link) => link.getAttribute('href'));

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  session.clear();
  vi.restoreAllMocks();
});

describe('Navigation', () => {
  describe.each(Object.entries(roles))('for a %s user', (_role, { privileges, links }) => {
    it('shows exactly the links the user can reach', () => {
      signIn(privileges);

      expect(linkPaths(renderAt('/help'))).toEqual(links);
    });

    it.each(links)('marks only %s as the current page', (path) => {
      signIn(privileges);
      renderAt(path);

      const current = screen
        .getAllByRole('link')
        .filter((link) => link.getAttribute('aria-current') === 'page')
        .map((link) => link.getAttribute('href'));
      // The logo link always carries aria-current; it isn't part of the page navigation.
      expect(current.filter((href) => href !== '/')).toEqual([path]);
    });
  });

  it('drops the signed-in links when the user signs out', () => {
    signIn(roles.admin.privileges);
    const nav = renderAt('/help');

    session.removeToken();
    flushSync();

    expect(linkPaths(nav)).toEqual(roles.signedOut.links);
    expect(screen.getByRole('button', { name: 'Login' })).toBeVisible();
  });

  it('keeps a section current on its sub-pages', () => {
    signIn(roles.super.privileges);
    renderAt('/dataset/1234');

    expect(screen.getByRole('link', { name: 'Manage Datasets' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});
