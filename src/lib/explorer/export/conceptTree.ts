import type { SearchResult } from '#lib/explorer/types.ts';
import type { TreeNodeInit } from '#lib/ui/tree/treeModel.svelte.ts';

interface Marked {
  node: TreeNodeInit<SearchResult>;
  someSelected: boolean;
}

const underAny = (conceptPath: string, concepts: string[]) =>
  concepts.some((concept) => conceptPath.startsWith(concept));

/**
 * Turns dictionary concepts into export tree nodes. A concept with no `children` is a variable;
 * an empty list means its children load when it's opened or selected. Concepts under a selected
 * path start selected, parents whose variables are partly selected start open, and concepts under
 * a disabled path (already in the query) can't be changed.
 */
export function toConceptNodes(
  concepts: SearchResult[],
  selected: string[] = [],
  disabled: string[] = [],
): TreeNodeInit<SearchResult>[] {
  return concepts.map((concept) => mark(concept, selected, disabled).node);
}

function mark(concept: SearchResult, selected: string[], disabled: string[]): Marked {
  const node: TreeNodeInit<SearchResult> = {
    name: concept.name,
    value: concept.name,
    label: concept.name,
    payload: concept,
    selected: underAny(concept.conceptPath, selected),
    disabled: underAny(concept.conceptPath, disabled),
  };
  if (!concept.children) return { node, someSelected: node.selected === true };
  if (concept.children.length === 0) return { node: { ...node, lazy: true }, someSelected: false };

  const children = concept.children.map((child) => mark(child, selected, disabled));
  const allSelected = children.every((child) => child.node.selected);
  const someSelected = children.some((child) => child.node.selected || child.someSelected);
  return {
    node: {
      ...node,
      children: children.map((child) => child.node),
      selected: allSelected,
      open: !allSelected && someSelected,
    },
    someSelected,
  };
}
