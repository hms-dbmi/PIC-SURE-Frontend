// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte';

const mockConfig = vi.hoisted(() => ({
  features: { termsOfService: true, enforceTermsOfService: true, login: { open: false } },
  branding: {
    footer: { showSitemap: false, excludeSitemapOn: [], links: [] },
    sitemap: [] as unknown[],
    termsOfService: { rejectionUrl: '' },
  },
}));

vi.mock('$app/env', () => ({ browser: true }));
vi.mock('$app/navigation', () => ({ goto: vi.fn(), afterNavigate: vi.fn() }));
vi.mock('$app/state', () => ({ page: { url: new URL('http://localhost/') } }));
vi.mock('#lib/config/config.svelte.ts', () => ({ config: mockConfig }));
vi.mock('#lib/api/psama/tos.ts', () => ({
  latest: () => Promise.resolve('<p>The terms.</p>'),
}));
vi.mock('#lib/telemetry/logger.ts', () => ({
  log: vi.fn(),
  createLog: vi.fn(() => ({})),
  registerSignedInUser: vi.fn(),
}));

import Footer from '#lib/shell/Footer.svelte';
import TermsDialog from '#lib/shell/TermsDialog.svelte';
import { termsOfService } from '#lib/shell/termsOfService.svelte.ts';
import { session } from '#lib/auth/session.svelte.ts';

afterEach(() => {
  cleanup();
  session.clear();
  termsOfService.dialogOpen = false;
});

describe('Footer terms link', () => {
  it('opens the terms to read and dismiss', async () => {
    session.setToken('token');
    session.user = { acceptedTOS: true };
    render(TermsDialog);
    render(Footer);
    expect(screen.queryByText('The terms.')).not.toBeInTheDocument();

    await fireEvent.click(screen.getByTestId('app-footer-terms-trigger'));

    expect(await screen.findByText('The terms.')).toBeInTheDocument();
    expect(screen.getByTestId('terms-close')).toBeInTheDocument();
    await fireEvent.click(screen.getByTestId('ui-modal-close'));
    await waitFor(() => expect(screen.queryByText('The terms.')).not.toBeInTheDocument());
  });

  it('leaves the terms open while the user still has to accept them', async () => {
    session.setToken('token');
    session.user = { acceptedTOS: false };
    render(TermsDialog);
    render(Footer);
    await screen.findByTestId('terms-accept');

    await fireEvent.click(screen.getByTestId('app-footer-terms-trigger'));

    expect(screen.getAllByText('The terms.')).toHaveLength(1);
    expect(screen.getByTestId('terms-accept')).toBeInTheDocument();
    expect(screen.queryByTestId('ui-modal-close')).not.toBeInTheDocument();
  });
});

describe('Footer sitemap', () => {
  const sitemap = [
    {
      category: 'Administration',
      privilege: 'ADMIN',
      links: [
        { title: 'Manage Users', url: '/admin/users' },
        { title: 'Configuration', url: '/admin/configuration' },
      ],
    },
    {
      category: 'Use PIC-SURE',
      privilege: 'PIC_SURE_ANY_QUERY',
      links: [
        { title: 'Explore', url: '/explorer' },
        { title: 'Manage Datasets', url: '/dataset' },
      ],
    },
    { category: 'Help', links: [{ title: 'User Guide', url: 'https://example.org/guide' }] },
  ];

  function renderFor(privileges?: string[]) {
    if (privileges) session.setToken('token');
    session.user = { privileges: privileges ?? ['PIC_SURE_ANY_QUERY', 'ADMIN'] };
    render(Footer);
    return screen.queryAllByRole('link').map((link) => link.textContent);
  }

  beforeEach(() => {
    mockConfig.branding.footer.showSitemap = true;
    mockConfig.branding.sitemap = sitemap;
  });

  afterEach(() => {
    mockConfig.branding.footer.showSitemap = false;
    mockConfig.branding.sitemap = [];
  });

  it('lists the pages the user may open', () => {
    expect(renderFor(['PIC_SURE_ANY_QUERY', 'ADMIN', 'NAMED_DATASET'])).toEqual([
      'Manage Users',
      'Configuration',
      'Explore',
      'Manage Datasets',
      'User Guide',
    ]);
  });

  it('leaves out a page the user may not open without hiding the rest of its section', () => {
    expect(renderFor(['PIC_SURE_ANY_QUERY'])).toEqual(['Explore', 'User Guide']);
  });

  // D3: the admin pages also need query access, so this user has nothing to open there.
  it('hides the admin section from an admin without query access', () => {
    expect(renderFor(['ADMIN', 'NAMED_DATASET'])).toEqual(['User Guide']);
    expect(screen.queryByText('Administration')).not.toBeInTheDocument();
  });

  it('hides the privileged sections from a signed-out visitor, whatever profile is left', () => {
    expect(renderFor()).toEqual(['User Guide']);
  });
});
