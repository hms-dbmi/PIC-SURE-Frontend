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
import { getManagedBanners } from '$lib/services/BannerManagement';
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
});

describe('BannerManagementView', () => {
  it('groups loaded rows under lifecycle tabs and filters plain text without pagination', async () => {
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
});
