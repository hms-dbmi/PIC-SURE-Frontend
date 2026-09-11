// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import type { ManagedBanner } from '$lib/models/Banner';
import {
  adoptCanonicalBannerOrder,
  broadBannerOverlapCount,
  initialBannerListState,
  presentBanner,
  reconcileBannerArchived,
  reconcileBannerDisabled,
  reconcileBannerSuccess,
  visibleBannerRecords,
} from '$lib/services/BannerManagementList';

function banner(overrides: Partial<ManagedBanner> = {}): ManagedBanner {
  return {
    uuid: 'uuid-1',
    status: 'PUBLISHED',
    lifecycle: 'ACTIVE',
    htmlContent: '<p>Maintenance window</p>',
    title: null,
    appearance: 'PRIMARY',
    icon: 'NONE',
    dismissible: true,
    audience: 'EVERYONE',
    placement: 'SITE_TOP',
    pageTargets: [{ kind: 'ALL' }],
    startAt: '2026-01-01T00:00:00Z',
    endAt: null,
    priority: 1,
    presentationHash: 'hash-1',
    createdAt: '2026-01-01T00:00:00Z',
    createdBy: 'admin',
    updatedAt: '2026-01-01T00:00:00Z',
    updatedBy: 'admin',
    publishedAt: '2026-01-01T00:00:00Z',
    publishedBy: 'admin',
    disabledAt: null,
    disabledBy: null,
    restoredFromUuid: null,
    ...overrides,
  };
}

describe('banner management list reconciliation', () => {
  const active = banner();
  const scheduled = banner({ uuid: 'uuid-2', lifecycle: 'SCHEDULED', status: 'PUBLISHED' });
  const saved = banner({ uuid: 'uuid-3', lifecycle: 'SAVED', status: 'SAVED', priority: null });

  it('seeds the order queues from orderable records only', () => {
    const state = initialBannerListState([active, scheduled, saved]);
    expect(state.orderUuids).toEqual(['uuid-1', 'uuid-2']);
    expect(state.savedOrderUuids).toEqual(['uuid-1', 'uuid-2']);
    expect(state.records).toHaveLength(3);
  });

  it('keeps the queue position of an edited banner that is already orderable', () => {
    const state = initialBannerListState([active, scheduled]);
    const next = reconcileBannerSuccess(state, { ...active, htmlContent: '<p>Updated</p>' });
    expect(next.orderUuids).toEqual(['uuid-1', 'uuid-2']);
    expect(next.records.find((record) => record.uuid === 'uuid-1')?.excerpt).toBe('Updated');
  });

  it('appends a restored occurrence to both queues and drops its source', () => {
    const state = initialBannerListState([active, scheduled]);
    const restored = banner({ uuid: 'uuid-9', restoredFromUuid: 'uuid-1' });
    const next = reconcileBannerSuccess(state, restored, 'uuid-1');
    expect(next.orderUuids).toEqual(['uuid-2', 'uuid-9']);
    expect(next.savedOrderUuids).toEqual(['uuid-2', 'uuid-9']);
    expect(next.records.map((record) => record.uuid)).toEqual(['uuid-2', 'uuid-9']);
  });

  it('removes a banner from both queues when it stops being orderable', () => {
    const state = initialBannerListState([active, scheduled]);
    const next = reconcileBannerSuccess(state, { ...active, lifecycle: 'SAVED', status: 'SAVED' });
    expect(next.orderUuids).toEqual(['uuid-2']);
    expect(next.savedOrderUuids).toEqual(['uuid-2']);
    expect(next.records).toHaveLength(2);
  });

  it('disabling replaces the record and leaves both queues without it', () => {
    const state = initialBannerListState([active, scheduled]);
    const next = reconcileBannerDisabled(state, {
      ...active,
      lifecycle: 'DISABLED',
      status: 'DISABLED',
    });
    expect(next.orderUuids).toEqual(['uuid-2']);
    expect(next.savedOrderUuids).toEqual(['uuid-2']);
    expect(next.records.find((record) => record.uuid === 'uuid-1')?.lifecycle).toBe('DISABLED');
  });

  it('archiving drops the record entirely', () => {
    const state = initialBannerListState([active, saved]);
    const next = reconcileBannerArchived(state, 'uuid-3');
    expect(next.records.map((record) => record.uuid)).toEqual(['uuid-1']);
    expect(next.orderUuids).toEqual(['uuid-1']);
  });

  it('adopting a canonical order keeps non-orderable records at the end', () => {
    const state = initialBannerListState([active, scheduled, saved]);
    const next = adoptCanonicalBannerOrder(state, [scheduled, active]);
    expect(next.orderUuids).toEqual(['uuid-2', 'uuid-1']);
    expect(next.savedOrderUuids).toEqual(['uuid-2', 'uuid-1']);
    expect(next.records.map((record) => record.uuid)).toEqual(['uuid-2', 'uuid-1', 'uuid-3']);
  });

  it('drops stale orderable records when the canonical response omits them', () => {
    const disabled = banner({ uuid: 'disabled', lifecycle: 'DISABLED', status: 'DISABLED' });
    const expired = banner({ uuid: 'expired', lifecycle: 'EXPIRED' });
    const newActive = banner({ uuid: 'new-active' });
    const state = initialBannerListState([active, scheduled, saved, disabled, expired]);

    const next = adoptCanonicalBannerOrder(state, [newActive]);

    expect(visibleBannerRecords(next, 'orderable', '').map((record) => record.uuid)).toEqual([
      'new-active',
    ]);
    expect(next.savedOrderUuids).toEqual(['new-active']);
    expect(visibleBannerRecords(next, 'saved', '').map((record) => record.uuid)).toEqual([
      saved.uuid,
      disabled.uuid,
    ]);
    expect(visibleBannerRecords(next, 'expired', '').map((record) => record.uuid)).toEqual([
      expired.uuid,
    ]);
  });

  it('clears the orderable tab when the canonical queue is empty', () => {
    const state = initialBannerListState([active, scheduled, saved]);
    const next = adoptCanonicalBannerOrder(state, []);

    expect(visibleBannerRecords(next, 'orderable', '')).toEqual([]);
    expect(next.orderUuids).toEqual([]);
    expect(next.savedOrderUuids).toEqual([]);
    expect(next.records.map((record) => record.uuid)).toEqual([saved.uuid]);
  });

  it('filters visible records by tab and case-insensitive search over title and content', () => {
    const titled = banner({ uuid: 'uuid-4', title: 'Downtime notice', lifecycle: 'SCHEDULED' });
    const state = initialBannerListState([active, titled, saved]);
    expect(
      visibleBannerRecords(state, 'orderable', 'DOWNTIME').map((record) => record.uuid),
    ).toEqual(['uuid-4']);
    expect(visibleBannerRecords(state, 'saved', '').map((record) => record.uuid)).toEqual([
      'uuid-3',
    ]);
  });

  it('finds visible content beyond the excerpt without matching markup or script text', () => {
    const long = banner({
      htmlContent:
        `<p>${'🎉'.repeat(170)} Planned <strong>downtime</strong> &amp; recovery</p>` +
        '<script>hiddenScriptText</script><a href="/hidden-link">More</a>',
    });
    const state = initialBannerListState([long]);

    expect(state.records[0].excerpt).not.toContain('downtime');
    expect(visibleBannerRecords(state, 'orderable', ' DOWNTIME & RECOVERY ')).toHaveLength(1);
    expect(visibleBannerRecords(state, 'orderable', 'hiddenScriptText')).toEqual([]);
    expect(visibleBannerRecords(state, 'orderable', 'hidden-link')).toEqual([]);
    expect(visibleBannerRecords(state, 'orderable', '<strong>')).toEqual([]);
  });

  it.each([
    ['paragraphs', '<p>Scheduled</p><p>maintenance</p>'],
    ['line breaks', '<p>Scheduled<br>maintenance</p>'],
  ])('finds a phrase spanning %s beyond the excerpt', (_description, content) => {
    const long = banner({ htmlContent: `<p>${'🎉'.repeat(170)}</p>${content}` });
    const state = initialBannerListState([long]);

    expect(state.records[0].excerpt).not.toContain('Scheduled');
    expect(visibleBannerRecords(state, 'orderable', 'scheduled maintenance')).toHaveLength(1);
    expect(visibleBannerRecords(state, 'orderable', 'scheduledmaintenance')).toEqual([]);
  });

  it('orders visible orderable records by the working queue', () => {
    const state = {
      ...initialBannerListState([active, scheduled]),
      orderUuids: ['uuid-2', 'uuid-1'],
    };
    expect(visibleBannerRecords(state, 'orderable', '').map((record) => record.uuid)).toEqual([
      'uuid-2',
      'uuid-1',
    ]);
  });

  it('counts broad overlap only for published Everyone/All-pages banners in the queue', () => {
    const targeted = banner({
      uuid: 'uuid-5',
      pageTargets: [{ kind: 'EXACT', path: '/help' }],
    });
    const signedIn = banner({ uuid: 'uuid-6', audience: 'SIGNED_IN' });
    const state = initialBannerListState([active, targeted, signedIn]);
    expect(broadBannerOverlapCount(state)).toBe(1);
  });

  it('builds a code-point-safe excerpt capped at 160 characters', () => {
    const long = presentBanner(banner({ htmlContent: `<p>${'🎉'.repeat(200)}</p>` }));
    expect(Array.from(long.excerpt)).toHaveLength(160);
    expect(long.excerpt.endsWith('…')).toBe(true);
    expect(long.excerpt.includes('�')).toBe(false);
  });
});
