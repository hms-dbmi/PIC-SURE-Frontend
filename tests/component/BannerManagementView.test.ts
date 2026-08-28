// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';

const navigation = vi.hoisted(() => ({ beforeNavigate: vi.fn(), goto: vi.fn() }));
vi.mock('$app/navigation', () => navigation);
vi.mock('$app/paths', () => ({ resolve: (path: string) => path }));

vi.mock('$lib/services/BannerManagement', () => ({
  archiveBanner: vi.fn(),
  disableBanner: vi.fn(),
  getManagedBanners: vi.fn(),
  publishBanner: vi.fn(),
  publishSavedBanner: vi.fn(),
  reorderBanners: vi.fn(),
  restoreBanner: vi.fn(),
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
import {
  archiveBanner,
  disableBanner,
  getManagedBanners,
  reorderBanners,
  restoreBanner,
  saveBanner,
  updatePublishedBanner,
} from '$lib/services/BannerManagement';
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
  disabledAt: null,
  disabledBy: null,
  restoredFromUuid: null,
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
  navigation.beforeNavigate.mockReset();
  navigation.goto.mockReset();
  vi.mocked(getManagedBanners).mockReset().mockResolvedValue(records);
  vi.mocked(saveBanner).mockReset();
  vi.mocked(reorderBanners).mockReset();
  vi.mocked(updatePublishedBanner).mockReset();
  vi.mocked(disableBanner).mockReset();
  vi.mocked(archiveBanner).mockReset();
  vi.mocked(restoreBanner).mockReset();
  vi.mocked(toaster.success).mockReset();
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

async function openDetailsFor(text: string) {
  const row = (await screen.findByText(text)).closest('article');
  const details = within(row as HTMLElement).getByRole('button', { name: 'Details' });
  await fireEvent.click(details);
  return row as HTMLElement;
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

  it('adopts the canonical reorder response and then replaces it with one authoritative refresh', async () => {
    const arrival = {
      ...base,
      uuid: '66666666-6666-6666-6666-666666666666',
      htmlContent: '<p>Concurrent arrival</p>',
      title: 'Arrival',
      priority: 2,
    };
    const refreshedSecond = { ...scheduled, htmlContent: '<p>Refreshed second notice</p>' };
    vi.mocked(getManagedBanners)
      .mockResolvedValueOnce([base, scheduled, records[1]])
      .mockResolvedValueOnce([refreshedSecond, arrival, records[1]]);
    vi.mocked(reorderBanners).mockResolvedValue([{ ...scheduled, priority: 1 }, arrival]);
    render(BannerManagementView);
    await screen.findByText('System maintenance tonight');

    await drag(base.uuid, scheduled.uuid);
    await fireEvent.click(screen.getByRole('button', { name: 'Save order' }));

    await waitFor(() => expect(getManagedBanners).toHaveBeenCalledTimes(2));
    expect(bannerRowOrder()).toEqual([scheduled.uuid, arrival.uuid]);
    expect(screen.getByText('Refreshed second notice')).toBeInTheDocument();
    expect(screen.getByText('Concurrent arrival')).toBeInTheDocument();
    expect(screen.queryByText('System maintenance tonight')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save order' })).not.toBeInTheDocument();
    expect(toaster.success).toHaveBeenCalledWith({ title: 'Banner order saved' });
  });

  it('keeps a successful canonical queue saved when the follow-up refresh fails', async () => {
    const arrival = {
      ...base,
      uuid: '66666666-6666-6666-6666-666666666666',
      htmlContent: '<p>Concurrent arrival</p>',
      title: 'Arrival',
      priority: 2,
    };
    vi.mocked(getManagedBanners)
      .mockResolvedValueOnce([base, scheduled])
      .mockRejectedValueOnce(new Error('refresh unavailable'));
    vi.mocked(reorderBanners).mockResolvedValue([{ ...scheduled, priority: 1 }, arrival]);
    render(BannerManagementView);
    await screen.findByText('System maintenance tonight');

    await drag(base.uuid, scheduled.uuid);
    await fireEvent.click(screen.getByRole('button', { name: 'Save order' }));

    await waitFor(() => expect(getManagedBanners).toHaveBeenCalledTimes(2));
    expect(bannerRowOrder()).toEqual([scheduled.uuid, arrival.uuid, base.uuid]);
    expect(screen.queryByRole('button', { name: 'Save order' })).not.toBeInTheDocument();
    expect(toaster.success).toHaveBeenCalledWith({ title: 'Banner order saved' });
    expect(toaster.error).not.toHaveBeenCalled();
  });

  it('retains a departed management record outside the canonical queue when refresh fails', async () => {
    const departed = {
      ...base,
      uuid: '66666666-6666-6666-6666-666666666666',
      htmlContent: '<p>Departed notice</p>',
      title: 'Departed',
      priority: 3,
    };
    vi.mocked(getManagedBanners)
      .mockResolvedValueOnce([base, scheduled, departed])
      .mockRejectedValueOnce(new Error('refresh unavailable'));
    vi.mocked(reorderBanners).mockResolvedValue([
      { ...scheduled, priority: 1 },
      { ...base, priority: 2 },
    ]);
    render(BannerManagementView);
    await screen.findByText('Departed notice');

    await drag(base.uuid, scheduled.uuid);
    await fireEvent.click(screen.getByRole('button', { name: 'Save order' }));

    await waitFor(() => expect(toaster.success).toHaveBeenCalledOnce());
    expect(bannerRowOrder()).toEqual([scheduled.uuid, base.uuid, departed.uuid]);
    const departedRow = screen.getByText('Departed notice').closest('article')!;
    expect(
      within(departedRow).queryByRole('button', { name: /Reorder banner/ }),
    ).not.toBeInTheDocument();
  });

  it('keeps saving visible and disables dragging through reorder and refresh', async () => {
    let resolveReorder!: (records: ManagedBanner[]) => void;
    let resolveRefresh!: (records: ManagedBanner[]) => void;
    vi.mocked(getManagedBanners)
      .mockResolvedValueOnce([base, scheduled])
      .mockReturnValueOnce(new Promise((resolve) => (resolveRefresh = resolve)));
    vi.mocked(reorderBanners).mockReturnValue(
      new Promise((resolve) => {
        resolveReorder = resolve;
      }),
    );
    render(BannerManagementView);
    await screen.findByText('System maintenance tonight');
    await drag(base.uuid, scheduled.uuid);
    const savedOrder = [scheduled.uuid, base.uuid];

    await fireEvent.click(screen.getByRole('button', { name: 'Save order' }));
    await waitFor(() => expect(reorderBanners).toHaveBeenCalledWith(savedOrder));
    expect(screen.getByRole('button', { name: 'Saving order...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel order changes' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: /Reorder banner/ })).not.toBeInTheDocument();
    await drag(scheduled.uuid, base.uuid);
    expect(bannerRowOrder()).toEqual(savedOrder);

    resolveReorder([
      { ...scheduled, priority: 1 },
      { ...base, priority: 2 },
    ]);
    await waitFor(() => expect(getManagedBanners).toHaveBeenCalledTimes(2));
    expect(screen.getByRole('button', { name: 'Saving order...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel order changes' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: /Reorder banner/ })).not.toBeInTheDocument();
    await drag(scheduled.uuid, base.uuid);
    expect(bannerRowOrder()).toEqual(savedOrder);

    resolveRefresh([
      { ...scheduled, priority: 1 },
      { ...base, priority: 2 },
    ]);
    await waitFor(() => expect(toaster.success).toHaveBeenCalledOnce());
    expect(screen.queryByRole('button', { name: 'Saving order...' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Reorder banner/ })).toHaveLength(2);
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

  it('guards route and unload navigation, then restores order before continuing the exact route', async () => {
    vi.mocked(getManagedBanners).mockResolvedValue([base, scheduled]);
    render(BannerManagementView);
    await screen.findByText('System maintenance tonight');
    await drag(base.uuid, scheduled.uuid);
    const guard = navigation.beforeNavigate.mock.calls[0][0];
    const cancel = vi.fn();
    const destination = new URL('http://localhost/help?from=ordering#details');

    guard({ to: { url: destination }, cancel, willUnload: false });
    expect(cancel).toHaveBeenCalledOnce();
    expect(await screen.findByRole('heading', { name: 'Unsaved Changes' })).toBeInTheDocument();
    await fireEvent.click(screen.getByRole('button', { name: 'Keep ordering' }));
    expect(bannerRowOrder()).toEqual([scheduled.uuid, base.uuid]);
    expect(navigation.goto).not.toHaveBeenCalled();

    const unload = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(unload);
    expect(unload.defaultPrevented).toBe(true);

    guard({ to: { url: destination }, cancel, willUnload: false });
    await screen.findByRole('heading', { name: 'Unsaved Changes' });
    await fireEvent.click(screen.getByRole('button', { name: 'Discard order changes' }));
    expect(bannerRowOrder()).toEqual([base.uuid, scheduled.uuid]);
    expect(navigation.goto).toHaveBeenCalledWith('/help?from=ordering#details');
  });

  it('guards lifecycle, create, edit, and Configuration tab transitions while order is dirty', async () => {
    const resolveTab = vi.fn();
    vi.mocked(getManagedBanners).mockResolvedValue([base, scheduled, records[1]]);
    const view = render(BannerManagementView, {
      props: { ontabchangerequestresolve: resolveTab },
    });
    await screen.findByText('System maintenance tonight');

    await drag(base.uuid, scheduled.uuid);
    await fireEvent.click(screen.getByRole('tab', { name: /Saved & disabled/ }));
    expect(screen.getByRole('tab', { name: /Active & scheduled/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await fireEvent.click(screen.getByRole('button', { name: 'Keep ordering' }));

    await fireEvent.click(screen.getByRole('button', { name: '+ Create banner' }));
    expect(screen.queryByRole('heading', { name: 'Create banner' })).not.toBeInTheDocument();
    await fireEvent.click(screen.getByRole('button', { name: 'Keep ordering' }));

    const row = document.querySelector<HTMLElement>(`[data-banner-row="${base.uuid}"]`)!;
    await fireEvent.click(within(row).getByRole('button', { name: 'Details' }));
    await fireEvent.click(within(row).getByRole('button', { name: 'Edit banner' }));
    expect(
      screen.queryByRole('heading', { name: 'Edit published banner' }),
    ).not.toBeInTheDocument();
    await fireEvent.click(screen.getByRole('button', { name: 'Keep ordering' }));

    await view.rerender({
      ontabchangerequestresolve: resolveTab,
      tabchangerequest: 'Branding',
    });
    expect(screen.getByRole('heading', { name: 'Unsaved Changes' })).toBeInTheDocument();
    await fireEvent.click(screen.getByRole('button', { name: 'Discard order changes' }));
    expect(resolveTab).toHaveBeenCalledWith('Branding');
  });

  it('continues the guarded lifecycle and editor transitions after discarding order changes', async () => {
    vi.mocked(getManagedBanners).mockResolvedValue([base, scheduled, records[1]]);
    render(BannerManagementView);
    await screen.findByText('System maintenance tonight');

    await drag(base.uuid, scheduled.uuid);
    await fireEvent.click(screen.getByRole('tab', { name: /Saved & disabled/ }));
    await fireEvent.click(screen.getByRole('button', { name: 'Discard order changes' }));
    expect(screen.getByRole('tab', { name: /Saved & disabled/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    await fireEvent.click(screen.getByRole('tab', { name: /Active & scheduled/ }));
    await drag(base.uuid, scheduled.uuid);
    await fireEvent.click(screen.getByRole('button', { name: '+ Create banner' }));
    await fireEvent.click(screen.getByRole('button', { name: 'Discard order changes' }));
    expect(screen.getByRole('heading', { name: 'Create banner' })).toBeInTheDocument();

    await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await drag(base.uuid, scheduled.uuid);
    const row = document.querySelector<HTMLElement>(`[data-banner-row="${base.uuid}"]`)!;
    await fireEvent.click(within(row).getByRole('button', { name: 'Details' }));
    await fireEvent.click(within(row).getByRole('button', { name: 'Edit banner' }));
    await fireEvent.click(screen.getByRole('button', { name: 'Discard order changes' }));
    expect(screen.getByRole('heading', { name: 'Edit published banner' })).toBeInTheDocument();
  });

  it('warns at four canonical Everyone and All-pages publications without blocking order save', async () => {
    const qualifying = [base, scheduled, 2, 3].map((record, index) =>
      typeof record === 'number'
        ? {
            ...base,
            uuid: `${record}6666666-6666-6666-6666-666666666666`,
            htmlContent: `<p>Qualifying ${record}</p>`,
            priority: index + 1,
          }
        : { ...record, priority: index + 1 },
    );
    const excluded = [
      { ...base, uuid: '71111111-1111-1111-1111-111111111111', audience: 'SIGNED_IN' as const },
      { ...base, uuid: '72222222-2222-2222-2222-222222222222', audience: 'SIGNED_OUT' as const },
      {
        ...base,
        uuid: '81111111-1111-1111-1111-111111111111',
        pageTargets: [{ kind: 'EXACT' as const, path: '/help' }],
      },
      { ...base, uuid: '91111111-1111-1111-1111-111111111111', lifecycle: 'EXPIRED' as const },
      {
        ...base,
        uuid: 'a1111111-1111-1111-1111-111111111111',
        status: 'SAVED' as const,
        lifecycle: 'SAVED' as const,
      },
      {
        ...base,
        uuid: 'a2222222-2222-2222-2222-222222222222',
        status: 'DISABLED' as const,
        lifecycle: 'DISABLED' as const,
      },
    ];
    vi.mocked(getManagedBanners).mockResolvedValue([...qualifying, ...excluded]);
    vi.mocked(reorderBanners).mockResolvedValue(qualifying);
    render(BannerManagementView);

    const warning = await screen.findByTestId('banner-overlap-warning');
    expect(warning).toHaveTextContent('4');
    expect(warning).not.toHaveAttribute('aria-live');
    await drag(qualifying[0].uuid, qualifying[1].uuid);
    expect(screen.getByRole('button', { name: 'Save order' })).toBeEnabled();
  });

  it('does not warn below four broad published banners', async () => {
    vi.mocked(getManagedBanners).mockResolvedValue(
      [base, scheduled, { ...base, uuid: '26666666-6666-6666-6666-666666666666' }].map(
        (record, index) => ({ ...record, priority: index + 1 }),
      ),
    );
    render(BannerManagementView);

    expect(await screen.findAllByRole('article')).toHaveLength(3);
    expect(screen.queryByTestId('banner-overlap-warning')).not.toBeInTheDocument();
  });

  it('removes an authoritatively expired edit from both ordering queues before the next save', async () => {
    const third = {
      ...base,
      uuid: '66666666-6666-6666-6666-666666666666',
      htmlContent: '<p>Third active notice</p>',
      title: 'Third notice',
      priority: 12,
    };
    const expired = {
      ...base,
      lifecycle: 'EXPIRED' as const,
      htmlContent: '<p>Authoritatively expired notice</p>',
      endAt: '2026-08-27T12:30:00Z',
    };
    vi.mocked(getManagedBanners).mockResolvedValue([base, scheduled, third]);
    vi.mocked(updatePublishedBanner).mockResolvedValue(expired);
    vi.mocked(reorderBanners).mockResolvedValue([
      { ...third, priority: 1 },
      { ...scheduled, priority: 2 },
    ]);
    render(BannerManagementView);
    await screen.findByText('System maintenance tonight');

    const baseRow = document.querySelector<HTMLElement>(`[data-banner-row="${base.uuid}"]`)!;
    await fireEvent.click(within(baseRow).getByRole('button', { name: 'Details' }));
    await fireEvent.click(within(baseRow).getByRole('button', { name: 'Edit banner' }));
    await fireEvent.input(screen.getByRole('textbox', { name: 'Title' }), {
      target: { value: 'Edited title' },
    });
    const saveChanges = screen.getByRole('button', { name: 'Save changes' });
    await waitFor(() => expect(saveChanges).toBeEnabled());
    await fireEvent.click(saveChanges);

    expect(await screen.findByText('Authoritatively expired notice')).toBeInTheDocument();
    await fireEvent.click(screen.getByRole('tab', { name: /Active & scheduled/ }));
    expect(bannerRowOrder()).toEqual([scheduled.uuid, third.uuid]);
    expect(screen.queryByRole('button', { name: 'Save order' })).not.toBeInTheDocument();

    await drag(scheduled.uuid, third.uuid);
    await fireEvent.click(screen.getByRole('button', { name: 'Save order' }));
    expect(reorderBanners).toHaveBeenCalledOnce();
    expect(reorderBanners).toHaveBeenCalledWith([third.uuid, scheduled.uuid]);
  });

  it('removes a disabled middle banner from both queues without discarding an unsaved reorder', async () => {
    const third = {
      ...base,
      uuid: '66666666-6666-6666-6666-666666666666',
      htmlContent: '<p>Third active notice</p>',
      title: 'Third notice',
      priority: 12,
    };
    const disabled = {
      ...scheduled,
      status: 'DISABLED' as const,
      lifecycle: 'DISABLED' as const,
      updatedAt: '2026-08-27T13:00:00Z',
      updatedBy: 'super-id',
      disabledAt: '2026-08-27T13:00:00Z',
      disabledBy: 'super-id',
    };
    vi.mocked(getManagedBanners).mockResolvedValue([base, scheduled, third]);
    vi.mocked(disableBanner).mockResolvedValue(disabled);
    vi.mocked(reorderBanners).mockResolvedValue([
      { ...third, priority: 1 },
      { ...base, priority: 2 },
    ]);
    render(BannerManagementView);
    await screen.findByText('System maintenance tonight');

    await drag(third.uuid, base.uuid);
    await drag(scheduled.uuid, base.uuid);
    expect(bannerRowOrder()).toEqual([third.uuid, scheduled.uuid, base.uuid]);

    const scheduledRow = document.querySelector<HTMLElement>(
      `[data-banner-row="${scheduled.uuid}"]`,
    )!;
    await fireEvent.click(within(scheduledRow).getByRole('button', { name: 'Details' }));
    await fireEvent.click(within(scheduledRow).getByRole('button', { name: 'Disable banner' }));
    await fireEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Yes' }),
    );

    await waitFor(() => expect(bannerRowOrder()).toEqual([third.uuid, base.uuid]));
    expect(screen.getByText('Position 1')).toBeInTheDocument();
    expect(screen.getByText('Position 2')).toBeInTheDocument();
    expect(screen.queryByText('Position 3')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save order' })).toBeEnabled();

    await fireEvent.click(screen.getByRole('button', { name: 'Save order' }));
    expect(reorderBanners).toHaveBeenCalledOnce();
    expect(reorderBanners).toHaveBeenCalledWith([third.uuid, base.uuid]);
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

  it('offers restore only for disabled and expired occurrences', async () => {
    const disabled: ManagedBanner = {
      ...base,
      uuid: '44444444-4444-4444-4444-444444444444',
      status: 'DISABLED',
      lifecycle: 'DISABLED',
      htmlContent: '<p>Previously disabled</p>',
      disabledAt: '2026-08-27T12:30:00Z',
      disabledBy: 'admin-id',
    };
    vi.mocked(getManagedBanners).mockResolvedValue([...records, disabled, scheduled]);
    render(BannerManagementView);

    for (const unavailable of ['System maintenance tonight', 'Scheduled enrollment notice']) {
      const row = await openDetailsFor(unavailable);
      expect(within(row).queryByRole('button', { name: 'Restore banner' })).not.toBeInTheDocument();
    }
    await fireEvent.click(screen.getByRole('tab', { name: /Saved & disabled/ }));
    const savedRow = await openDetailsFor('Reusable enrollment notice');
    expect(
      within(savedRow).queryByRole('button', { name: 'Restore banner' }),
    ).not.toBeInTheDocument();
    const disabledRow = await openDetailsFor('Previously disabled');
    expect(within(disabledRow).getByRole('button', { name: 'Restore banner' })).toBeInTheDocument();
    await fireEvent.click(screen.getByRole('tab', { name: /Expired/ }));
    const expiredRow = await openDetailsFor('Past outage');
    expect(within(expiredRow).getByRole('button', { name: 'Restore banner' })).toBeInTheDocument();
    expect(within(expiredRow).getByRole('button', { name: 'Edit banner' })).toBeInTheDocument();
  });

  it('guards a dirty reorder through Keep and Discard before restoring at the clean queue bottom', async () => {
    const disabled: ManagedBanner = {
      ...base,
      uuid: '44444444-4444-4444-4444-444444444444',
      status: 'DISABLED',
      lifecycle: 'DISABLED',
      htmlContent: '<p>Previously disabled</p>',
      disabledAt: '2026-08-27T12:30:00Z',
      disabledBy: 'admin-id',
    };
    const restored: ManagedBanner = {
      ...disabled,
      uuid: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      status: 'PUBLISHED',
      lifecycle: 'ACTIVE',
      htmlContent: '<p>Authoritative restored notice</p>',
      priority: 99,
      startAt: '2026-08-28T12:00:00Z',
      endAt: null,
      disabledAt: null,
      disabledBy: null,
      restoredFromUuid: disabled.uuid,
    };
    vi.mocked(getManagedBanners).mockResolvedValue([base, scheduled, disabled]);
    vi.mocked(restoreBanner).mockResolvedValue(restored);
    render(BannerManagementView);
    await screen.findByText('System maintenance tonight');

    await drag(scheduled.uuid, base.uuid);
    expect(bannerRowOrder()).toEqual([scheduled.uuid, base.uuid]);
    await fireEvent.click(screen.getByRole('tab', { name: /Saved & disabled/ }));
    expect(screen.getByRole('tab', { name: /Active & scheduled/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await fireEvent.click(screen.getByRole('button', { name: 'Keep ordering' }));
    expect(bannerRowOrder()).toEqual([scheduled.uuid, base.uuid]);

    await fireEvent.click(screen.getByRole('tab', { name: /Saved & disabled/ }));
    await fireEvent.click(screen.getByRole('button', { name: 'Discard order changes' }));
    expect(screen.getByRole('tab', { name: /Saved & disabled/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await fireEvent.input(screen.getByRole('searchbox', { name: 'Search banner text' }), {
      target: { value: 'Previously' },
    });
    const sourceRow = await openDetailsFor('Previously disabled');
    await fireEvent.click(within(sourceRow).getByRole('button', { name: 'Restore banner' }));

    expect(screen.getByRole('heading', { name: 'Restore banner' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await fireEvent.click(screen.getByRole('button', { name: 'Restore' }));

    await waitFor(() =>
      expect(restoreBanner).toHaveBeenCalledWith(disabled.uuid, expect.any(Object)),
    );
    expect(await screen.findByText('Authoritative restored notice')).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Search banner text' })).toHaveValue('');
    expect(screen.queryByText('Previously disabled')).not.toBeInTheDocument();
    expect(bannerRowOrder()).toEqual([base.uuid, scheduled.uuid, restored.uuid]);
    const restoredRow = document.querySelector<HTMLElement>(
      `[data-banner-row="${restored.uuid}"]`,
    )!;
    expect(restoredRow).toHaveClass('banner-arrival');
    expect(within(restoredRow).getByRole('button', { name: 'Details' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(restoredRow).toHaveTextContent(`Restored from ${disabled.uuid}`);
    expect(screen.queryByRole('button', { name: 'Save order' })).not.toBeInTheDocument();
  });

  it('shows the broad overlap warning when restore raises Everyone and All pages from three to four', async () => {
    const third: ManagedBanner = {
      ...base,
      uuid: '33333333-3333-3333-3333-333333333333',
      htmlContent: '<p>Third broad notice</p>',
      priority: 3,
    };
    const source: ManagedBanner = {
      ...base,
      uuid: '44444444-4444-4444-4444-444444444444',
      status: 'DISABLED',
      lifecycle: 'DISABLED',
      htmlContent: '<p>Disabled broad notice</p>',
      priority: 4,
      disabledAt: '2026-08-27T12:30:00Z',
      disabledBy: 'admin-id',
    };
    const destination: ManagedBanner = {
      ...source,
      uuid: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      status: 'PUBLISHED',
      lifecycle: 'ACTIVE',
      htmlContent: '<p>Restored fourth broad notice</p>',
      priority: 4,
      disabledAt: null,
      disabledBy: null,
      restoredFromUuid: source.uuid,
    };
    vi.mocked(getManagedBanners).mockResolvedValue([base, scheduled, third, source]);
    vi.mocked(restoreBanner).mockResolvedValue(destination);
    render(BannerManagementView);
    await screen.findByText('Third broad notice');
    expect(screen.queryByTestId('banner-overlap-warning')).not.toBeInTheDocument();

    await fireEvent.click(screen.getByRole('tab', { name: /Saved & disabled/ }));
    const sourceRow = await openDetailsFor('Disabled broad notice');
    await fireEvent.click(within(sourceRow).getByRole('button', { name: 'Restore banner' }));
    await fireEvent.click(screen.getByRole('button', { name: 'Restore' }));

    const warning = await screen.findByTestId('banner-overlap-warning');
    expect(warning).toHaveTextContent(
      '4 published banners currently target Everyone and All pages',
    );
    expect(bannerRowOrder()).toEqual([base.uuid, scheduled.uuid, third.uuid, destination.uuid]);
  });

  it('keeps the copied restore editor and source unchanged when restore fails', async () => {
    const disabled: ManagedBanner = {
      ...base,
      uuid: '44444444-4444-4444-4444-444444444444',
      status: 'DISABLED',
      lifecycle: 'DISABLED',
      htmlContent: '<p>Previously disabled</p>',
      disabledAt: '2026-08-27T12:30:00Z',
      disabledBy: 'admin-id',
    };
    vi.mocked(getManagedBanners).mockResolvedValue([base, disabled]);
    vi.mocked(restoreBanner).mockRejectedValue(new Error('offline'));
    render(BannerManagementView);
    await screen.findByText('System maintenance tonight');
    await fireEvent.click(screen.getByRole('tab', { name: /Saved & disabled/ }));
    const sourceRow = await openDetailsFor('Previously disabled');
    await fireEvent.click(within(sourceRow).getByRole('button', { name: 'Restore banner' }));
    await fireEvent.input(screen.getByRole('textbox', { name: 'Title' }), {
      target: { value: 'Copied changes' },
    });

    await fireEvent.click(screen.getByRole('button', { name: 'Restore' }));

    await waitFor(() =>
      expect(toaster.error).toHaveBeenCalledWith({
        title: 'Banner could not be restored',
        description: 'The source banner is unchanged. Your copied changes are still here.',
      }),
    );
    expect(screen.getByRole('heading', { name: 'Restore banner' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Title' })).toHaveValue('Copied changes');
    await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await fireEvent.click(screen.getByRole('button', { name: 'Discard changes' }));
    expect(await screen.findByText('Previously disabled')).toBeInTheDocument();
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

  it('offers disable only for active and scheduled occurrences', async () => {
    vi.mocked(getManagedBanners).mockResolvedValue([
      ...records,
      {
        ...base,
        uuid: '44444444-4444-4444-4444-444444444444',
        lifecycle: 'SCHEDULED',
        htmlContent: '<p>Upcoming outage</p>',
        startAt: '2026-08-28T12:00:00Z',
      },
      {
        ...base,
        uuid: '55555555-5555-5555-5555-555555555555',
        status: 'DISABLED',
        lifecycle: 'DISABLED',
        htmlContent: '<p>Previously disabled</p>',
        disabledAt: '2026-08-27T12:30:00Z',
        disabledBy: 'admin-id',
      },
    ]);
    render(BannerManagementView);

    for (const active of ['System maintenance tonight', 'Upcoming outage']) {
      const row = await openDetailsFor(active);
      expect(within(row).getByRole('button', { name: 'Disable banner' })).toBeInTheDocument();
    }

    await fireEvent.click(screen.getByRole('tab', { name: /Saved & disabled/ }));
    for (const inactive of ['Reusable enrollment notice', 'Previously disabled']) {
      const row = await openDetailsFor(inactive);
      expect(within(row).queryByRole('button', { name: 'Disable banner' })).not.toBeInTheDocument();
    }

    await fireEvent.click(screen.getByRole('tab', { name: /Expired/ }));
    const expired = await openDetailsFor('Past outage');
    expect(
      within(expired).queryByRole('button', { name: 'Disable banner' }),
    ).not.toBeInTheDocument();
  });

  it('confirms without typed input and reconciles the row from the authoritative response', async () => {
    const disabled: ManagedBanner = {
      ...base,
      status: 'DISABLED',
      lifecycle: 'DISABLED',
      htmlContent: '<p>Authoritative disabled content</p>',
      updatedAt: '2026-08-27T13:00:00Z',
      updatedBy: 'super-id',
      disabledAt: '2026-08-27T13:00:00Z',
      disabledBy: 'super-id',
    };
    vi.mocked(disableBanner).mockResolvedValue(disabled);
    render(BannerManagementView);
    await openDetailsFor('System maintenance tonight');

    await fireEvent.click(screen.getByRole('button', { name: 'Disable banner' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Disable banner?' })).toBeInTheDocument();
    expect(within(dialog).queryByRole('textbox')).not.toBeInTheDocument();

    await fireEvent.click(within(dialog).getByRole('button', { name: 'No' }));
    expect(disableBanner).not.toHaveBeenCalled();
    expect(screen.getByText('System maintenance tonight')).toBeInTheDocument();

    await fireEvent.click(screen.getByRole('button', { name: 'Disable banner' }));
    await fireEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Yes' }),
    );

    expect(disableBanner).toHaveBeenCalledWith(base.uuid);
    await waitFor(() =>
      expect(screen.queryByText('System maintenance tonight')).not.toBeInTheDocument(),
    );
    expect(toaster.success).toHaveBeenCalledWith({ title: 'Banner disabled' });
    expect(screen.getByRole('tab', { name: /Active & scheduled/ })).toHaveTextContent('0');
    expect(screen.getByRole('tab', { name: /Saved & disabled/ })).toHaveTextContent('2');

    await fireEvent.click(screen.getByRole('tab', { name: /Saved & disabled/ }));
    const row = await openDetailsFor('Authoritative disabled content');
    expect(row).toHaveTextContent('Disabled');
    expect(row).toHaveTextContent('Last changed by super-id');
  });

  it('leaves management unchanged and uses the existing error treatment when disable fails', async () => {
    vi.mocked(disableBanner).mockRejectedValue(new Error('offline'));
    render(BannerManagementView);
    await openDetailsFor('System maintenance tonight');

    await fireEvent.click(screen.getByRole('button', { name: 'Disable banner' }));
    await fireEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Yes' }),
    );

    await waitFor(() =>
      expect(toaster.error).toHaveBeenCalledWith({
        title: 'Banner could not be disabled',
        description: 'The banner is unchanged. Check your connection and try again.',
      }),
    );
    expect(toaster.success).not.toHaveBeenCalled();
    expect(screen.getByRole('tab', { name: /Active & scheduled/ })).toHaveTextContent('1');
    expect(screen.getByRole('tab', { name: /Saved & disabled/ })).toHaveTextContent('1');
    expect(screen.getByText('System maintenance tonight')).toBeInTheDocument();
  });

  it('blocks a second disable while preserving unrelated row controls', async () => {
    vi.mocked(getManagedBanners).mockResolvedValue([base, scheduled]);
    vi.mocked(disableBanner).mockReturnValue(new Promise(() => {}));
    render(BannerManagementView);

    const firstRow = await openDetailsFor('System maintenance tonight');
    await fireEvent.click(within(firstRow).getByRole('button', { name: 'Disable banner' }));
    await fireEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Yes' }),
    );
    await waitFor(() => expect(disableBanner).toHaveBeenCalledWith(base.uuid));

    expect(within(firstRow).getByRole('button', { name: 'Edit banner' })).toBeDisabled();
    expect(within(firstRow).getByRole('button', { name: 'Disable banner' })).toBeDisabled();
    await fireEvent.click(within(firstRow).getByRole('button', { name: 'Edit banner' }));
    expect(
      screen.queryByRole('heading', { name: 'Edit published banner' }),
    ).not.toBeInTheDocument();

    const secondRow = await openDetailsFor('Scheduled enrollment notice');
    expect(document.getElementById(`banner-${scheduled.uuid}-details`)).toBeInTheDocument();
    expect(within(secondRow).getByRole('button', { name: 'Edit banner' })).toBeEnabled();
    expect(within(secondRow).getByRole('button', { name: 'Disable banner' })).toBeDisabled();
    expect(disableBanner).toHaveBeenCalledTimes(1);
  });

  it('preserves unrelated details when a disable succeeds', async () => {
    const disabled: ManagedBanner = {
      ...base,
      status: 'DISABLED',
      lifecycle: 'DISABLED',
      updatedAt: '2026-08-27T13:00:00Z',
      updatedBy: 'super-id',
      disabledAt: '2026-08-27T13:00:00Z',
      disabledBy: 'super-id',
    };
    let resolveDisable!: (result: ManagedBanner) => void;
    vi.mocked(getManagedBanners).mockResolvedValue([base, scheduled]);
    vi.mocked(disableBanner).mockReturnValue(
      new Promise((resolve) => {
        resolveDisable = resolve;
      }),
    );
    render(BannerManagementView);

    const firstRow = await openDetailsFor('System maintenance tonight');
    await fireEvent.click(within(firstRow).getByRole('button', { name: 'Disable banner' }));
    await fireEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Yes' }),
    );
    await waitFor(() => expect(disableBanner).toHaveBeenCalledWith(base.uuid));

    await openDetailsFor('Scheduled enrollment notice');
    resolveDisable(disabled);

    await waitFor(() => expect(toaster.success).toHaveBeenCalledWith({ title: 'Banner disabled' }));
    expect(document.getElementById(`banner-${scheduled.uuid}-details`)).toBeInTheDocument();
  });

  it('offers archive only for saved, disabled, and expired occurrences', async () => {
    vi.mocked(getManagedBanners).mockResolvedValue([
      ...records,
      {
        ...base,
        uuid: '44444444-4444-4444-4444-444444444444',
        lifecycle: 'SCHEDULED',
        htmlContent: '<p>Upcoming outage</p>',
        startAt: '2026-08-28T12:00:00Z',
      },
      {
        ...base,
        uuid: '55555555-5555-5555-5555-555555555555',
        status: 'DISABLED',
        lifecycle: 'DISABLED',
        htmlContent: '<p>Previously disabled</p>',
        disabledAt: '2026-08-27T12:30:00Z',
        disabledBy: 'admin-id',
      },
    ]);
    render(BannerManagementView);

    for (const displayed of ['System maintenance tonight', 'Upcoming outage']) {
      const row = await openDetailsFor(displayed);
      expect(within(row).queryByRole('button', { name: 'Archive banner' })).not.toBeInTheDocument();
      expect(within(row).getByRole('button', { name: 'Disable banner' })).toBeInTheDocument();
    }

    await fireEvent.click(screen.getByRole('tab', { name: /Saved & disabled/ }));
    for (const inactive of ['Reusable enrollment notice', 'Previously disabled']) {
      const row = await openDetailsFor(inactive);
      expect(within(row).getByRole('button', { name: 'Archive banner' })).toBeInTheDocument();
    }

    await fireEvent.click(screen.getByRole('tab', { name: /Expired/ }));
    const expired = await openDetailsFor('Past outage');
    expect(within(expired).getByRole('button', { name: 'Archive banner' })).toBeInTheDocument();
    expect(
      within(expired).queryByRole('button', { name: /Reorder banner/ }),
    ).not.toBeInTheDocument();
  });

  it('confirms without typed input and removes only the returned uuid from normal management', async () => {
    const disabled: ManagedBanner = {
      ...base,
      uuid: '55555555-5555-5555-5555-555555555555',
      status: 'DISABLED',
      lifecycle: 'DISABLED',
      htmlContent: '<p>Previously disabled</p>',
      disabledAt: '2026-08-27T12:30:00Z',
      disabledBy: 'admin-id',
    };
    vi.mocked(getManagedBanners).mockResolvedValue([...records, disabled]);
    vi.mocked(archiveBanner).mockResolvedValue({
      uuid: disabled.uuid,
      status: 'ARCHIVED',
      archivedAt: '2026-08-28T13:00:00Z',
      archivedBy: 'super-id',
    });
    render(BannerManagementView);
    await screen.findByText('System maintenance tonight');
    await fireEvent.click(screen.getByRole('tab', { name: /Saved & disabled/ }));
    const row = await openDetailsFor('Previously disabled');
    expect(row.closest('[data-banner-row]')).toBeInTheDocument();

    await fireEvent.click(within(row).getByRole('button', { name: 'Archive banner' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Archive banner?' })).toBeInTheDocument();
    expect(within(dialog).queryByRole('textbox')).not.toBeInTheDocument();
    expect(dialog).toHaveTextContent(/leaves normal management/i);
    expect(dialog).toHaveTextContent(/retained/i);

    await fireEvent.click(within(dialog).getByRole('button', { name: 'No' }));
    expect(archiveBanner).not.toHaveBeenCalled();
    expect(screen.getByText('Previously disabled')).toBeInTheDocument();

    await fireEvent.click(within(row).getByRole('button', { name: 'Archive banner' }));
    await fireEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Yes' }),
    );

    expect(archiveBanner).toHaveBeenCalledWith(disabled.uuid);
    await waitFor(() => expect(screen.queryByText('Previously disabled')).not.toBeInTheDocument());
    expect(toaster.success).toHaveBeenCalledWith({ title: 'Banner archived' });
    expect(screen.getByRole('tab', { name: /Saved & disabled/ })).toHaveTextContent('1');
    expect(screen.getByRole('tab', { name: /Active & scheduled/ })).toHaveTextContent('1');
    expect(screen.getByRole('tab', { name: /Expired/ })).toHaveTextContent('1');
    expect(screen.getByText('Reusable enrollment notice')).toBeInTheDocument();
    expect(document.getElementById(`banner-${disabled.uuid}-details`)).not.toBeInTheDocument();
  });

  it('blocks archived row actions while pending and preserves unrelated row state', async () => {
    const saved = records[1];
    const archived = {
      uuid: saved.uuid,
      status: 'ARCHIVED' as const,
      archivedAt: '2026-08-28T13:00:00Z',
      archivedBy: 'admin-id',
    };
    let resolveArchive!: (result: typeof archived) => void;
    vi.mocked(archiveBanner).mockReturnValue(
      new Promise((resolve) => {
        resolveArchive = resolve;
      }),
    );
    render(BannerManagementView);
    await screen.findByText('System maintenance tonight');
    await fireEvent.click(screen.getByRole('tab', { name: /Saved & disabled/ }));
    const row = await openDetailsFor('Reusable enrollment notice');
    const edit = within(row).getByRole('button', { name: 'Edit banner' });
    const archive = within(row).getByRole('button', { name: 'Archive banner' });

    await fireEvent.click(archive);
    await fireEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Yes' }),
    );

    await waitFor(() => expect(archiveBanner).toHaveBeenCalledWith(saved.uuid));
    expect(edit).toBeDisabled();
    expect(archive).toBeDisabled();
    await fireEvent.click(edit);
    expect(screen.queryByRole('heading', { name: /Edit .* banner/ })).not.toBeInTheDocument();

    await fireEvent.click(screen.getByRole('tab', { name: /Active & scheduled/ }));
    const activeRow = await openDetailsFor('System maintenance tonight');
    expect(document.getElementById(`banner-${base.uuid}-details`)).toBeInTheDocument();
    await fireEvent.click(within(activeRow).getByRole('button', { name: 'Edit banner' }));
    expect(screen.getByRole('heading', { name: 'Edit published banner' })).toBeInTheDocument();

    resolveArchive(archived);
    await waitFor(() => expect(toaster.success).toHaveBeenCalledWith({ title: 'Banner archived' }));
    expect(screen.getByRole('heading', { name: 'Edit published banner' })).toBeInTheDocument();
    await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await screen.findByText('System maintenance tonight');
    expect(document.getElementById(`banner-${base.uuid}-details`)).toBeInTheDocument();
  });

  it('blocks a second archive while preserving unrelated row controls', async () => {
    const firstSaved = records[1];
    const secondSaved: ManagedBanner = {
      ...firstSaved,
      uuid: '66666666-6666-6666-6666-666666666666',
      htmlContent: '<p>Second reusable notice</p>',
    };
    vi.mocked(getManagedBanners).mockResolvedValue([firstSaved, secondSaved]);
    vi.mocked(archiveBanner).mockReturnValue(new Promise(() => {}));
    render(BannerManagementView);

    await fireEvent.click(await screen.findByRole('tab', { name: /Saved & disabled/ }));
    const firstRow = await openDetailsFor('Reusable enrollment notice');
    await fireEvent.click(within(firstRow).getByRole('button', { name: 'Archive banner' }));
    await fireEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Yes' }),
    );
    await waitFor(() => expect(archiveBanner).toHaveBeenCalledWith(firstSaved.uuid));

    const secondRow = await openDetailsFor('Second reusable notice');
    expect(document.getElementById(`banner-${secondSaved.uuid}-details`)).toBeInTheDocument();
    expect(within(secondRow).getByRole('button', { name: 'Edit banner' })).toBeEnabled();
    expect(within(secondRow).getByRole('button', { name: 'Archive banner' })).toBeDisabled();
    expect(archiveBanner).toHaveBeenCalledTimes(1);
  });

  it('shows the empty state once the last banner in a tab is archived', async () => {
    vi.mocked(getManagedBanners).mockResolvedValue([records[2]]);
    vi.mocked(archiveBanner).mockResolvedValue({
      uuid: records[2].uuid,
      status: 'ARCHIVED',
      archivedAt: '2026-08-28T13:00:00Z',
      archivedBy: 'admin-id',
    });
    render(BannerManagementView);
    await fireEvent.click(await screen.findByRole('tab', { name: /Expired/ }));
    const row = await openDetailsFor('Past outage');

    await fireEvent.click(within(row).getByRole('button', { name: 'Archive banner' }));
    await fireEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Yes' }),
    );

    expect(await screen.findByText('No banners in this section.')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Expired/ })).toHaveTextContent('0');
  });

  it('leaves management unchanged and uses the existing error treatment when archive fails', async () => {
    vi.mocked(archiveBanner).mockRejectedValue(new Error('offline'));
    render(BannerManagementView);
    await screen.findByText('System maintenance tonight');
    await fireEvent.click(screen.getByRole('tab', { name: /Expired/ }));
    const row = await openDetailsFor('Past outage');

    await fireEvent.click(within(row).getByRole('button', { name: 'Archive banner' }));
    await fireEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Yes' }),
    );

    await waitFor(() =>
      expect(toaster.error).toHaveBeenCalledWith({
        title: 'Banner could not be archived',
        description: 'The banner is unchanged. Check your connection and try again.',
      }),
    );
    expect(toaster.success).not.toHaveBeenCalled();
    expect(screen.getByRole('tab', { name: /Expired/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /Expired/ })).toHaveTextContent('1');
    expect(screen.getByRole('tab', { name: /Active & scheduled/ })).toHaveTextContent('1');
    expect(screen.getByText('Past outage')).toBeInTheDocument();
    expect(document.getElementById(`banner-${records[2].uuid}-details`)).toBeInTheDocument();
  });

  it('archiving an inactive banner does not make the saved order dirty', async () => {
    const expired = records[2];
    vi.mocked(archiveBanner).mockResolvedValue({
      uuid: expired.uuid,
      status: 'ARCHIVED',
      archivedAt: '2026-08-28T13:00:00Z',
      archivedBy: 'admin-id',
    });
    render(BannerManagementView);
    await screen.findByText('System maintenance tonight');
    expect(screen.queryByRole('button', { name: 'Save order' })).not.toBeInTheDocument();

    await fireEvent.click(screen.getByRole('tab', { name: /Expired/ }));
    const row = await openDetailsFor('Past outage');
    await fireEvent.click(within(row).getByRole('button', { name: 'Archive banner' }));
    await fireEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Yes' }),
    );

    await waitFor(() => expect(screen.queryByText('Past outage')).not.toBeInTheDocument());
    await fireEvent.click(screen.getByRole('tab', { name: /Active & scheduled/ }));
    expect(screen.queryByRole('button', { name: 'Save order' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel order changes' })).not.toBeInTheDocument();
    expect(bannerRowOrder()).toEqual([base.uuid]);
    expect(reorderBanners).not.toHaveBeenCalled();
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

  it('uses static tone classes and summarizes typed page targets', async () => {
    vi.mocked(getManagedBanners).mockResolvedValue([
      {
        ...base,
        pageTargets: [
          { kind: 'EXACT', path: '/explorer' },
          { kind: 'SUBTREE', path: '/help' },
          { kind: 'PARAMETERIZED', path: '/studies/[study]' },
        ],
      },
    ]);
    const { container } = render(BannerManagementView);

    const details = await screen.findByRole('button', { name: 'Details' });
    expect(container.querySelector('.bg-warning-500')).toBeInTheDocument();
    expect(container.querySelector('[aria-label="Warning tone"]')).not.toBeInTheDocument();
    await fireEvent.click(details);
    expect(document.getElementById(`banner-${base.uuid}-details`)).toHaveTextContent(
      'Pages: Exact: /explorer · Subtree: /help · Parameterized: /studies/[study]',
    );
  });

  it('bounds the typed page-target summary without limiting stored targets', async () => {
    const longPath = `/${'segment'.repeat(12)}-hidden-tail`;
    vi.mocked(getManagedBanners).mockResolvedValue([
      {
        ...base,
        pageTargets: [
          { kind: 'EXACT', path: longPath },
          { kind: 'EXACT', path: '/second' },
          { kind: 'SUBTREE', path: '/third' },
          { kind: 'PARAMETERIZED', path: '/fourth/[id]' },
          { kind: 'EXACT', path: '/fifth-hidden' },
        ],
      },
    ]);
    render(BannerManagementView);

    const details = await screen.findByRole('button', { name: 'Details' });
    await fireEvent.click(details);
    const panel = document.getElementById(`banner-${base.uuid}-details`);
    expect(panel).toHaveTextContent('Pages: Exact: /segment');
    expect(panel).toHaveTextContent('· + more');
    expect(panel).not.toHaveTextContent('hidden-tail');
    expect(panel).not.toHaveTextContent('/fifth-hidden');
  });
});
