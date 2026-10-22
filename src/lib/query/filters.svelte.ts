import { untrack } from 'svelte';
import { objectUUID } from '#lib/utils/uuid.ts';
import { assertNoSsrWrite } from '#lib/utils/ssrWrite.ts';

import { browser } from '$app/env';
import { session } from '#lib/auth/session.svelte.ts';
import { getConceptDetails } from '#lib/explorer/Dictionary.ts';
import {
  log,
  createLog,
  registerAssociatedStudies,
  getPageContext,
} from '#lib/telemetry/logger.ts';

import { type Filter, type FilterInterface, createFilterGroup } from '#lib/query/filter.svelte.ts';
import { LogicTree } from '#lib/query/logicTree.svelte.ts';
import { toQueryFilters, type QueryFilters } from '#lib/query/build.ts';

const genomicFilterTypes = ['snp', 'genomic'];

export type FilterWarningKind = 'stigmatizing' | 'notAuthorized';

function isGenomic(filter: Filter): boolean {
  return 'filterType' in filter && genomicFilterTypes.includes(filter.filterType);
}

function hasConsentForFilter(filter: Filter, consents: string[]): boolean {
  let filterDataset = filter.dataset || '';
  if (genomicFilterTypes.includes(filter.filterType)) {
    filterDataset = 'Gene_with_variant';
  }

  return filterDataset.length > 0 && consents.some((consent) => consent.includes(filterDataset));
}

function emptyTree(): LogicTree<FilterInterface> {
  return new LogicTree<FilterInterface>(createFilterGroup);
}

function restoreFilterTree(): LogicTree<FilterInterface> {
  const serialized = browser ? sessionStorage.getItem('filterTree') : null;
  return serialized
    ? LogicTree.deserialize<FilterInterface>(serialized, createFilterGroup)
    : emptyTree();
}

function restoreGenomicFilters(): Filter[] {
  const serialized = browser ? sessionStorage.getItem('genomicFilters') : null;
  if (!serialized) return [];
  const saved: Filter[] = JSON.parse(serialized);
  return saved.map((filter) => ({ ...filter, uuid: objectUUID(filter) }));
}

/**
 * The explorer's active filters: the phenotypic logic tree and the genomic filters beside it.
 * Both persist to sessionStorage (`filterTree`, `genomicFilters`) on every change, so a reload
 * or a saved session restores them.
 */
export class FilterState {
  #tree = $state.raw(restoreFilterTree());
  #genomic: Filter[] = $state(restoreGenomicFilters());

  #warning: FilterWarningKind | undefined = $state();
  #discarding = false;

  #phenotypic = $derived(this.#tree.leafNodes as Filter[]);
  #all = $derived([...this.#phenotypic, ...this.#genomic]);
  #queryFilters = $derived(
    $state.snapshot(toQueryFilters(this.#tree, this.#genomic)) as QueryFilters,
  );

  /** The dialog FilterWarning shows. */
  get warning(): FilterWarningKind | undefined {
    return this.#warning;
  }
  set warning(kind: FilterWarningKind | undefined) {
    assertNoSsrWrite('filters');
    this.#warning = kind;
  }

  get tree(): LogicTree<FilterInterface> {
    return this.#tree;
  }
  get phenotypic(): Filter[] {
    return this.#phenotypic;
  }
  get genomic(): Filter[] {
    return this.#genomic;
  }
  get all(): Filter[] {
    return this.#all;
  }
  /** Plain clauses for `buildRequest`, free of `$state` proxies. */
  get queryFilters(): QueryFilters {
    return this.#queryFilters;
  }

  get associatedStudies(): string[] {
    const datasets = this.#phenotypic.map((filter) => filter.dataset);
    return datasets.filter((dataset, index) => dataset && datasets.indexOf(dataset) === index);
  }

  /** Gene filters only; SNP filters don't show the Variant Explorer. */
  get hasGenomicFilter(): boolean {
    return this.#genomic.some((filter) => filter.filterType === 'genomic');
  }

  /** Gene or SNP filters: what Discover can't query and `removeGenomic()` removes. */
  get hasGenomicOrSnpFilter(): boolean {
    return this.#genomic.length > 0;
  }

  get hasUnallowedFilter(): boolean {
    return this.#phenotypic.some((filter) => !filter.allowFiltering);
  }

  /** True when a filter's study isn't among the user's consents (false until they load). */
  get hasInvalidFilter(): boolean {
    const consents = session.user?.consents?.['\\_consents\\'];
    if (this.#all.length === 0 || !consents) return false;

    return this.#all.some((filter) => !hasConsentForFilter(filter, consents));
  }

  byType(type: string): Filter[] {
    return this.#all.filter((f) => f.filterType === type);
  }

  add(filter: Filter) {
    assertNoSsrWrite('filters');
    if (isGenomic(filter)) {
      filter.uuid = objectUUID(filter);
      this.#genomic = [...this.#genomic.filter((f) => f.id !== filter.id), filter];
      log(
        createLog('FILTER', 'filter.add', {
          filterType: filter.filterType,
          displayType: filter.displayType,
          variable: filter.variableName,
          dataset: filter.dataset,
          pageContext: getPageContext(),
        }),
      );
    } else {
      this.#tree.add(filter);
      log(
        createLog('FILTER', 'filter.add', {
          filterType: filter.filterType,
          displayType: filter.displayType,
          variable: filter.variableName,
          dataset: filter.dataset,
          valueCount: 'categoryValues' in filter ? filter.categoryValues?.length : undefined,
          min: 'min' in filter ? filter.min : undefined,
          max: 'max' in filter ? filter.max : undefined,
          pageContext: getPageContext(),
        }),
      );
    }
    this.#persist();
  }

  update(existingUuid: string, filter: Filter) {
    assertNoSsrWrite('filters');
    if (isGenomic(filter)) {
      const index = this.#genomic.findIndex((f) => f.uuid === existingUuid);
      if (index === -1) return;
      filter.uuid = objectUUID(filter);
      this.#genomic[index] = filter;
    } else {
      const oldNode = this.#tree.find((node) => node.uuid === existingUuid);
      if (!oldNode) return;
      filter.uuid = existingUuid;
      this.#tree.update(oldNode, filter);
    }
    this.#persist();
  }

  /** Fills in the study and table labels of a filter added from a search result without them. */
  enrich(filter: Filter, conceptPath: string, dataset: string): void {
    if (!filter.searchResult || filter.searchResult.table || !conceptPath || !dataset) return;
    getConceptDetails(conceptPath, dataset)
      .then((detail) => {
        // The tree holds its own proxy of the filter, so patch the node it stores.
        const node = this.#tree.find((n) => n.uuid === filter.uuid);
        if (!node?.searchResult) return;
        node.searchResult.table = detail.table;
        node.searchResult.study = detail.study;
        this.#persist();
      })
      .catch((error) => console.error('Failed to enrich filter details', error));
  }

  remove(removeUuid: string) {
    assertNoSsrWrite('filters');
    const oldGeneNode = this.#genomic.find((filter) => filter.uuid === removeUuid);
    if (oldGeneNode) {
      this.#genomic = this.#genomic.filter((filter) => filter.uuid !== removeUuid);
      this.#persist();
      log(
        createLog('FILTER', 'filter.remove', {
          filterType: oldGeneNode.filterType,
          variable: oldGeneNode.variableName,
          dataset: oldGeneNode.dataset,
          pageContext: getPageContext(),
        }),
      );
      return;
    }
    const removed = this.#tree.find((node) => node.uuid === removeUuid) as Filter | undefined;
    if (!removed) return;
    this.#tree.remove(removed);
    this.#persist();
    log(
      createLog('FILTER', 'filter.remove', {
        filterType: removed.filterType,
        variable: removed.variableName,
        dataset: removed.dataset,
        pageContext: getPageContext(),
      }),
    );
  }

  removeGenomic() {
    assertNoSsrWrite('filters');
    const count = this.#genomic.length;
    this.#genomic = [];
    this.#persist();
    if (count > 0) log(createLog('FILTER', 'filter.remove_genomic', { count }));
  }

  removeUnallowed() {
    assertNoSsrWrite('filters');
    const count = this.#removeWhere((filter) => !filter.allowFiltering);
    if (count > 0) log(createLog('FILTER', 'filter.remove_unallowed', { count }));
  }

  async removeInvalid(): Promise<void> {
    assertNoSsrWrite('filters');
    if (this.#all.length === 0) return;

    const consentsMap = await session.ensureConsentsLoaded();
    const consents = consentsMap?.['\\_consents\\'];
    if (!consents) return;

    const count = this.#removeWhere((filter) => !hasConsentForFilter(filter, consents));
    if (count > 0) log(createLog('FILTER', 'filter.remove_invalid', { count }));
  }

  clear() {
    assertNoSsrWrite('filters');
    const count = this.#all.length;
    this.#empty();
    if (count > 0)
      log(createLog('FILTER', 'filter.clear', { count, pageContext: getPageContext() }));
  }

  /**
   * The filters asked for data the user was refused, and a logout is under way: removes them from
   * storage now, so neither a reload nor the next login brings them back, and stores no change
   * until `reset()`. The filters stay until then, or the page being left would rerun its count.
   */
  discardStored() {
    assertNoSsrWrite('filters');
    this.#discarding = true;
    sessionStorage.removeItem('filterTree');
    sessionStorage.removeItem('genomicFilters');
  }

  /** Removes every filter without logging a user clear, and stores changes again. */
  reset() {
    assertNoSsrWrite('filters');
    this.#discarding = false;
    this.#empty();
  }

  setTree(tree: LogicTree<FilterInterface>) {
    assertNoSsrWrite('filters');
    this.#tree = tree;
    this.#persist();
  }

  /** Replaces every filter. */
  restore(tree: LogicTree<FilterInterface>, genomic: Filter[]) {
    assertNoSsrWrite('filters');
    this.#tree = tree;
    this.#genomic = genomic;
    this.#persist();
  }

  #empty() {
    this.#genomic = [];
    this.#tree.root.children = [];
    this.#persist();
  }

  /** Removes matching filters from both lists and returns how many went. */
  #removeWhere(matches: (filter: Filter) => boolean): number {
    const genomicCount = this.#genomic.filter(matches).length;
    this.#genomic = this.#genomic.filter((filter) => !matches(filter));
    const remove = this.#phenotypic.filter(matches);
    this.#tree.remove(...remove);
    this.#persist();
    return genomicCount + remove.length;
  }

  #persist() {
    if (!browser || this.#discarding) return;
    sessionStorage.setItem('filterTree', this.#tree.serialized);
    sessionStorage.setItem('genomicFilters', JSON.stringify($state.snapshot(this.#genomic)));
  }
}

export const filterState = new FilterState();
session.onAccessDenied(() => {
  filterState.discardStored();
  return () => filterState.reset();
});
registerAssociatedStudies(() => untrack(() => filterState.associatedStudies));
