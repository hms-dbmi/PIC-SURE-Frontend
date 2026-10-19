// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';

vi.mock('#lib/config/config.svelte.ts', () => ({
  config: {
    branding: {
      applicationName: 'PIC-SURE-TEST',
      externalLinkWarning: {},
    },
  },
}));

vi.mock('#lib/telemetry/logger.ts', () => ({
  log: vi.fn(),
  createLog: vi.fn((eventType: string, action: string, metadata: unknown) => ({
    event_type: eventType,
    action,
    metadata,
  })),
}));

import ExternalLinkWarning from '#lib/shell/ExternalLinkWarning.svelte';
import SiteBanner from '#lib/banners/components/SiteBanner.svelte';
import type { BannerAppearance, BannerPresentation } from '#lib/banners/model/banner.ts';
import { tones } from '#lib/ui/surface.ts';

const banner: BannerPresentation = {
  htmlContent:
    '<p class="fixed"><a href="https://example.org/page" target="_blank" rel="noopener noreferrer">External</a> ' +
    '<a href="/help" target="_blank" rel="noopener noreferrer">Help</a> ' +
    '<a href="mailto:help@example.org" target="_blank" rel="noopener noreferrer">Email</a>' +
    '<img src="https://example.org/image.png"></p>',
  title: 'Maintenance',
  appearance: 'PRIMARY',
  icon: 'INFORMATION',
  dismissible: true,
};

beforeEach(() => {
  vi.spyOn(window.location, 'assign').mockImplementation(() => {});
  vi.spyOn(window, 'open').mockImplementation(() => null);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('SiteBanner', () => {
  it.each([
    ['WARNING', tones['tonal-warning']],
    ['ERROR', tones['tonal-error']],
  ] satisfies [BannerAppearance, string][])(
    'renders the %s tonal appearance',
    (appearance, cssClass) => {
      render(SiteBanner, { banner: { ...banner, appearance } });

      expect(screen.getByRole('region', { name: 'Maintenance' })).toHaveClass(cssClass);
    },
  );

  it('sanitizes immediately before rendering stored HTML', () => {
    const { container } = render(SiteBanner, { banner });

    expect(container.querySelector('img')).not.toBeInTheDocument();
    expect(container.querySelector('[class="fixed"]')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'External' })).toHaveAttribute(
      'href',
      'https://example.org/page',
    );
  });

  it('preserves authored spaces in visitor banner content', () => {
    const spacedBanner = {
      ...banner,
      htmlContent: '<p>  Leading and  consecutive spaces</p>',
    };
    const { container } = render(SiteBanner, { banner: spacedBanner });

    const content = container.querySelector('.site-banner-content');
    expect(content?.querySelector('p')?.textContent).toBe('  Leading and  consecutive spaces');
  });

  it('routes cross-origin HTTPS through the warning and safe-open while relative and mailto retain normal behavior', async () => {
    render(ExternalLinkWarning);
    render(SiteBanner, { banner });

    const externalEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    await fireEvent(screen.getByRole('link', { name: 'External' }), externalEvent);
    expect(externalEvent.defaultPrevented).toBe(true);
    expect(screen.getByTestId('app-external-link-warning')).toBeInTheDocument();

    await fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(window.open).toHaveBeenCalledWith(
      'https://example.org/page',
      '_blank',
      'noopener,noreferrer',
    );
    for (const name of ['Help', 'Email']) {
      expect(screen.getByRole('link', { name })).toHaveAttribute('target', '_blank');
      expect(screen.getByRole('link', { name })).toHaveAttribute('rel', 'noopener noreferrer');
      window.addEventListener('click', (event) => event.preventDefault(), { once: true });
      await fireEvent.click(screen.getByRole('link', { name }));
      expect(screen.queryByTestId('app-external-link-warning')).not.toBeInTheDocument();
    }
  });

  it('dismisses from a focusable, labelled control', async () => {
    const ondismiss = vi.fn();
    render(SiteBanner, { banner, ondismiss });

    const dismiss = screen.getByRole('button', { name: 'Dismiss Maintenance' });
    expect(dismiss).toHaveAttribute('title', 'Dismiss Maintenance');
    dismiss.focus();
    expect(document.activeElement).toBe(dismiss);

    await fireEvent.click(dismiss);

    expect(ondismiss).toHaveBeenCalledOnce();
  });

  it('does not render a dismissal control for a permanent banner', () => {
    render(SiteBanner, { banner: { ...banner, dismissible: false }, ondismiss: vi.fn() });

    expect(screen.queryByRole('button', { name: /Dismiss/ })).not.toBeInTheDocument();
  });
});

it('names the region by its full title while shortening the dismiss label', () => {
  const title = 'Maintenance notice for all research participants and collaborating institutions';
  render(SiteBanner, { banner: { ...banner, title }, ondismiss: vi.fn() });
  expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
  expect(screen.getByRole('region', { name: title })).toBeInTheDocument();
  expect(
    screen.getByRole('button', {
      name: 'Dismiss Maintenance notice for all research participant…',
    }),
  ).toBeInTheDocument();
});

it('names an untitled region with a fixed label rather than its content', () => {
  const htmlContent = `<p>${'Scheduled maintenance will interrupt every service. '.repeat(4)}</p>`;
  render(SiteBanner, { banner: { ...banner, title: null, htmlContent, dismissible: false } });
  const region = screen.getByRole('region', { name: 'Site announcement' });
  expect(region).toHaveTextContent(htmlContent.replace(/<\/?p>/g, '').trim());
});
