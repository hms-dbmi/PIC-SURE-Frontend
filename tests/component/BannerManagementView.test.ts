// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';

vi.mock('$lib/services/BannerManagement', () => ({
  getManagedBanners: vi.fn(),
  publishBanner: vi.fn(),
  publishSavedBanner: vi.fn(),
  saveBanner: vi.fn(),
  updateSavedBanner: vi.fn(),
}));

import BannerManagementView from '$lib/components/admin/configuration/BannerManagementView.svelte';
import { getManagedBanners, saveBanner } from '$lib/services/BannerManagement';
import type { ManagedBanner } from '$lib/models/Banner';

const base: ManagedBanner = {
  uuid: '11111111-1111-1111-1111-111111111111',
  status: 'PUBLISHED',
  lifecycle: 'ACTIVE',
  htmlContent: '<p>System <strong>maintenance</strong> tonight</p>',
  title: 'Maintenance',
  appearance: 'WARNING',
  icon: 'WARNING',
  dismissible: false,
  audience: 'EVERYONE',
  placement: 'SITE_TOP',
  pageTargets: [{ kind: 'ALL' }],
  startAt: '2026-08-27T12:00:00Z',
  endAt: null,
  priority: 1,
  presentationHash: 'hash',
  createdAt: '2026-08-27T11:00:00Z',
  createdBy: 'creator-id',
  updatedAt: '2026-08-27T12:00:00Z',
  updatedBy: 'admin-id',
  publishedAt: '2026-08-27T12:00:00Z',
  publishedBy: 'admin-id',
};

const records: ManagedBanner[] = [
  base,
  {
    ...base,
    uuid: '22222222-2222-2222-2222-222222222222',
    status: 'SAVED',
    lifecycle: 'SAVED',
    htmlContent: '<p>Reusable enrollment notice</p>',
    title: null,
    appearance: 'PRIMARY',
    startAt: null,
    priority: null,
    publishedAt: null,
    publishedBy: null,
  },
  {
    ...base,
    uuid: '33333333-3333-3333-3333-333333333333',
    lifecycle: 'EXPIRED',
    htmlContent: '<p>Past outage</p>',
    endAt: '2026-08-27T12:00:00Z',
  },
];

beforeEach(() => {
  vi.mocked(getManagedBanners).mockReset().mockResolvedValue(records);
  vi.mocked(saveBanner).mockReset();
});

describe('BannerManagementView', () => {
  it('groups loaded rows under lifecycle tabs and filters plain text without pagination', async () => {
    const parse = vi.spyOn(DOMParser.prototype, 'parseFromString');
    render(BannerManagementView);

    expect(await screen.findByText('System maintenance tonight')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Active & scheduled/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tab', { name: /Saved & disabled/ })).toHaveTextContent('1');
    expect(screen.getByRole('tab', { name: /Expired/ })).toHaveTextContent('1');
    expect(screen.queryByText('Reusable enrollment notice')).not.toBeInTheDocument();

    await fireEvent.click(screen.getByRole('tab', { name: /Saved & disabled/ }));
    expect(await screen.findByText('Reusable enrollment notice')).toBeInTheDocument();
    expect(screen.queryByText('System maintenance tonight')).not.toBeInTheDocument();

    await fireEvent.input(screen.getByRole('searchbox', { name: 'Search banner text' }), {
      target: { value: 'missing' },
    });
    expect(screen.getByText('No banners match this search.')).toBeInTheDocument();
    expect(screen.queryByText(/pagination/i)).not.toBeInTheDocument();
    expect(parse).toHaveBeenCalledTimes(records.length);
    const selectedTab = screen.getByRole('tab', { name: /Saved & disabled/ });
    expect(selectedTab).toHaveAttribute('id', 'banner-management-tab-saved');
    expect(selectedTab).toHaveAttribute('aria-controls', 'banner-management-panel');
    expect(screen.getByRole('tabpanel')).toHaveAttribute(
      'aria-labelledby',
      'banner-management-tab-saved',
    );
    parse.mockRestore();
  });

  it('opens one stable, accessible inline disclosure at a time', async () => {
    vi.mocked(getManagedBanners).mockResolvedValue([
      base,
      {
        ...base,
        uuid: '44444444-4444-4444-4444-444444444444',
        htmlContent: '<p>Second active</p>',
      },
    ]);
    render(BannerManagementView);

    const details = await screen.findAllByRole('button', { name: 'Details' });
    expect(details[0]).toHaveAttribute('aria-controls', `banner-${base.uuid}-details`);
    expect(details[0]).toHaveAttribute('aria-expanded', 'false');

    await fireEvent.click(details[0]);
    expect(details[0]).toHaveAttribute('aria-expanded', 'true');
    expect(document.getElementById(`banner-${base.uuid}-details`)).toHaveTextContent(
      'Audience: Everyone',
    );
    expect(document.getElementById(`banner-${base.uuid}-details`)).toHaveTextContent(
      'Last changed by admin-id',
    );
    expect(screen.queryByRole('region', { name: 'Maintenance' })).not.toBeInTheDocument();

    await fireEvent.click(details[1]);
    await waitFor(() => expect(details[0]).toHaveAttribute('aria-expanded', 'false'));
    expect(details[1]).toHaveAttribute('aria-expanded', 'true');
  });

  it('shows the standard API error when the management list fails', async () => {
    vi.mocked(getManagedBanners).mockRejectedValue(new Error('offline'));

    render(BannerManagementView);

    expect(await screen.findByText('Site banners could not be loaded.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'API Error' })).toBeInTheDocument();
  });

  it('keeps the authoritative arrival row mounted when its highlight ends', async () => {
    const saved = { ...records[1], htmlContent: '<p>Authoritative saved content</p>' };
    vi.mocked(saveBanner).mockResolvedValue(saved);
    const nativeSetTimeout = window.setTimeout.bind(window);
    let finishHighlight: (() => void) | undefined;
    const timeout = vi.spyOn(window, 'setTimeout').mockImplementation((handler, delay, ...args) => {
      if (delay === 1_800) {
        finishHighlight = handler as () => void;
        return 1 as unknown as ReturnType<typeof window.setTimeout>;
      }
      return nativeSetTimeout(handler, delay, ...args) as unknown as ReturnType<
        typeof window.setTimeout
      >;
    });
    render(BannerManagementView);
    await screen.findByText('System maintenance tonight');
    await fireEvent.click(screen.getByRole('button', { name: '+ Create banner' }));
    const editor = await screen.findByRole('textbox', { name: 'Banner content' });
    editor.innerHTML = '<p>Draft</p>';
    await fireEvent.input(editor);
    await fireEvent.click(screen.getByRole('button', { name: 'Save for later' }));

    expect(await screen.findByText('Authoritative saved content')).toBeInTheDocument();
    const row = document.querySelector(`[data-banner-row="${saved.uuid}"]`);
    const details = screen.getByRole('button', { name: 'Details' });
    details.focus();

    finishHighlight?.();
    await waitFor(() => expect(row).not.toHaveClass('banner-arrival'));

    expect(document.querySelector(`[data-banner-row="${saved.uuid}"]`)).toBe(row);
    expect(document.activeElement).toBe(details);
    timeout.mockRestore();
  });

  it('uses static tone classes and names selected target routes without raw JSON', async () => {
    vi.mocked(getManagedBanners).mockResolvedValue([
      {
        ...base,
        pageTargets: [
          { kind: 'EXACT', route: '/explorer' },
          { kind: 'SUBTREE', route: '/help' },
          { kind: 'PARAMETERIZED', route: '/datasets/[slug]' },
          { kind: 'PATH', path: '/search' },
        ],
      },
    ]);
    const { container } = render(BannerManagementView);

    const details = await screen.findByRole('button', { name: 'Details' });
    expect(container.querySelector('.bg-warning-500')).toBeInTheDocument();
    expect(container.querySelector('[aria-label="Warning tone"]')).not.toBeInTheDocument();
    await fireEvent.click(details);
    expect(document.getElementById(`banner-${base.uuid}-details`)).toHaveTextContent(
      'Pages: /explorer, /help/**, /datasets/[slug], /search',
    );
    expect(document.getElementById(`banner-${base.uuid}-details`)).not.toHaveTextContent(
      /"kind"|\{|\}/,
    );
  });
});
