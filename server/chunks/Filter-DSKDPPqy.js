import { w as writable, l as get, o as derived } from './utils-D3IkxnGP.js';
import * as uuid from 'uuid';
import { u as user } from './User-CeJunCPd.js';

uuid.v4();
function genericUUID() {
  return uuid.v4();
}
class QueryV2 {
  categoryFilters;
  numericFilters;
  requiredFields;
  anyRecordOf;
  anyRecordOfMulti;
  fields;
  crossCountFields;
  variantInfoFilters;
  expectedResultType;
  constructor(newQuery) {
    this.categoryFilters = newQuery?.categoryFilters || {};
    this.numericFilters = newQuery?.numericFilters || {};
    this.requiredFields = newQuery?.requiredFields || [];
    this.anyRecordOf = newQuery?.anyRecordOf || [];
    this.anyRecordOfMulti = newQuery?.anyRecordOfMulti || [];
    this.crossCountFields = newQuery?.crossCountFields || [];
    this.fields = newQuery?.fields || [];
    const variantInfoFilter = newQuery?.variantInfoFilters?.[0] || {
      categoryVariantInfoFilters: {},
      numericVariantInfoFilters: {}
    };
    this.variantInfoFilters = [variantInfoFilter];
    this.expectedResultType = newQuery?.expectedResultType || "COUNT";
  }
  addCategoryFilter(key, value) {
    this.categoryFilters[key] = value;
  }
  removeCategoryFilter(key) {
    delete this.categoryFilters[key];
  }
  addNumericFilter(key, min, max) {
    this.numericFilters[key] = {
      min: min.toString(),
      max: max.toString()
    };
  }
  addCategoryVariantInfoFilters(filter) {
    this.variantInfoFilters[0].categoryVariantInfoFilters = {
      Gene_with_variant: filter.Gene_with_variant,
      Variant_consequence_calculated: filter.Variant_consequence_calculated,
      Variant_frequency_as_text: filter.Variant_frequency_as_text
    };
  }
  addAnyRecordOfMulti(field) {
    this.anyRecordOfMulti.push(field);
  }
  setCrossCountFields(fields) {
    this.crossCountFields = fields;
  }
  addSnpFilter(snps) {
    snps.forEach((snp) => {
      {
        this.categoryFilters[snp.search] = snp.constraint.split(",");
      }
    });
  }
  addRequiredField(field) {
    if (!this.requiredFields.includes(field)) {
      this.requiredFields.push(field);
    }
  }
  addField(field) {
    if (!this.fields.includes(field)) {
      this.fields.push(field);
    }
  }
  addAnyRecordOf(field) {
    if (!this.anyRecordOf.includes(field)) {
      this.anyRecordOf.push(field);
    }
  }
  hasGenomicFilter() {
    const Gene_with_variant = this.variantInfoFilters[0]?.categoryVariantInfoFilters?.Gene_with_variant?.length || 0;
    const Variant_consequence_calculated = this.variantInfoFilters[0]?.categoryVariantInfoFilters?.Variant_consequence_calculated?.length || 0;
    const Variant_frequency_as_text = this.variantInfoFilters[0]?.categoryVariantInfoFilters?.Variant_frequency_as_text?.length || 0;
    return Gene_with_variant + Variant_consequence_calculated + Variant_frequency_as_text;
  }
  hasFilter() {
    return Object.keys(this.categoryFilters).length + Object.keys(this.numericFilters).length + this.hasGenomicFilter() + this.requiredFields.length + this.anyRecordOf.length;
  }
}
const Operator = {
  AND: "AND",
  OR: "OR"
};
class QueryV3 {
  select;
  authorizationFilters;
  phenotypicClause;
  genomicFilters;
  expectedResultType;
  picsureId;
  id;
  constructor(newQuery) {
    this.select = newQuery?.select || [];
    this.authorizationFilters = newQuery?.authorizationFilters || [];
    this.phenotypicClause = newQuery?.phenotypicClause || null;
    this.genomicFilters = newQuery?.genomicFilters || [];
    this.expectedResultType = newQuery?.expectedResultType || "COUNT";
    this.picsureId = newQuery?.picsureId || null;
    this.id = newQuery?.id || null;
  }
}
function createFilterGroup(children = [], operator = Operator.AND) {
  const id = genericUUID();
  const newGroup = {
    filterType: "FilterGroup",
    displayType: "group",
    variableName: "none",
    dataset: "",
    allowFiltering: true,
    uuid: id,
    children,
    operator,
    parent: void 0,
    get id() {
      return `filter-group-${this.uuid}`;
    }
  };
  children.forEach((child) => child.parent = newGroup);
  return newGroup;
}
class Tree {
  root;
  createGroup;
  constructor(createGroup2) {
    this.root = createGroup2([], Operator.AND);
    this.createGroup = createGroup2;
  }
  get hasOr() {
    const hasORChild = (node) => {
      if (this.isGroup(node)) {
        if (node.operator === Operator.OR) return true;
        return node.children.some(hasORChild);
      }
      return false;
    };
    return hasORChild(this.root);
  }
  isGroup(node) {
    return node && "children" in node;
  }
  add(...nodes) {
    nodes.forEach((node) => {
      node.parent = this.root;
      this.root.children.push(node);
    });
  }
  remove(...toRemove) {
    toRemove.forEach((node) => {
      if (node.parent === void 0) return;
      node.parent.children = node.parent.children.filter((child) => child !== node);
    });
    this.pruneTree();
  }
  update(oldNode, newNode) {
    const parent = oldNode.parent;
    this.transferChildrenIfGroups(oldNode, newNode);
    newNode.parent = parent;
    if (parent === void 0) {
      if (!this.isGroup(newNode)) {
        throw new Error("Root must be a TreeGroup");
      }
      this.root = newNode;
      return;
    }
    const index = parent.children.indexOf(oldNode);
    if (index === -1) return;
    parent.children[index] = newNode;
  }
  // Prune nodes with less than 2 children,
  // move children with no siblings to their grandparent and remove empty groups
  pruneTree() {
    const mutateIfIsolatedOrEmpty = (node) => {
      if (this.isGroup(node)) {
        node.children.forEach(mutateIfIsolatedOrEmpty);
        if (node.children.length === 1) {
          this.moveChildToGrandparent(node.children[0]);
        }
        if (node.children.length === 0 && node.parent) {
          node.parent.children = node.parent.children.filter((child) => child !== node);
        }
      }
    };
    this.root.children.forEach(mutateIfIsolatedOrEmpty);
  }
  transferChildrenIfGroups(oldNode, newNode) {
    if (!this.isGroup(oldNode) || !this.isGroup(newNode)) return;
    if (newNode.children.length === 0) {
      newNode.children = oldNode.children;
      newNode.children.forEach((child) => child.parent = newNode);
    }
  }
  moveChildToGrandparent(childNode) {
    if (childNode.parent === void 0 || childNode.parent.parent === void 0) {
      return;
    }
    const siblingCount = childNode.parent.children.length;
    const indexOfChildGroup = childNode.parent.parent.children.indexOf(childNode.parent);
    if (indexOfChildGroup < 0) {
      throw new Error("Tree structure is malformed: parent not found in grandparent's children");
    }
    childNode.parent.children = childNode.parent.children.filter((child) => child !== childNode);
    childNode.parent.parent.children.splice(
      indexOfChildGroup,
      siblingCount === 1 ? 1 : 0,
      childNode
    );
    childNode.parent = childNode.parent.parent;
  }
  newOrGroup(sibA, sibB) {
    if (sibA.parent === void 0 || sibB.parent === void 0) return;
    if (sibA.parent !== sibB.parent) return;
    const parent = sibA.parent;
    const newOrGroup = this.createGroup([sibA, sibB], Operator.OR);
    const aIndex = parent.children.indexOf(sibA);
    const bIndex = parent.children.indexOf(sibB);
    parent.children.splice(Math.max(aIndex, bIndex), 1);
    parent.children.splice(Math.min(aIndex, bIndex), 1, newOrGroup);
    newOrGroup.parent = parent;
    sibA.parent = newOrGroup;
    sibB.parent = newOrGroup;
  }
  splitOrCollapseOrGroup(sibA, sibB) {
    if (sibA.parent === void 0 || sibB.parent === void 0) return;
    if (sibA.parent.children.length === 2) {
      this.moveChildToGrandparent(sibA);
      this.moveChildToGrandparent(sibB);
    } else if (sibA.parent.children.length > 2) {
      const aIndex = sibA.parent.children.indexOf(sibA);
      const bIndex = sibB.parent.children.indexOf(sibB);
      const secondGroupChildren = sibB.parent.children.slice(bIndex);
      const secondGroup = this.createGroup(secondGroupChildren, Operator.OR);
      secondGroupChildren.forEach((child) => child.parent = secondGroup);
      if (sibA.parent.parent) {
        const newIndex = sibA.parent.parent.children.indexOf(sibA.parent);
        sibA.parent.parent.children.splice(newIndex + 1, 0, secondGroup);
        sibA.parent.children = sibA.parent.children.slice(0, aIndex + 1);
      }
      secondGroup.parent = sibA.parent.parent;
    }
  }
  mergeOrGroups(sibA, sibB) {
    if (sibA.parent === void 0 || sibB.parent === void 0) return;
    if (sibA.parent !== sibB.parent) return;
    sibA.children.push(...sibB.children || []);
    sibB.children.forEach((child) => child.parent = sibA);
    const parent = sibA.parent;
    const bIndex = parent.children.indexOf(sibB);
    if (bIndex >= 0) {
      parent.children.splice(bIndex, 1);
    }
  }
  mergeNodeIntoOrGroup(sibA, sibB) {
    const [orGroup, andNode] = this.isGroup(sibA) ? [sibA, sibB] : [sibB, sibA];
    if (andNode.parent === void 0 || orGroup.parent === void 0) return;
    const andNodeIndex = andNode.parent.children.indexOf(andNode);
    const orGroupIndex = andNode.parent.children.indexOf(orGroup);
    const index = andNodeIndex > orGroupIndex ? orGroup.children.length : 0;
    orGroup.children.splice(index, 0, andNode);
    andNode.parent.children = andNode.parent.children.filter((child) => child !== andNode);
    andNode.parent = orGroup;
  }
  reorderNodes(sibA, sibB) {
    if (!sibA || !sibB) throw new Error("Invalid nodes");
    if (sibA.parent === void 0 || sibB.parent === void 0) throw new Error("Invalid parents");
    const parent = sibA.parent;
    const aIndex = parent.children.findIndex(
      (child) => "uuid" in child && child.uuid === sibA.uuid
    );
    const bIndex = parent.children.findIndex(
      (child) => "uuid" in child && child.uuid === sibB.uuid
    );
    if (aIndex === -1 || bIndex === -1) return;
    parent.children.splice(aIndex, 1);
    parent.children.splice(bIndex, 0, sibA);
    sibA.parent = parent;
    sibB.parent = parent;
  }
  addNodeToGroup(node, group) {
    node.parent?.children.splice(node.parent?.children.indexOf(node) ?? -1, 1);
    node.parent = group;
    group.children.push(node);
    this.pruneTree();
  }
  // Swaps the AND/OR grouping of two adjacent siblings
  // You'll notice, we don't really need to know the intended operator
  // because we can infer where siblings should go based on parent operators
  toggleOperator(sibA, sibB) {
    if (sibA.parent === void 0 || sibB.parent === void 0) return;
    if (sibA.parent !== sibB.parent) return;
    if (!this.isGroup(sibA) && !this.isGroup(sibB)) {
      if (sibA.parent.operator === Operator.AND) {
        this.newOrGroup(sibA, sibB);
      } else {
        this.splitOrCollapseOrGroup(sibA, sibB);
      }
    } else if (this.isGroup(sibA) && this.isGroup(sibB)) {
      this.mergeOrGroups(sibA, sibB);
    } else {
      this.mergeNodeIntoOrGroup(sibA, sibB);
    }
    this.pruneTree();
  }
  find(searchMethod) {
    const search = (node) => {
      if (searchMethod(node)) return node;
      if (this.isGroup(node)) {
        for (const child of node.children) {
          const result = search(child);
          if (result) {
            return result;
          }
        }
      }
      return void 0;
    };
    return search(this.root);
  }
  get leafNodes() {
    const leaves = (node) => {
      if (this.isGroup(node)) {
        return node.children.flatMap((child) => leaves(child));
      }
      return [node];
    };
    return leaves(this.root);
  }
  /* eslint-disable @typescript-eslint/no-explicit-any */
  get serialized() {
    const toObj = (node) => {
      const { parent, children, ...objData } = node;
      if (children) {
        return {
          children: children?.map(toObj),
          ...objData
        };
      }
      return objData;
    };
    try {
      return JSON.stringify(toObj(this.root));
    } catch (error) {
      throw new Error(`Error serializing tree: ${error}`);
    }
  }
  static deserialize(serialized, createGroup2) {
    const tree = new Tree(createGroup2);
    const linkParents = (node, parent) => {
      if (tree.isGroup(node)) {
        node.children.forEach((child) => linkParents(child, node));
      }
      node.parent = parent;
    };
    try {
      const parsed = JSON.parse(serialized);
      linkParents(parsed);
      tree.root = parsed;
      return tree;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON: ${error.message}`);
      }
      throw new Error(`Error deserializing tree: ${error}`);
    }
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */
}
const genomicFilterTypes = ["snp", "genomic"];
const createGroup = (nodes, operator) => createFilterGroup(nodes, operator);
const genomicFilters = writable(restoreGenomicFilters());
const filterTree = writable(restoreFilterTree());
const filters = derived(
  filterTree,
  ($tree) => $tree.leafNodes
);
const hasGenomicFilter = derived(
  genomicFilters,
  ($f) => $f && $f.length > 0 ? $f.some((filter) => filter.filterType === "genomic") : false
);
derived(
  filters,
  ($f) => $f && $f.length > 0 ? $f.some((filter) => !filter.allowFiltering) : false
);
derived([user, filters], ([$user, $filters]) => {
  if ($filters.length === 0 || !$user?.queryScopes) return false;
  return $filters.some((filter) => {
    let filterDataset = filter.dataset || "";
    if (genomicFilterTypes.includes(filter.filterType)) {
      filterDataset = "Gene_with_variant";
    }
    const isValidFilter = $user?.queryScopes?.some((scope) => {
      const isMatch = filterDataset.length > 0 && scope.includes(filterDataset);
      return isMatch;
    });
    return !isValidFilter;
  });
});
const hasOrGroup = derived(filterTree, ($ft) => $ft.hasOr);
function restoreAdvancedFiltering() {
  return false;
}
const advancedFilteringEnabled = writable(restoreAdvancedFiltering());
advancedFilteringEnabled.subscribe((enabled) => {
});
function disableAdvancedFiltering() {
  const tree = get(filterTree);
  const flattenOrGroups = (node) => {
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
  tree.root.uuid = genericUUID();
  filterTree.set(tree);
}
const filterWarning = writable();
filterTree.subscribe((tree) => {
});
genomicFilters.subscribe((filters2) => {
});
function restoreGenomicFilters() {
  return [];
}
function restoreFilterTree() {
  const newTree = new Tree(createGroup);
  return newTree;
}
function removeGenomicFilters() {
  genomicFilters.set([]);
}
function removeUnallowedFilters() {
  const isUnallowed = (node) => !node.allowFiltering;
  const geneFilters = get(genomicFilters);
  genomicFilters.set(geneFilters.filter((node) => !isUnallowed(node)));
  const tree = get(filterTree);
  const remove = tree.leafNodes.filter((node) => isUnallowed(node));
  tree.remove(...remove);
  tree.root.uuid = genericUUID();
  filterTree.set(tree);
}
function removeInvalidFilters() {
  const currentUser = get(user);
  const currentFilters = get(filters);
  if (!currentUser || currentFilters.length === 0) return;
  const match = (filter) => {
    let filterDataset = filter.dataset || "";
    if (genomicFilterTypes.includes(filter.filterType)) {
      filterDataset = "Gene_with_variant";
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
  const remove = tree.leafNodes.filter((node) => !match(node));
  tree.remove(...remove);
  tree.root.uuid = genericUUID();
  filterTree.set(tree);
}
function clearFilters() {
  genomicFilters.set([]);
  const tree = get(filterTree);
  tree.root.children = [];
  tree.root.uuid = genericUUID();
  filterTree.set(tree);
}
function getFiltersByType(type) {
  return [...get(filters), ...get(genomicFilters)].filter((f) => f.filterType === type);
}

export { Operator as O, QueryV2 as Q, removeGenomicFilters as a, removeUnallowedFilters as b, filters as c, clearFilters as d, advancedFilteringEnabled as e, filterWarning as f, hasOrGroup as g, hasGenomicFilter as h, disableAdvancedFiltering as i, genomicFilters as j, filterTree as k, genericUUID as l, QueryV3 as m, getFiltersByType as n, removeInvalidFilters as r };
//# sourceMappingURL=Filter-DSKDPPqy.js.map
