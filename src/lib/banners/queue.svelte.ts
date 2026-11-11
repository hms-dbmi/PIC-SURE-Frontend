import {
  archiveBanner,
  disableBanner,
  getManagedBanners,
  reorderBanners,
} from '#lib/api/picsure/banners.ts';
import type { ManagedBanner, ManagementRecord } from '#lib/banners/model/banner.ts';
import {
  adoptCanonicalBannerOrder,
  bannerActionLabels,
  broadBannerOverlapCount,
  initialBannerListState,
  lifecycleTabCounts,
  lifecycleTabFor,
  reconcileBannerArchived,
  reconcileBannerDisabled,
  reconcileBannerSuccess,
  visibleBannerRecords,
  type BannerListState,
  type LifecycleTab,
} from '#lib/banners/model/list.ts';
import { toaster } from '#lib/ui/toaster.ts';

/**
 * The admin banner list: the records, the publishing order being edited, the lifecycle tab and
 * search that pick the visible rows, and the requests that change them.
 */
export class BannerQueue {
  records: ManagementRecord[] = $state.raw([]);
  orderUuids: string[] = $state.raw([]);
  savedOrderUuids: string[] = $state.raw([]);
  loading = $state(true);
  failed = $state(false);
  tab: LifecycleTab = $state('orderable');
  search = $state('');
  savingOrder = $state(false);
  disablingUuid: string | null = $state(null);
  archivingUuid: string | null = $state(null);

  readonly orderDirty = $derived(this.orderUuids.join() !== this.savedOrderUuids.join());
  readonly actionLabels = $derived(bannerActionLabels(this.records));
  readonly counts = $derived(lifecycleTabCounts(this.records));
  readonly broadOverlapCount = $derived(broadBannerOverlapCount(this.#list));
  readonly visible = $derived(visibleBannerRecords(this.#list, this.tab, this.search));
  /** The order can be edited only on the orderable tab without a search. */
  readonly ordering = $derived(this.tab === 'orderable' && !this.search.trim());

  get #list(): BannerListState {
    return {
      records: this.records,
      orderUuids: this.orderUuids,
      savedOrderUuids: this.savedOrderUuids,
    };
  }

  #apply(next: BannerListState) {
    this.records = next.records;
    this.orderUuids = next.orderUuids;
    this.savedOrderUuids = next.savedOrderUuids;
  }

  async load() {
    try {
      this.#apply(initialBannerListState(await getManagedBanners()));
    } catch {
      this.failed = true;
    } finally {
      this.loading = false;
    }
  }

  /** Resolves the disabled banner, or undefined if it was skipped or failed (with a toast). */
  async disable(uuid: string): Promise<ManagedBanner | undefined> {
    if (this.savingOrder || this.disablingUuid) return;
    this.disablingUuid = uuid;
    try {
      const disabled = await disableBanner(uuid);
      this.#apply(reconcileBannerDisabled(this.#list, disabled));
      toaster.success({ title: 'Banner disabled' });
      return disabled;
    } catch {
      toaster.error({
        title: 'Banner could not be disabled',
        description: 'The banner is unchanged. Check your connection and try again.',
      });
    } finally {
      this.disablingUuid = null;
    }
  }

  /** Resolves the archived banner's uuid, or undefined if it was skipped or failed (with a toast). */
  async archive(uuid: string): Promise<string | undefined> {
    if (this.savingOrder || this.archivingUuid) return;
    this.archivingUuid = uuid;
    try {
      const archived = await archiveBanner(uuid);
      this.#apply(reconcileBannerArchived(this.#list, archived.uuid));
      toaster.success({ title: 'Banner archived' });
      return archived.uuid;
    } catch {
      toaster.error({
        title: 'Banner could not be archived',
        description: 'The banner is unchanged. Check your connection and try again.',
      });
    } finally {
      this.archivingUuid = null;
    }
  }

  async saveOrder() {
    if (this.savingOrder || this.disablingUuid || this.archivingUuid) return;
    this.savingOrder = true;
    try {
      const authoritative = await reorderBanners(this.orderUuids);
      this.#apply(adoptCanonicalBannerOrder(this.#list, authoritative));
      try {
        this.#apply(initialBannerListState(await getManagedBanners()));
      } catch {
        // The reorder already committed. Keep its canonical response instead of reporting a false mutation failure.
      }
      toaster.success({ title: 'Banner order saved' });
    } catch {
      toaster.error({
        title: 'Banner order could not be saved',
        description: 'The order was not saved. Review the current queue and try again.',
      });
    } finally {
      this.savingOrder = false;
    }
  }

  discardOrderChanges() {
    this.orderUuids = [...this.savedOrderUuids];
  }

  /** Moves a banner to the position another one holds. Returns false when either isn't in the order. */
  move(uuid: string, toUuid: string): boolean {
    const from = this.orderUuids.indexOf(uuid);
    const to = this.orderUuids.indexOf(toUuid);
    if (from < 0 || to < 0) return false;
    const next = [...this.orderUuids];
    next.splice(to, 0, ...next.splice(from, 1));
    this.orderUuids = next;
    return true;
  }

  /**
   * Takes in a banner the editor saved, published or restored (replacing `sourceUuid`, the
   * banner a restore copied), and shows the tab it now belongs to with the search cleared.
   */
  adopt(banner: ManagedBanner, sourceUuid: string | null = null) {
    this.#apply(reconcileBannerSuccess(this.#list, banner, sourceUuid));
    this.tab = lifecycleTabFor(banner.lifecycle);
    this.search = '';
  }
}
