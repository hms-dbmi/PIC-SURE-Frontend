import type { BannerLifecycle, ManagedBanner, ManagementRecord } from '$lib/models/Banner';
import { bannerPlainText } from '$lib/utilities/BannerHTML';
import { isAllPagesBannerTarget } from '$lib/utilities/BannerPageTargets';
import { truncate } from '$lib/utilities/Strings';

export type LifecycleTab = 'orderable' | 'saved' | 'expired';

export interface BannerListState {
  records: ManagementRecord[];
  orderUuids: string[];
  savedOrderUuids: string[];
}

const MAX_EXCERPT_LENGTH = 160;

export function presentBanner(banner: ManagedBanner): ManagementRecord {
  return { ...banner, excerpt: truncate(bannerPlainText(banner.htmlContent), MAX_EXCERPT_LENGTH) };
}

export function inLifecycleTab(lifecycle: BannerLifecycle, tab: LifecycleTab): boolean {
  if (tab === 'orderable') return lifecycle === 'ACTIVE' || lifecycle === 'SCHEDULED';
  if (tab === 'saved') return lifecycle === 'SAVED' || lifecycle === 'DISABLED';
  return lifecycle === 'EXPIRED';
}

export function lifecycleTabFor(lifecycle: BannerLifecycle): LifecycleTab {
  if (lifecycle === 'ACTIVE' || lifecycle === 'SCHEDULED') return 'orderable';
  if (lifecycle === 'EXPIRED') return 'expired';
  return 'saved';
}

export function initialBannerListState(banners: ManagedBanner[]): BannerListState {
  const records = banners.map(presentBanner);
  const orderUuids = records
    .filter((banner) => inLifecycleTab(banner.lifecycle, 'orderable'))
    .map((banner) => banner.uuid);
  return { records, orderUuids, savedOrderUuids: [...orderUuids] };
}

export function reconcileBannerSuccess(
  state: BannerListState,
  banner: ManagedBanner,
  archivedSourceUuid: string | null = null,
): BannerListState {
  const retainsOccurrence = (uuid: string) => uuid !== archivedSourceUuid && uuid !== banner.uuid;
  const records = [
    ...state.records.filter((record) => retainsOccurrence(record.uuid)),
    presentBanner(banner),
  ];
  let { orderUuids, savedOrderUuids } = state;
  if (
    inLifecycleTab(banner.lifecycle, 'orderable') &&
    (archivedSourceUuid !== null || !orderUuids.includes(banner.uuid))
  ) {
    orderUuids = [...orderUuids.filter(retainsOccurrence), banner.uuid];
    savedOrderUuids = [...savedOrderUuids.filter(retainsOccurrence), banner.uuid];
  } else if (!inLifecycleTab(banner.lifecycle, 'orderable')) {
    orderUuids = orderUuids.filter(retainsOccurrence);
    savedOrderUuids = savedOrderUuids.filter(retainsOccurrence);
  }
  return { records, orderUuids, savedOrderUuids };
}

export function reconcileBannerDisabled(
  state: BannerListState,
  disabled: ManagedBanner,
): BannerListState {
  return {
    records: state.records.map((record) =>
      record.uuid === disabled.uuid ? presentBanner(disabled) : record,
    ),
    orderUuids: state.orderUuids.filter((orderUuid) => orderUuid !== disabled.uuid),
    savedOrderUuids: state.savedOrderUuids.filter((orderUuid) => orderUuid !== disabled.uuid),
  };
}

export function reconcileBannerArchived(state: BannerListState, uuid: string): BannerListState {
  return {
    records: state.records.filter((record) => record.uuid !== uuid),
    orderUuids: state.orderUuids.filter((orderUuid) => orderUuid !== uuid),
    savedOrderUuids: state.savedOrderUuids.filter((orderUuid) => orderUuid !== uuid),
  };
}

export function adoptCanonicalBannerOrder(
  state: BannerListState,
  authoritative: ManagedBanner[],
): BannerListState {
  const presented = authoritative.map(presentBanner);
  const presentedUuids = new Set(presented.map((banner) => banner.uuid));
  const orderUuids = presented.map((banner) => banner.uuid);
  return {
    records: [...presented, ...state.records.filter((banner) => !presentedUuids.has(banner.uuid))],
    orderUuids,
    savedOrderUuids: [...orderUuids],
  };
}

export function orderedBannerRecords(
  records: ManagementRecord[],
  orderUuids: string[],
): ManagementRecord[] {
  return [
    ...orderUuids
      .map((uuid) => records.find((banner) => banner.uuid === uuid))
      .filter((banner): banner is ManagementRecord => banner !== undefined),
    ...records.filter(
      (banner) =>
        inLifecycleTab(banner.lifecycle, 'orderable') && !orderUuids.includes(banner.uuid),
    ),
  ];
}

export function visibleBannerRecords(
  state: Pick<BannerListState, 'records' | 'orderUuids'>,
  activeTab: LifecycleTab,
  search: string,
): ManagementRecord[] {
  const candidates =
    activeTab === 'orderable'
      ? orderedBannerRecords(state.records, state.orderUuids)
      : state.records;
  return candidates.filter(
    (banner) =>
      inLifecycleTab(banner.lifecycle, activeTab) &&
      `${banner.title ?? ''} ${banner.excerpt}`
        .toLocaleLowerCase()
        .includes(search.trim().toLocaleLowerCase()),
  );
}

export function lifecycleTabCounts(records: ManagementRecord[]): Record<LifecycleTab, number> {
  return {
    orderable: records.filter((banner) => inLifecycleTab(banner.lifecycle, 'orderable')).length,
    saved: records.filter((banner) => inLifecycleTab(banner.lifecycle, 'saved')).length,
    expired: records.filter((banner) => inLifecycleTab(banner.lifecycle, 'expired')).length,
  };
}

export function broadBannerOverlapCount(
  state: Pick<BannerListState, 'records' | 'orderUuids'>,
): number {
  return state.records.filter(
    (banner) =>
      banner.status === 'PUBLISHED' &&
      state.orderUuids.includes(banner.uuid) &&
      inLifecycleTab(banner.lifecycle, 'orderable') &&
      banner.audience === 'EVERYONE' &&
      isAllPagesBannerTarget(banner.pageTargets),
  ).length;
}
