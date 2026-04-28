import {
  isFilterGroup,
  type FilterGroupInterface,
  type FilterInterface,
} from '$lib/models/Filter.svelte';

export type EquationPart =
  | { type: 'variable'; text: string }
  | { type: 'operator'; text: 'AND' | 'OR' }
  | { type: 'paren'; text: '(' | ')' };

function hasLeafDescendants(node: FilterInterface): boolean {
  if (!isFilterGroup(node)) {
    return true;
  }
  return node.children.some((child) => hasLeafDescendants(child));
}

function buildGroupParts(group: FilterGroupInterface, isOutermost: boolean): EquationPart[] {
  const nonEmptyChildren = group.children.filter((child) => hasLeafDescendants(child));

  if (nonEmptyChildren.length === 0) {
    return [];
  }

  // Unwrap single child group at outermost level
  if (isOutermost && nonEmptyChildren.length === 1 && isFilterGroup(nonEmptyChildren[0])) {
    return buildGroupParts(nonEmptyChildren[0] as FilterGroupInterface, true);
  }

  const inner: EquationPart[] = [];

  for (let i = 0; i < nonEmptyChildren.length; i++) {
    if (i > 0) {
      inner.push({ type: 'operator', text: group.operator });
    }

    const child = nonEmptyChildren[i];
    if (!isFilterGroup(child)) {
      inner.push({ type: 'variable', text: child.variableName });
    } else {
      inner.push({ type: 'paren', text: '(' });
      inner.push(...buildGroupParts(child as FilterGroupInterface, false));
      inner.push({ type: 'paren', text: ')' });
    }
  }

  return inner;
}

export function buildEquation(
  root: FilterGroupInterface,
  genomicFilters: FilterInterface[] = [],
): EquationPart[] {
  const treeParts = buildGroupParts(root, true);

  if (genomicFilters.length === 0) {
    return treeParts;
  }

  const genomicParts: EquationPart[] = [];
  for (let i = 0; i < genomicFilters.length; i++) {
    if (i > 0) {
      genomicParts.push({ type: 'operator', text: 'AND' });
    }
    genomicParts.push({ type: 'variable', text: genomicFilters[i].variableName });
  }

  if (treeParts.length === 0) {
    return genomicParts;
  }

  return [...treeParts, { type: 'operator', text: 'AND' }, ...genomicParts];
}
