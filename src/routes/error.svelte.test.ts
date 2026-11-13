// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';

const page = vi.hoisted(() => ({
  status: 500,
  error: { message: 'Internal Error' } as { message: string } | null,
  url: new URL('http://localhost/'),
}));
vi.mock('$app/state', () => ({ page }));
vi.mock('$app/env', () => ({ browser: true }));
vi.mock('$app/paths', () => ({ resolve: (path: string) => `/${path}` }));
// A closed deployment with no session renders the error without the app shell.
vi.mock('#lib/config/config.svelte.ts', () => ({
  config: { features: { login: { open: false } }, branding: { applicationName: 'PIC-SURE' } },
}));

import ErrorPage from './+error.svelte';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('root error page', () => {
  it('offers a reload for an unexpected error, which may be a one-off', async () => {
    page.status = 500;
    const reload = vi.fn();
    vi.stubGlobal('location', { ...window.location, reload });
    render(ErrorPage);

    expect(screen.getByTestId('app-error-title').textContent).toBe('Something went wrong');
    await fireEvent.click(screen.getByTestId('app-error-retry'));

    expect(reload).toHaveBeenCalledOnce();
    expect(screen.getByTestId('app-error-home')).toBeTruthy();
  });

  it('only offers the home page for a page that does not exist', () => {
    page.status = 404;
    render(ErrorPage);

    expect(screen.getByTestId('app-error-title').textContent).toBe('Page not found');
    expect(screen.queryByTestId('app-error-retry')).toBeNull();
    expect(screen.getByTestId('app-error-home')).toBeTruthy();
  });
});
