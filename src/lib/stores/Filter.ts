import { get, derived, writable, type Readable, type Writable } from 'svelte/store';
import { genericUUID } from '$lib/utilities/UUID';

import { browser } from '$app/environment';
import { config } from '$lib/configuration.svelte';

import {
  type Filter,
  type FilterInterface,
  type FilterGroupInterface,
  createFilterGroup,
} from '$lib/models/Filter';
import type { SearchResult } from '$lib/models/Search';
import type { OperatorType } from '$lib/models/query/Query';
import { Tree, type TreeNode } from '$lib/models/Tree';
import { user } from '$lib/stores/User';
import { objectUUID } from '$lib/utilities/UUID';

const genomicFilterTypes = ['snp', 'genomic'];

const createGroup = (nodes: TreeNode<FilterInterface>[], operator: OperatorType) =>
  createFilterGroup(nodes as FilterInterface[], operator);

export const genomicFilters: Writable<Filter[]> = writable(restoreGenomicFilters());
export const filterTree: Writable<Tree<FilterInterface>> = writable(restoreFilterTree());

export const filters: Readable<Filter[]> = derived(
  filterTree,
  ($tree) => $tree.leafNodes as Filter[],
);

export const hasGenomicFilter: Readable<boolean> = derived(genomicFilters, ($f) =>
  $f && $f.length > 0 ? $f.some((filter) => filter.filterType === 'genomic') : false,
);

export const hasUnallowedFilter: Readable<boolean> = derived(filters, ($f) =>
  $f && $f.length > 0 ? $f.some((filter) => !filter.allowFiltering) : false,
);

export const hasInvalidFilter: Readable<boolean> = derived([user, filters], ([$user, $filters]) => {
  if ($filters.length === 0 || !$user?.queryScopes) return false;

  return $filters.some((filter) => {
    let filterDataset = filter.dataset || '';
    if (genomicFilterTypes.includes(filter.filterType)) {
      filterDataset = 'Gene_with_variant';
    }

    const isValidFilter = $user?.queryScopes?.some((scope) => {
      const isMatch = filterDataset.length > 0 && scope.includes(filterDataset);
      return isMatch;
    });

    return !isValidFilter;
  });
});

export const hasOrGroup: Readable<boolean> = derived(filterTree, ($ft) => $ft.hasOr);

// modal data
export const activeFilter: Writable<Filter | undefined> = writable();
export const activeSearch: Writable<SearchResult | undefined> = writable();
export const filterWarning: Writable<string | undefined> = writable();

filterTree.subscribe((tree: Tree<FilterInterface>) => {
  if (browser) {
    sessionStorage.setItem('filterTree', tree.serialized);
  }
});

genomicFilters.subscribe((filters: Filter[]) => {
  if (browser) {
    sessionStorage.setItem('genomicFilters', JSON.stringify(filters));
  }
});

function restoreGenomicFilters(): Filter[] {
  if (browser && sessionStorage.getItem('genomicFilters')) {
    const oldFilters: Filter[] = JSON.parse(sessionStorage.getItem('genomicFilters') || '[]');
    return oldFilters.map((filter) => ({ ...filter, uuid: objectUUID(filter) }));
  }
  return [];
}

function restoreFilterTree(): Tree<FilterInterface> {
  const newTree = new Tree(createGroup);
  if (browser && sessionStorage.getItem('filterTree')) {
    const serializedTree = sessionStorage.getItem('filterTree');
    if (!serializedTree) return newTree;
    const oldTree = Tree.deserialize<FilterInterface>(serializedTree, createGroup);
    return oldTree;
  }
  return newTree;
}

export function toggleOperator(siblingA: FilterInterface, siblingB: FilterInterface) {
  if (!config.features.explorer.enableOrQueries) return;
  const tree = get(filterTree);
  tree.toggleOperator(siblingA, siblingB);
  (tree.root as FilterGroupInterface).uuid = genericUUID();
  filterTree.set(tree);
}

export function addFilter(filter: Filter) {
  if ('filterType' in filter && genomicFilterTypes.includes(filter.filterType)) {
    const geneFilters = get(genomicFilters).filter((f) => f.id !== filter.id);
    filter.uuid = objectUUID(filter);
    geneFilters.push(filter);
    genomicFilters.set(geneFilters);
  } else {
    const tree = get(filterTree);
    const oldNode = tree.find((node) => 'id' in node && node.id === filter.id);
    if (oldNode) {
      tree.update(oldNode, filter);
    } else {
      tree.add(filter);
    }
    (tree.root as FilterGroupInterface).uuid = genericUUID();
    filterTree.set(tree);
  }
}

export function removeFilter(removeUuid: string) {
  const isFilter = (filter: Filter) => 'uuid' in filter && filter.uuid === removeUuid;
  const geneFilters = get(genomicFilters);
  const oldGeneNode = geneFilters.find(isFilter);
  if (oldGeneNode) {
    genomicFilters.set(geneFilters.filter((node) => !isFilter(node)));
    return;
  }
  const tree = get(filterTree);
  const oldTreeNode = tree.find((node) => isFilter(node as Filter));
  if (!oldTreeNode) return;
  tree.remove(oldTreeNode);
  (tree.root as FilterGroupInterface).uuid = genericUUID();
  filterTree.set(tree);
}

export function removeGenomicFilters() {
  genomicFilters.set([]);
}

export function removeUnallowedFilters() {
  const isUnallowed = (node: Filter) => !node.allowFiltering;
  const geneFilters = get(genomicFilters);
  genomicFilters.set(geneFilters.filter((node) => !isUnallowed(node)));

  const tree = get(filterTree);
  const remove = tree.leafNodes.filter((node) => isUnallowed(node as Filter));
  tree.remove(...remove);
  (tree.root as FilterGroupInterface).uuid = genericUUID();
  filterTree.set(tree);
}

export function removeInvalidFilters(): void {
  const currentUser = get(user);
  const currentFilters = get(filters);

  if (!currentUser || currentFilters.length === 0) return;

  const match = (filter: Filter) => {
    let filterDataset = filter.dataset || '';
    if (genomicFilterTypes.includes(filter.filterType)) {
      filterDataset = 'Gene_with_variant';
    }

    const isValidFilter = currentUser.queryScopes?.some((scope) => {
      const isMatch = filterDataset.length > 0 && scope.includes(filterDataset);
      return isMatch;
    });

    return isValidFilter;
  };

  const geneFilters = get(genomicFilters);
  genomicFilters.set(geneFilters.filter((node) => match(node)));

  const tree = get(filterTree);
  const remove = tree.leafNodes.filter((node) => !match(node as Filter));
  tree.remove(...remove);
  (tree.root as FilterGroupInterface).uuid = genericUUID();
  filterTree.set(tree);
}

export function clearFilters() {
  genomicFilters.set([]);
  const tree = get(filterTree);
  tree.root.children = [];
  (tree.root as FilterGroupInterface).uuid = genericUUID();
  filterTree.set(tree);
}

export function getFilter(uuid: string) {
  return [...get(filters), ...get(genomicFilters)].find((f) => f.uuid === uuid);
}

export function getFilterById(id: string) {
  return [...get(filters), ...get(genomicFilters)].find((f) => f.id === id);
}

export function getFiltersByType(type: string) {
  return [...get(filters), ...get(genomicFilters)].filter((f) => f.filterType === type);
}
