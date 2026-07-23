// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';

vi.mock('$lib/configuration.svelte', () => ({
  config: {
    branding: {
      applicationName: 'PIC-SURE-TEST',
      externalLinkWarning: {},
    },
  },
}));

vi.mock('$lib/logger', () => ({
  log: vi.fn(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createLog: vi.fn((eventType: any, action: any, metadata: any) => ({
    event_type: eventType,
    action,
    metadata,
  })),
}));

import ExternalLinkWarning from '$lib/components/ExternalLinkWarning.svelte';
import { config } from '$lib/configuration.svelte';
import { log } from '$lib/logger';

const emptyWarningConfig = () => ({
  title: '',
  message: '',
  newTabMessage: '',
  okText: '',
  cancelText: '',
});

const EXTERNAL_URL = 'https://example.org/page';

function insertAnchor(attributes: Record<string, string>): HTMLAnchorElement {
  const anchor = document.createElement('a');
  Object.entries(attributes).forEach(([name, value]) => anchor.setAttribute(name, value));
  anchor.textContent = 'test link';
  document.body.appendChild(anchor);
  return anchor;
}

let openSpy: ReturnType<typeof vi.spyOn>;
let assignSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  config.branding.externalLinkWarning = emptyWarningConfig();
  vi.mocked(log).mockClear();
  openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
  assignSpy = vi.spyOn(window.location, 'assign').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  document.querySelectorAll('a').forEach((anchor) => anchor.remove());
});

describe('ExternalLinkWarning', () => {
  it('opens the modal with default title and prevents navigation on external link click', async () => {
    render(ExternalLinkWarning);
    const anchor = insertAnchor({ href: EXTERNAL_URL });

    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    await fireEvent(anchor, event);

    expect(screen.getByTestId('external-link-warning')).toBeInTheDocument();
    expect(screen.getByText('Leaving PIC-SURE-TEST')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to leave PIC-SURE-TEST\?/)).toBeInTheDocument();
    expect(event.defaultPrevented).toBe(true);
  });

  it('cancel closes the modal without navigating', async () => {
    render(ExternalLinkWarning);
    const anchor = insertAnchor({ href: EXTERNAL_URL });

    await fireEvent.click(anchor);
    await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByText('Leaving PIC-SURE-TEST')).not.toBeInTheDocument();
    expect(openSpy).not.toHaveBeenCalled();
    expect(assignSpy).not.toHaveBeenCalled();
  });

  it('OK opens a new tab for target="_blank" links and mentions the new tab', async () => {
    render(ExternalLinkWarning);
    const anchor = insertAnchor({ href: EXTERNAL_URL, target: '_blank' });

    await fireEvent.click(anchor);
    expect(
      screen.getByText(/This external website will be opened as a new tab in your browser\./),
    ).toBeInTheDocument();

    await fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(openSpy).toHaveBeenCalledWith(EXTERNAL_URL, '_blank', 'noopener,noreferrer');
    expect(assignSpy).not.toHaveBeenCalled();
  });

  it('OK navigates in the same tab for plain links, without the new tab message', async () => {
    render(ExternalLinkWarning);
    const anchor = insertAnchor({ href: EXTERNAL_URL });

    await fireEvent.click(anchor);
    expect(
      screen.queryByText(/This external website will be opened as a new tab in your browser\./),
    ).not.toBeInTheDocument();

    await fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(assignSpy).toHaveBeenCalledWith(EXTERNAL_URL);
    expect(openSpy).not.toHaveBeenCalled();
  });

  it('treats modifier clicks as new tab navigation', async () => {
    render(ExternalLinkWarning);
    const anchor = insertAnchor({ href: EXTERNAL_URL });

    await fireEvent.click(anchor, { metaKey: true });
    await fireEvent.click(screen.getByRole('button', { name: 'OK' }));

    expect(openSpy).toHaveBeenCalledWith(EXTERNAL_URL, '_blank', 'noopener,noreferrer');
  });

  it('treats middle clicks as new tab navigation', async () => {
    render(ExternalLinkWarning);
    const anchor = insertAnchor({ href: EXTERNAL_URL });

    await fireEvent(
      anchor,
      new MouseEvent('auxclick', { button: 1, bubbles: true, cancelable: true }),
    );
    await fireEvent.click(screen.getByRole('button', { name: 'OK' }));

    expect(openSpy).toHaveBeenCalledWith(EXTERNAL_URL, '_blank', 'noopener,noreferrer');
  });

  it('ignores same-host, download, and mailto links', async () => {
    render(ExternalLinkWarning);
    const sameHost = insertAnchor({ href: `${window.location.origin}/internal` });
    const download = insertAnchor({ href: EXTERNAL_URL, download: '' });
    const mailto = insertAnchor({ href: 'mailto:someone@example.org' });

    for (const anchor of [sameHost, download, mailto]) {
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      await fireEvent(anchor, event);
      expect(event.defaultPrevented).toBe(false);
    }
    expect(screen.queryByTestId('external-link-warning')).not.toBeInTheDocument();
  });

  it('logs warning_shown, cancelled, and confirmed navigation events', async () => {
    render(ExternalLinkWarning);
    const anchor = insertAnchor({ href: EXTERNAL_URL, target: '_blank' });

    await fireEvent.click(anchor);
    expect(log).toHaveBeenCalledWith({
      event_type: 'NAVIGATION',
      action: 'external_link.warning_shown',
      metadata: { url: EXTERNAL_URL, newTab: true },
    });

    await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(log).toHaveBeenCalledWith({
      event_type: 'NAVIGATION',
      action: 'external_link.cancelled',
      metadata: { url: EXTERNAL_URL },
    });

    await fireEvent.click(anchor);
    await fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(log).toHaveBeenCalledWith({
      event_type: 'NAVIGATION',
      action: 'external_link.confirmed',
      metadata: { url: EXTERNAL_URL, newTab: true },
    });
    const cancelLogs = vi
      .mocked(log)
      .mock.calls.filter(([event]) => (event as { action?: string }).action?.endsWith('cancelled'));
    expect(cancelLogs.length).toBe(1);
  });

  it('uses configured strings when provided', async () => {
    config.branding.externalLinkWarning = {
      ...emptyWarningConfig(),
      title: 'Custom title',
      message: 'Custom message',
      okText: 'Continue',
      cancelText: 'Stay',
    };
    render(ExternalLinkWarning);
    const anchor = insertAnchor({ href: EXTERNAL_URL });

    await fireEvent.click(anchor);

    expect(screen.getByText('Custom title')).toBeInTheDocument();
    expect(screen.getByText(/Custom message/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Stay' })).toBeInTheDocument();

    await fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(assignSpy).toHaveBeenCalledWith(EXTERNAL_URL);
  });
});
