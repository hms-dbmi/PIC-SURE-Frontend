// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';

import UserToken from '#lib/components/UserToken.svelte';

const { token, expires } = vi.hoisted(() => ({
  token: 'header.payload.signature',
  expires: new Date('2099-01-01T00:00:00Z'),
}));

vi.mock('#lib/stores/User.ts', async () => {
  const { writable } = await import('svelte/store');
  return {
    user: writable({ email: 'researcher@example.org', token }),
    getUser: vi.fn().mockResolvedValue(undefined),
    getTokenExpiration: () => expires.getTime(),
    getTokenExpirationAsDate: () => expires,
    refreshLongTermToken: vi.fn(),
  };
});
vi.mock('#lib/logger.ts', () => ({ log: vi.fn(), createLog: vi.fn() }));

describe('UserToken', () => {
  beforeEach(() => {
    // happy-dom has no Web Animations API; the copy Popover's fade transition needs it
    Element.prototype.animate = vi.fn().mockReturnValue({
      cancel: vi.fn(),
      finish: vi.fn(),
      finished: Promise.resolve(),
    });
  });

  it('masks the token until the researcher reveals it', async () => {
    const { container } = render(UserToken);

    await screen.findByTestId('reveal-btn');
    // the label's `for` points at a div, which isn't labelable
    const tokenBox = container.querySelector('#token') as HTMLElement;
    expect(screen.getByText('researcher@example.org')).toBeInTheDocument();
    expect(tokenBox).not.toHaveTextContent(token);
    expect(tokenBox.textContent).toMatch(/^•+$/);

    await fireEvent.click(screen.getByTestId('reveal-btn'));
    expect(tokenBox).toHaveTextContent(token);

    await fireEvent.click(screen.getByTestId('reveal-btn'));
    expect(tokenBox).not.toHaveTextContent(token);
  });
});
