import { describe, it, expect } from 'vitest';

import {
  createFilterGroup,
  type FilterGroupInterface,
  type FilterInterface,
} from '#lib/query/filter.svelte.ts';
import { LogicTree } from '#lib/query/logicTree.svelte.ts';
import { Operator } from '#lib/query/query.ts';
import type { DragEndEvent, DragStartEvent } from '#lib/ui/sortable/sortable.ts';
import { FilterTreeEditor } from './FilterTreeEditor.svelte.ts';

function leaf(uuid: string): FilterInterface {
  return { uuid, filterType: 'Categorical', parent: undefined } as unknown as FilterInterface;
}

// Root: a, G[b], c
function editor() {
  const tree = new LogicTree<FilterInterface>(createFilterGroup);
  const group = createFilterGroup([leaf('b')], Operator.AND);
  group.uuid = 'G';
  tree.add(leaf('a'), group, leaf('c'));
  return new FilterTreeEditor(tree.clone());
}

const ids = (group: FilterGroupInterface) => group.children.map((child) => child.uuid);
const find = (e: FilterTreeEditor, uuid: string) => e.tree.find((n) => n.uuid === uuid)!;

const start = (id: string) => ({ operation: { source: { id } } }) as unknown as DragStartEvent;
const end = (id: string, target: { id: string; data?: object } | null, canceled = false) =>
  ({ operation: { source: { id }, target }, canceled }) as unknown as DragEndEvent;

describe('FilterTreeEditor', () => {
  it('is dirty after an edit until it is applied', () => {
    const e = editor();
    expect(e.dirty).toBe(false);

    e.remove(find(e, 'c'));
    expect(e.dirty).toBe(true);

    // Applying prunes: G is left with one filter, which takes its place.
    const applied = e.apply();
    expect(e.dirty).toBe(false);
    expect(ids(applied.root as FilterGroupInterface)).toEqual(['a', 'b']);
  });

  it('adds empty subqueries and changes a group operator', () => {
    const e = editor();
    e.addGroup();
    expect(e.root.children).toHaveLength(4);

    e.setOperator(find(e, 'G') as FilterGroupInterface, Operator.OR);
    expect((find(e, 'G') as FilterGroupInterface).operator).toBe(Operator.OR);
  });

  it('names the root "root" and each node by the group it sits in', () => {
    const e = editor();
    expect(e.idOf(e.root)).toBe('root');
    expect(e.idOf(find(e, 'G') as FilterGroupInterface)).toBe('G');
    expect(e.containerOf(find(e, 'a'))).toBe('root');
    expect(e.containerOf(find(e, 'b'))).toBe('G');
  });

  it('tracks the dragged node and clears it on drop', () => {
    const e = editor();
    e.dragStart(start('G'));
    expect(e.activeId).toBe('G');
    expect(e.isGroupDrag).toBe(true);

    e.dragEnd(end('G', null, true));
    expect(e.activeId).toBeNull();
    expect(e.activeNode).toBeNull();
    expect(e.isGroupDrag).toBe(false);
  });

  it('moves a filter dropped on a subquery zone into that subquery', () => {
    const e = editor();
    e.dragStart(start('a'));
    e.dragEnd(end('a', { id: 'drop-G', data: { targetGroupId: 'G' } }));

    expect(ids(e.root)).toEqual(['G', 'c']);
    expect(ids(find(e, 'G') as FilterGroupInterface)).toEqual(['b', 'a']);
  });

  it('puts the tree back when a drag is canceled', () => {
    const e = editor();
    e.dragStart(start('a'));
    e.remove(find(e, 'a'));
    e.dragEnd(end('a', null, true));

    expect(ids(e.root)).toEqual(['a', 'G', 'c']);
    expect(e.dirty).toBe(false);
  });
});
