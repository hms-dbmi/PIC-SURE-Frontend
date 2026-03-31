import { get, derived, writable, type Readable, type Writable } from 'svelte/store';
import { genericUUID } from '$lib/utilities/UUID';

import { browser } from '$app/environment';

import {
  type Filter,
  type FilterInterface,
  type FilterGroupInterface,
  createFilterGroup,
} from '$lib/models/Filter';
import type { SearchResult } from '$lib/models/Search';
import { Operator, type OperatorType } from '$lib/models/query/Query';
import { Tree, type TreeNode } from '$lib/models/Tree';
import { user } from '$lib/stores/User';
import { objectUUID } from '$lib/utilities/UUID';
import { log, createLog, registerAssociatedStudies, getPageContext } from '$lib/logger';

const genomicFilterTypes = ['snp', 'genomic'];

const createGroup = (nodes: TreeNode<FilterInterface>[], operator: OperatorType) =>
  createFilterGroup(nodes as FilterInterface[], operator);

export const genomicFilters: Writable<Filter[]> = writable(restoreGenomicFilters());
export const filterTree: Writable<Tree<FilterInterface>> = writable(restoreFilterTree());

export const filters: Readable<Filter[]> = derived(
  filterTree,
  ($tree) => $tree.leafNodes as Filter[],
);

export const associatedStudies: Readable<string[]> = derived(filters, ($f) => {
  const studies = new Set<string>();
  for (const filter of $f) {
    if (filter.dataset) studies.add(filter.dataset);
  }
  return [...studies];
});
registerAssociatedStudies(associatedStudies);

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

function restoreAdvancedFiltering(): boolean {
  if (browser && sessionStorage.getItem('advancedFiltering') !== null) {
    return sessionStorage.getItem('advancedFiltering') === 'true';
  }
  return false;
}

export const advancedFilteringEnabled: Writable<boolean> = writable(restoreAdvancedFiltering());

advancedFilteringEnabled.subscribe((enabled: boolean) => {
  if (browser) {
    sessionStorage.setItem('advancedFiltering', String(enabled));
  }
});

export function disableAdvancedFiltering() {
  const tree = get(filterTree);

  const flattenOrGroups = (node: TreeNode<FilterInterface>): void => {
    if (tree.isGroup(node)) {
      node.children.forEach(flattenOrGroups);

      if (node.operator === Operator.OR && node.parent) {
        const children = [...node.children];

        if (children.length === 2) {
          tree.toggleOperator(children[0], children[1]);
        } else if (children.length > 2) {
          const parent = node.parent;
          const nodeIndex = parent.children.indexOf(node);

          children.forEach((child) => {
            child.parent = parent;
          });

          parent.children.splice(nodeIndex, 1, ...children);
        }
      }
    }
  };

  flattenOrGroups(tree.root);
  tree.pruneTree();
  (tree.root as FilterGroupInterface).uuid = genericUUID();
  filterTree.set(tree);
}

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
  if (!get(advancedFilteringEnabled)) return;
  const tree = get(filterTree);
  tree.toggleOperator(siblingA, siblingB);
  (tree.root as FilterGroupInterface).uuid = genericUUID();
  filterTree.set(tree);
}

export function addFilter(filter: Filter) {
  const isUpdate = 'id' in filter && [...get(filters), ...get(genomicFilters)].some((f) => f.id === filter.id);

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

  log(
    createLog('FILTER', isUpdate ? 'filter.update' : 'filter.add', {
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

export function removeFilter(removeUuid: string) {
  const isFilter = (filter: Filter) => 'uuid' in filter && filter.uuid === removeUuid;
  const geneFilters = get(genomicFilters);
  const oldGeneNode = geneFilters.find(isFilter);
  if (oldGeneNode) {
    genomicFilters.set(geneFilters.filter((node) => !isFilter(node)));
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
  const tree = get(filterTree);
  const oldTreeNode = tree.find((node) => isFilter(node as Filter));
  if (!oldTreeNode) return;
  const removed = oldTreeNode as Filter;
  tree.remove(oldTreeNode);
  (tree.root as FilterGroupInterface).uuid = genericUUID();
  filterTree.set(tree);
  log(
    createLog('FILTER', 'filter.remove', {
      filterType: removed.filterType,
      variable: removed.variableName,
      dataset: removed.dataset,
      pageContext: getPageContext(),
    }),
  );
}

export function removeGenomicFilters() {
  const count = get(genomicFilters).length;
  genomicFilters.set([]);
  if (count > 0) log(createLog('FILTER', 'filter.remove_genomic', { count }));
}

export function removeUnallowedFilters() {
  const isUnallowed = (node: Filter) => !node.allowFiltering;
  const geneFilters = get(genomicFilters);
  const removedGeneCount = geneFilters.filter((node) => isUnallowed(node)).length;
  genomicFilters.set(geneFilters.filter((node) => !isUnallowed(node)));

  const tree = get(filterTree);
  const remove = tree.leafNodes.filter((node) => isUnallowed(node as Filter));
  const removedTreeCount = remove.length;
  tree.remove(...remove);
  (tree.root as FilterGroupInterface).uuid = genericUUID();
  filterTree.set(tree);

  const count = removedGeneCount + removedTreeCount;
  if (count > 0) log(createLog('FILTER', 'filter.remove_unallowed', { count }));
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
  const removedGeneCount = geneFilters.filter((node) => !match(node)).length;
  genomicFilters.set(geneFilters.filter((node) => match(node)));

  const tree = get(filterTree);
  const remove = tree.leafNodes.filter((node) => !match(node as Filter));
  const removedTreeCount = remove.length;
  tree.remove(...remove);
  (tree.root as FilterGroupInterface).uuid = genericUUID();
  filterTree.set(tree);

  const removedCount = removedGeneCount + removedTreeCount;
  if (removedCount > 0) log(createLog('FILTER', 'filter.remove_invalid', { count: removedCount }));
}

export function clearFilters() {
  const count = get(filters).length + get(genomicFilters).length;
  genomicFilters.set([]);
  const tree = get(filterTree);
  tree.root.children = [];
  (tree.root as FilterGroupInterface).uuid = genericUUID();
  filterTree.set(tree);
  if (count > 0) log(createLog('FILTER', 'filter.clear', { count, pageContext: getPageContext() }));
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
