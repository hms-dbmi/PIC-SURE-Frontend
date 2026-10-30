// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { flushSync } from 'svelte';

const mockConfig = vi.hoisted(() => ({
  features: { termsOfService: true, enforceTermsOfService: true, login: { open: false } },
  branding: { termsOfService: { rejectionUrl: '' } },
}));
const mockTos = vi.hoisted(() => ({ latest: vi.fn(), accept: vi.fn() }));
const mockPsamaUser = vi.hoisted(() => ({ me: vi.fn(), consents: vi.fn() }));
const mockToaster = vi.hoisted(() => ({ error: vi.fn() }));
const navigation = vi.hoisted(() => ({ after: () => {} }));

vi.mock('$app/env', () => ({ browser: true }));
vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
  afterNavigate: (callback: () => void) => (navigation.after = callback),
}));
vi.mock('#lib/config/config.svelte.ts', () => ({ config: mockConfig }));
vi.mock('#lib/api/psama/tos.ts', () => mockTos);
vi.mock('#lib/api/psama/user.ts', () => mockPsamaUser);
vi.mock('#lib/ui/toaster.ts', () => ({ toaster: mockToaster }));
vi.mock('#lib/telemetry/logger.ts', () => ({
  log: vi.fn(),
  createLog: vi.fn(() => ({})),
  registerSignedInUser: vi.fn(),
}));

import TermsDialog from '#lib/shell/TermsDialog.svelte';
import { termsOfService } from '#lib/shell/termsOfService.svelte.ts';
import { session } from '#lib/auth/session.svelte.ts';

const dialog = () => screen.queryByTestId('app-footer-terms');

// A closed dialog remembers the token it was closed under, so each sign-in gets its own.
let signIns = 0;
function signIn(acceptedTOS?: boolean) {
  session.setToken(`token-${++signIns}`);
  session.user = acceptedTOS === undefined ? {} : { acceptedTOS };
}

beforeEach(() => {
  mockConfig.features.termsOfService = true;
  mockConfig.features.enforceTermsOfService = true;
  mockTos.latest.mockReset().mockResolvedValue('<p>Please accept the terms.</p>');
  mockTos.accept.mockReset().mockResolvedValue('');
  mockPsamaUser.me.mockReset().mockResolvedValue({ acceptedTOS: true, privileges: [] });
  mockPsamaUser.consents.mockReset().mockResolvedValue({ consents: {} });
  mockToaster.error.mockReset();
});

afterEach(() => {
  cleanup();
  session.clear();
  termsOfService.dialogOpen = false;
});

describe('TermsDialog', () => {
  it('holds a signed-in user who has not accepted the terms, with no way to dismiss it', async () => {
    signIn(false);
    render(TermsDialog);

    expect(await screen.findByText('Please accept the terms.')).toBeInTheDocument();
    expect(screen.getByTestId('terms-accept')).toBeInTheDocument();
    expect(screen.getByTestId('terms-reject')).toBeInTheDocument();
    expect(screen.queryByTestId('ui-modal-close')).not.toBeInTheDocument();
  });

  it.each([
    ['the user has accepted', () => signIn(true)],
    ['the profile has not loaded yet', () => signIn()],
    ['nobody is signed in', () => (session.user = { acceptedTOS: false })],
    [
      'acceptance is not enforced',
      () => {
        signIn(false);
        mockConfig.features.enforceTermsOfService = false;
      },
    ],
    [
      'the terms are turned off',
      () => {
        signIn(false);
        mockConfig.features.termsOfService = false;
      },
    ],
  ])('stays closed when %s', (_, arrange) => {
    arrange();
    render(TermsDialog);
    flushSync();

    expect(dialog()).not.toBeInTheDocument();
  });

  // The root layout stays mounted through login, so the dialog can't decide on mount.
  it('opens when a user who has not accepted signs in after the page has loaded', async () => {
    render(TermsDialog);
    flushSync();
    expect(dialog()).not.toBeInTheDocument();

    signIn(false);

    expect(await screen.findByTestId('app-footer-terms')).toBeInTheDocument();
  });

  it('stays closed while an accepted user signs in and their profile loads', () => {
    render(TermsDialog);

    signIn();
    flushSync();
    expect(dialog()).not.toBeInTheDocument();

    session.user = { acceptedTOS: true };
    flushSync();
    expect(dialog()).not.toBeInTheDocument();
  });

  it('closes once the reloaded profile records the acceptance', async () => {
    signIn(false);
    render(TermsDialog);

    await fireEvent.click(await screen.findByTestId('terms-accept'));

    await waitFor(() => expect(dialog()).not.toBeInTheDocument());
    expect(mockTos.accept).toHaveBeenCalledOnce();
    expect(session.user.acceptedTOS).toBe(true);
  });

  it('stays open and reports the error when the profile fails to reload after accepting', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockPsamaUser.me.mockRejectedValue(new Error('503'));
    signIn(false);
    render(TermsDialog);

    await fireEvent.click(await screen.findByTestId('terms-accept'));

    await waitFor(() => expect(mockToaster.error).toHaveBeenCalledOnce());
    expect(dialog()).toBeInTheDocument();
  });

  it('closes when the session ends', async () => {
    signIn(false);
    render(TermsDialog);
    await screen.findByTestId('app-footer-terms');

    session.removeToken();

    await waitFor(() => expect(dialog()).not.toBeInTheDocument());
  });

  it('closes the terms opened from the footer on navigation', async () => {
    signIn(true);
    render(TermsDialog);
    termsOfService.dialogOpen = true;
    await screen.findByTestId('app-footer-terms');

    navigation.after();

    await waitFor(() => expect(dialog()).not.toBeInTheDocument());
  });

  it('stays open for a user who has not accepted the terms on navigation', async () => {
    signIn(false);
    render(TermsDialog);
    await screen.findByTestId('app-footer-terms');

    navigation.after();

    expect(termsOfService.dialogOpen).toBe(true);
  });

  it('can be closed when the terms fail to load, until the next sign-in', async () => {
    mockTos.latest.mockRejectedValue(new Error('503'));
    signIn(false);
    render(TermsDialog);

    await fireEvent.click(await screen.findByTestId('terms-close'));
    await waitFor(() => expect(dialog()).not.toBeInTheDocument());

    session.user = { acceptedTOS: false, privileges: [] };
    flushSync();
    expect(dialog()).not.toBeInTheDocument();

    session.removeToken();
    signIn(false);
    expect(await screen.findByTestId('app-footer-terms')).toBeInTheDocument();
  });
});
