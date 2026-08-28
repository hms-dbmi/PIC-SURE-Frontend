// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';

vi.mock('$lib/services/BannerManagement', () => ({
  getManagedBanners: vi.fn(),
  publishBanner: vi.fn(),
  publishSavedBanner: vi.fn(),
  reorderBanners: vi.fn(),
  saveBanner: vi.fn(),
  updatePublishedBanner: vi.fn(),
  updateSavedBanner: vi.fn(),
}));

const sensors = vi.hoisted(() => ({ keyboard: Symbol('keyboard'), pointer: Symbol('pointer') }));
vi.mock('@dnd-kit-svelte/svelte', async () => ({
  DragDropProvider: (await import('./fixtures/DragDropProviderMock.svelte')).default,
  DragOverlay: (await import('./fixtures/DragOverlayMock.svelte')).default,
  KeyboardSensor: sensors.keyboard,
  PointerSensor: sensors.pointer,
}));
vi.mock('@dnd-kit-svelte/svelte/sortable', () => ({
  useSortable: () => ({ ref: vi.fn(), handleRef: vi.fn() }),
}));
vi.mock('$lib/toaster', () => ({ toaster: { success: vi.fn(), error: vi.fn() } }));

import BannerManagementView from '$lib/components/admin/configuration/BannerManagementView.svelte';
import { getManagedBanners, reorderBanners, saveBanner } from '$lib/services/BannerManagement';
import { toaster } from '$lib/toaster';
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

const scheduled: ManagedBanner = {
  ...base,
  uuid: '55555555-5555-5555-5555-555555555555',
  lifecycle: 'SCHEDULED',
  htmlContent: '<p>Scheduled enrollment notice</p>',
  title: 'Enrollment',
  priority: 7,
  startAt: '2026-08-28T12:00:00Z',
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
  vi.mocked(reorderBanners).mockReset();
  vi.mocked(toaster.error).mockReset();
});

function bannerRowOrder(): string[] {
  return Array.from(document.querySelectorAll<HTMLElement>('[data-banner-row]')).map(
    (row) => row.dataset.bannerRow ?? '',
  );
}

async function drag(sourceId: string, targetId: string) {
  const shared = globalThis as typeof globalThis & { __bannerDndEvent?: unknown };
  shared.__bannerDndEvent = { operation: { source: { id: sourceId }, target: { id: sourceId } } };
  await fireEvent.click(screen.getByTestId('dnd-start'));
  shared.__bannerDndEvent = { operation: { source: { id: sourceId }, target: { id: targetId } } };
  await fireEvent.click(screen.getByTestId('dnd-over'));
  await fireEvent.click(screen.getByTestId('dnd-end'));
}

describe('BannerManagementView', () => {
  it('moves locally through the provider seam and reconciles only on save', async () => {
    vi.mocked(getManagedBanners).mockResolvedValue([base, scheduled, ...records.slice(1)]);
    vi.mocked(reorderBanners).mockResolvedValue([
      { ...base, priority: 1 },
      { ...scheduled, priority: 2 },
    ]);
    render(BannerManagementView);
    await screen.findByText('System maintenance tonight');

    expect(
      (globalThis as typeof globalThis & { __bannerDndSensors?: unknown[] }).__bannerDndSensors,
    ).toEqual([sensors.keyboard, sensors.pointer]);
    const grips = screen.getAllByRole('button', { name: /Reorder banner/ });
    expect(grips).toHaveLength(2);
    expect(grips[0]).toHaveClass('focus-visible:ring-3');
    expect(screen.queryByRole('button', { name: /move with keyboard/i })).not.toBeInTheDocument();

    await drag(base.uuid, scheduled.uuid);

    expect(bannerRowOrder()).toEqual([scheduled.uuid, base.uuid]);
    expect(reorderBanners).not.toHaveBeenCalled();
    await fireEvent.click(screen.getByRole('button', { name: 'Save order' }));
    expect(reorderBanners).toHaveBeenCalledWith([scheduled.uuid, base.uuid]);
    await waitFor(() => expect(bannerRowOrder()).toEqual([base.uuid, scheduled.uuid]));
    expect(screen.getByText('Position 1')).toBeInTheDocument();
  });

  it('keeps a failed order dirty and lets cancel restore the saved queue without another request', async () => {
    vi.mocked(getManagedBanners).mockResolvedValue([base, scheduled, ...records.slice(1)]);
    vi.mocked(reorderBanners).mockRejectedValue(new Error('validation failed'));
    render(BannerManagementView);
    await screen.findByText('System maintenance tonight');

    await drag(base.uuid, scheduled.uuid);
    await fireEvent.click(screen.getByRole('button', { name: 'Save order' }));

    await waitFor(() => expect(toaster.error).toHaveBeenCalledOnce());
    expect(bannerRowOrder()).toEqual([scheduled.uuid, base.uuid]);
    expect(screen.getByRole('button', { name: 'Save order' })).toBeEnabled();
    await fireEvent.click(screen.getByRole('button', { name: 'Cancel order changes' }));
    expect(bannerRowOrder()).toEqual([base.uuid, scheduled.uuid]);
    expect(reorderBanners).toHaveBeenCalledTimes(1);
  });

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
    expect(screen.queryByRole('button', { name: /Reorder banner/ })).not.toBeInTheDocument();

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

  it('moves focus and selection through lifecycle tabs from the keyboard', async () => {
    render(BannerManagementView);
    await screen.findByText('System maintenance tonight');
    const active = screen.getByRole('tab', { name: /Active & scheduled/ });
    const saved = screen.getByRole('tab', { name: /Saved & disabled/ });
    const expired = screen.getByRole('tab', { name: /Expired/ });

    active.focus();
    expect(active).toHaveAttribute('tabindex', '0');
    expect(saved).toHaveAttribute('tabindex', '-1');
    await fireEvent.keyDown(active, { key: 'ArrowRight' });
    expect(saved).toHaveFocus();
    expect(saved).toHaveAttribute('aria-selected', 'true');
    expect(saved).toHaveAttribute('tabindex', '0');
    expect(await screen.findByText('Reusable enrollment notice')).toBeInTheDocument();

    await fireEvent.keyDown(saved, { key: 'End' });
    expect(expired).toHaveFocus();
    expect(expired).toHaveAttribute('aria-selected', 'true');
    expect(await screen.findByText('Past outage')).toBeInTheDocument();

    await fireEvent.keyDown(expired, { key: 'Home' });
    expect(active).toHaveFocus();
    await fireEvent.keyDown(active, { key: 'ArrowLeft' });
    expect(expired).toHaveFocus();
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

  it('keeps published editing reachable from the management list', async () => {
    render(BannerManagementView);
    await fireEvent.click(await screen.findByRole('button', { name: 'Details' }));
    await fireEvent.click(screen.getByRole('button', { name: 'Edit banner' }));

    expect(screen.getByRole('heading', { name: 'Edit published banner' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
    expect(screen.queryByText(/version history/i)).not.toBeInTheDocument();
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
    const save = screen.getByRole('button', { name: 'Save for later' });
    await waitFor(() => expect(save).toBeEnabled());
    await fireEvent.click(save);

    expect(await screen.findByText('Authoritative saved content')).toBeInTheDocument();
    const row = document.querySelector(`[data-banner-row="${saved.uuid}"]`);
    expect(row).toHaveClass('banner-arrival');
    expect(timeout).toHaveBeenCalledWith(expect.any(Function), 1_800);
    const details = screen.getByRole('button', { name: 'Details' });
    details.focus();

    finishHighlight?.();
    await waitFor(() => expect(row).not.toHaveClass('banner-arrival'));

    expect(document.querySelector(`[data-banner-row="${saved.uuid}"]`)).toBe(row);
    expect(document.activeElement).toBe(details);
    timeout.mockRestore();
  });

  it('names the existing v1 all-pages target without exposing its object shape', async () => {
    render(BannerManagementView);

    const details = await screen.findByRole('button', { name: 'Details' });
    await fireEvent.click(details);
    const panel = document.getElementById(`banner-${base.uuid}-details`);
    expect(panel).toHaveTextContent('Pages: All pages');
    expect(panel).not.toHaveTextContent('kind');
  });

  it('bounds the collapsed excerpt in rendered and accessible text', async () => {
    const longText = `${'A'.repeat(220)} never-render-this-tail`;
    vi.mocked(getManagedBanners).mockResolvedValue([
      { ...base, htmlContent: `<p>${longText}</p>` },
    ]);
    const { container } = render(BannerManagementView);

    await screen.findByRole('button', { name: 'Details' });
    const excerpt = container.querySelector('p.font-bold');
    expect(excerpt?.textContent?.length).toBeLessThanOrEqual(160);
    expect(excerpt).not.toHaveTextContent('never-render-this-tail');
    expect(excerpt).toHaveTextContent(/…$/);
  });

  it('does not split an emoji at the collapsed excerpt boundary', async () => {
    const prefix = 'A'.repeat(158);
    vi.mocked(getManagedBanners).mockResolvedValue([
      { ...base, htmlContent: `<p>${prefix}😀 trailing text</p>` },
    ]);
    const { container } = render(BannerManagementView);

    await screen.findByRole('button', { name: 'Details' });
    const excerpt = container.querySelector('p.font-bold');
    expect(excerpt).toHaveTextContent(`${prefix}😀…`);
    expect(Array.from(excerpt?.textContent ?? '')).toHaveLength(160);
  });

  it('uses static tone classes and bounds generic target values without raw JSON', async () => {
    vi.mocked(getManagedBanners).mockResolvedValue([
      {
        ...base,
        pageTargets: [
          {
            arbitrary: '/explorer',
            nested: { enabled: true, priority: 2 },
            another: '/help',
            overflow: '/not-shown',
          },
        ],
      },
    ]);
    const { container } = render(BannerManagementView);

    const details = await screen.findByRole('button', { name: 'Details' });
    expect(container.querySelector('.bg-warning-500')).toBeInTheDocument();
    expect(container.querySelector('[aria-label="Warning tone"]')).not.toBeInTheDocument();
    await fireEvent.click(details);
    expect(document.getElementById(`banner-${base.uuid}-details`)).toHaveTextContent(
      'Pages: /explorer · true · 2 · /help · + more',
    );
    expect(document.getElementById(`banner-${base.uuid}-details`)).not.toHaveTextContent(
      /arbitrary|nested|enabled|priority|another|overflow|"|\{|\}|not-shown/,
    );
  });
});
