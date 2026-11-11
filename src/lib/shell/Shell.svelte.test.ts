// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/svelte';
import { createRawSnippet, flushSync } from 'svelte';

const mockConfig = vi.hoisted(() => ({ features: { login: { open: false } } }));

vi.mock('$app/env', () => ({ browser: true }));
vi.mock('#lib/config/config.svelte.ts', () => ({ config: mockConfig }));
vi.mock('#lib/telemetry/logger.ts', () => ({
  log: vi.fn(),
  createLog: vi.fn(() => ({})),
  registerSignedInUser: vi.fn(),
}));

import Shell from '#lib/shell/Shell.svelte';
import { session } from '#lib/auth/session.svelte.ts';

const children = createRawSnippet(() => ({ render: () => '<p>Page content</p>' }));

afterEach(() => {
  cleanup();
  session.removeToken();
});

describe('Shell', () => {
  it('renders for a signed-out visitor on an open deployment', () => {
    mockConfig.features.login.open = true;
    render(Shell, { children });

    expect(screen.getByText('Page content')).toBeInTheDocument();
  });

  describe('on a closed deployment', () => {
    it('renders nothing for a signed-out visitor', () => {
      mockConfig.features.login.open = false;
      render(Shell, { children });

      expect(screen.queryByText('Page content')).not.toBeInTheDocument();
    });

    it('stays on screen when the session ends, until the logout navigates away', () => {
      mockConfig.features.login.open = false;
      session.setToken('token');
      render(Shell, { children });

      session.removeToken();
      flushSync();

      expect(screen.getByText('Page content')).toBeInTheDocument();
    });
  });
});
