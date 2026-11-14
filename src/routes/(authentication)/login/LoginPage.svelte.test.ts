// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';

const { log, mockConfig } = vi.hoisted(() => ({
  log: vi.fn(),
  mockConfig: {
    features: { login: { open: false } },
    branding: {
      applicationName: 'PIC-SURE',
      login: { description: '', showSiteName: false, logoHeight: 7.5, backLinkText: 'Go back' },
    },
  },
}));

vi.mock('$app/state', () => ({
  page: {
    url: new URL('https://example.org/login'),
    data: {
      providers: [
        {
          name: 'RAS',
          type: 'OKTA',
          description: 'Login with RAS',
          imagesrc: 'nih.svg',
          imagealt: 'NIH logo',
          enabled: true,
          alt: false,
        },
      ],
      altProviders: [],
    },
  },
}));
vi.mock('$app/paths', () => ({ resolve: (path: string) => `/${path}` }));
vi.mock('#lib/config/config.svelte.ts', () => ({ config: mockConfig }));
vi.mock('#lib/telemetry/logger.ts', () => ({
  log,
  createLog: (eventType: string, action: string) => ({ event_type: eventType, action }),
  registerSignedInUser: vi.fn(),
}));
vi.mock('#lib/shell/Logo.svelte', async () => ({
  default: (await import('../../../../tests/support/fixtures/StubComponent.svelte')).default,
}));

import LoginPage from './+page.svelte';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('Login page', () => {
  it('offers an open site a way back home, logged as before', async () => {
    mockConfig.features.login.open = true;
    render(LoginPage);

    const back = await screen.findByRole('link', { name: 'Go back' });
    expect(back).toHaveAttribute('href', '/');
    back.addEventListener('click', (event) => event.preventDefault());
    await fireEvent.click(back);
    expect(log).toHaveBeenCalledWith(
      expect.objectContaining({ event_type: 'NAVIGATION', action: 'login.explore_open' }),
    );
  });

  it('has no way back on a closed site', async () => {
    mockConfig.features.login.open = false;
    render(LoginPage);

    await screen.findByRole('img', { name: 'NIH logo' });
    expect(screen.queryByRole('link', { name: 'Go back' })).not.toBeInTheDocument();
  });
});
