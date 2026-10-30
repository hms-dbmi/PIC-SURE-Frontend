import { describe, it, expect } from 'vitest';

import {
  createFilterGroup,
  isFilterGroup,
  type FilterGroupInterface,
  type FilterInterface,
} from '#lib/query/filter.svelte.ts';
import { LogicTree } from '#lib/query/logicTree.svelte.ts';
import { Operator } from '#lib/query/query.ts';
import {
  applyDrop,
  applyOrder,
  classifyDrop,
  containerIdOf,
  dropBeside,
  dropIntoEmptyGroup,
  dropIntoGroupZone,
  groupByContainerId,
  nestsGroupInItself,
  orderAtIndex,
  projectDragOver,
  sortableOrder,
  type DropEvent,
  type OrderMap,
} from './filterTreeOps.ts';

// Runs under client runes, so the trees are $state proxies like the editor's. Leaves are named by
// uuid; a group is { id: [...children] }.
type Spec = string | Record<string, Spec[]>;
type Shape = string | Record<string, Shape[]>;

function node(spec: Spec): FilterInterface {
  if (typeof spec === 'string') {
    return {
      uuid: spec,
      filterType: 'Categorical',
      parent: undefined,
    } as unknown as FilterInterface;
  }
  const [[id, children]] = Object.entries(spec);
  const group = createFilterGroup(children.map(node), Operator.AND);
  group.uuid = id;
  return group;
}

// Builds the tree, then clones it the way the editor takes its working copy.
function build(...specs: Spec[]): LogicTree<FilterInterface> {
  const tree = new LogicTree<FilterInterface>(createFilterGroup);
  tree.add(...specs.map(node));
  return tree.clone();
}

function shape(tree: LogicTree<FilterInterface>): Shape[] {
  const walk = (n: FilterInterface): Shape => {
    if (!isFilterGroup(n)) return n.uuid;
    n.children.forEach((child) => expect(child.parent).toBe(n));
    return { [n.uuid]: n.children.map(walk) };
  };
  const root = tree.root as FilterGroupInterface;
  root.children.forEach((child) => expect(child.parent).toBe(root));
  return root.children.map(walk);
}

const get = (tree: LogicTree<FilterInterface>, uuid: string) =>
  tree.find((n) => n.uuid === uuid) as FilterInterface;

const drop = (event: Partial<DropEvent>): DropEvent => ({
  sourceId: 'a',
  targetId: null,
  canceled: false,
  moved: true,
  reordered: false,
  ...event,
});

describe('container ids and order maps', () => {
  it('maps root, nested and empty groups to their children', () => {
    const tree = build('a', { G: ['b', { H: [] }] }, 'c');
    expect(sortableOrder(tree)).toEqual({ root: ['a', 'G', 'c'], G: ['b', 'H'], H: [] });
  });

  it('resolves container ids to groups only', () => {
    const tree = build('a', { G: ['b'] });
    expect(groupByContainerId(tree, 'root')).toBe(tree.root);
    expect(groupByContainerId(tree, 'G')).toBe(get(tree, 'G'));
    expect(groupByContainerId(tree, 'a')).toBeNull();
    expect(groupByContainerId(tree, 'missing')).toBeNull();
    expect(groupByContainerId(tree, undefined)).toBeNull();
    expect(containerIdOf(tree, get(tree, 'a').parent)).toBe('root');
    expect(containerIdOf(tree, get(tree, 'b').parent)).toBe('G');
    expect(containerIdOf(tree, undefined)).toBeUndefined();
  });
});

describe('dropIntoEmptyGroup', () => {
  it('moves an item into an empty nested group', () => {
    const tree = build('a', { G: ['b', { H: [] }] });
    expect(dropIntoEmptyGroup(tree, get(tree, 'a'), 'empty-H')).toBe(true);
    expect(shape(tree)).toEqual([{ G: ['b', { H: ['a'] }] }]);
  });

  it('moves a group into an empty sibling group', () => {
    const tree = build({ G: ['a', 'b'] }, { H: [] });
    expect(dropIntoEmptyGroup(tree, get(tree, 'G'), 'empty-H')).toBe(true);
    expect(shape(tree)).toEqual([{ H: [{ G: ['a', 'b'] }] }]);
  });

  it('refuses to put a group inside its own empty descendant', () => {
    const tree = build({ G: ['a', { H: [] }] });
    expect(dropIntoEmptyGroup(tree, get(tree, 'G'), 'empty-H')).toBe(false);
    expect(dropIntoEmptyGroup(tree, get(tree, 'G'), 'empty-G')).toBe(false);
    expect(shape(tree)).toEqual([{ G: ['a', { H: [] }] }]);
  });

  it('ignores other targets', () => {
    const tree = build('a', { G: ['b'] });
    expect(dropIntoEmptyGroup(tree, get(tree, 'a'), 'drop-G')).toBe(false);
    expect(dropIntoEmptyGroup(tree, get(tree, 'a'), 'empty-missing')).toBe(false);
    expect(dropIntoEmptyGroup(tree, get(tree, 'a'), 'empty-b')).toBe(false);
  });
});

describe('dropIntoGroupZone', () => {
  it('appends to the group without a slot', () => {
    const tree = build({ G: ['a', 'b'] }, { H: ['c', 'd'] });
    const data = { targetGroupId: 'H' };
    expect(dropIntoGroupZone(tree, get(tree, 'G'), 'drop-H', data)).toBe(true);
    expect(shape(tree)).toEqual([{ H: ['c', 'd', { G: ['a', 'b'] }] }]);
  });

  it('un-nests a group to the end of root', () => {
    const tree = build('a', { G: ['b', { H: ['c', 'd'] }] });
    expect(dropIntoGroupZone(tree, get(tree, 'H'), 'drop-root', { targetGroupId: 'root' })).toBe(
      true,
    );
    expect(shape(tree)).toEqual(['a', { G: ['b'] }, { H: ['c', 'd'] }]);
  });

  it('counts a root slot before the move when reordering within root', () => {
    const tree = build({ G: ['a', 'b'] }, { H: ['c', 'd'] }, { I: ['e', 'f'] });
    // The slot after I is 3; G leaves index 0, so it lands at 2.
    const data = { targetGroupId: 'root', insertAt: 3 };
    expect(dropIntoGroupZone(tree, get(tree, 'G'), 'drop-root__3', data)).toBe(true);
    expect(shape(tree).map((g) => Object.keys(g)[0])).toEqual(['H', 'I', 'G']);

    // Moving up needs no adjustment.
    dropIntoGroupZone(tree, get(tree, 'G'), 'drop-root__0', { targetGroupId: 'root', insertAt: 0 });
    expect(shape(tree).map((g) => Object.keys(g)[0])).toEqual(['G', 'H', 'I']);
  });

  it('takes a slot from another group as is, and appends past the end', () => {
    const tree = build('a', { G: ['b', { H: ['c', 'd'] }] });
    dropIntoGroupZone(tree, get(tree, 'H'), 'drop-root__0', { targetGroupId: 'root', insertAt: 0 });
    expect(shape(tree)).toEqual([{ H: ['c', 'd'] }, 'a', { G: ['b'] }]);

    dropIntoGroupZone(tree, get(tree, 'H'), 'drop-root__9', { targetGroupId: 'root', insertAt: 9 });
    expect(shape(tree)).toEqual(['a', { G: ['b'] }, { H: ['c', 'd'] }]);
  });

  it('falls back to the group id in the zone id', () => {
    const tree = build({ G: ['a', 'b'] }, { H: ['c', 'd'] });
    expect(dropIntoGroupZone(tree, get(tree, 'G'), 'drop-H')).toBe(true);
    expect(shape(tree)).toEqual([{ H: ['c', 'd', { G: ['a', 'b'] }] }]);
  });

  it('refuses to put a group into itself or its descendants', () => {
    const tree = build({ G: ['a', { H: ['b', 'c'] }] });
    const G = get(tree, 'G');
    expect(dropIntoGroupZone(tree, G, 'drop-G', { targetGroupId: 'G' })).toBe(false);
    expect(dropIntoGroupZone(tree, G, 'drop-H', { targetGroupId: 'H' })).toBe(false);
    expect(shape(tree)).toEqual([{ G: ['a', { H: ['b', 'c'] }] }]);
  });

  it('ignores other targets', () => {
    const tree = build('a', { G: ['b'] });
    expect(dropIntoGroupZone(tree, get(tree, 'a'), 'empty-G')).toBe(false);
    expect(dropIntoGroupZone(tree, get(tree, 'a'), 'drop-missing')).toBe(false);
  });
});

describe('dropBeside', () => {
  it('reorders within a group, forwards and backwards', () => {
    const tree = build('a', 'b', 'c', 'd');
    expect(dropBeside(tree, get(tree, 'a'), 'c')).toBe(true);
    expect(shape(tree)).toEqual(['b', 'c', 'a', 'd']);
    expect(dropBeside(tree, get(tree, 'd'), 'b')).toBe(true);
    expect(shape(tree)).toEqual(['b', 'd', 'c', 'a']);
  });

  it('does nothing where the node already is', () => {
    const tree = build('a', 'b', 'c');
    expect(dropBeside(tree, get(tree, 'b'), 'b')).toBe(false);
    expect(dropBeside(tree, get(tree, 'b'), 'a')).toBe(false);
    expect(shape(tree)).toEqual(['a', 'b', 'c']);
  });

  it('moves an item after a target in a nested group', () => {
    const tree = build('a', { G: ['b', { H: ['c', 'd'] }] });
    expect(dropBeside(tree, get(tree, 'a'), 'c')).toBe(true);
    expect(shape(tree)).toEqual([{ G: ['b', { H: ['c', 'a', 'd'] }] }]);
  });

  it('moves an item out of a group, after a group target', () => {
    const tree = build({ G: ['a', 'b'] }, 'c');
    expect(dropBeside(tree, get(tree, 'a'), 'G')).toBe(true);
    expect(shape(tree)).toEqual([{ G: ['b'] }, 'a', 'c']);
  });

  it('refuses targets inside the dragged group, and unknown targets', () => {
    const tree = build({ G: ['a', { H: ['b', 'c'] }] }, 'd');
    expect(dropBeside(tree, get(tree, 'G'), 'a')).toBe(false);
    expect(dropBeside(tree, get(tree, 'G'), 'b')).toBe(false);
    expect(dropBeside(tree, get(tree, 'd'), 'missing')).toBe(false);
    expect(shape(tree)).toEqual([{ G: ['a', { H: ['b', 'c'] }] }, 'd']);
  });
});

describe('orderAtIndex', () => {
  it('puts the node at the index in its own group, clamped', () => {
    const tree = build('a', { G: ['b', 'c', 'd'] });
    expect(orderAtIndex(tree, get(tree, 'b'), 2)).toEqual({ G: ['c', 'd', 'b'] });
    expect(orderAtIndex(tree, get(tree, 'b'), 7)).toEqual({ G: ['c', 'd', 'b'] });
    expect(orderAtIndex(tree, get(tree, 'a'), 1)).toEqual({ root: ['G', 'a'] });
  });

  it('is null without a move', () => {
    const tree = build('a', 'b');
    expect(orderAtIndex(tree, get(tree, 'a'), 0)).toBeNull();
    expect(orderAtIndex(tree, get(tree, 'a'), undefined)).toBeNull();
  });
});

describe('applyOrder', () => {
  it('reorders a group', () => {
    const tree = build('a', 'b', 'c');
    applyOrder(tree, get(tree, 'a'), { root: ['b', 'c', 'a'] });
    expect(shape(tree)).toEqual(['b', 'c', 'a']);
  });

  it('moves the node into the group the order puts it in', () => {
    const tree = build('a', { G: ['b', { H: ['c'] }] }, 'd');
    applyOrder(tree, get(tree, 'a'), { root: ['G', 'd'], H: ['a', 'c'] });
    expect(shape(tree)).toEqual([{ G: ['b', { H: ['a', 'c'] }] }, 'd']);
  });

  it('moves the node when only its new container is listed', () => {
    const tree = build('a', { G: ['b'] });
    applyOrder(tree, get(tree, 'a'), { G: ['b', 'a'] });
    expect(shape(tree)).toEqual([{ G: ['b', 'a'] }]);
  });

  it('skips ids and containers it does not know', () => {
    const tree = build('a', 'b');
    applyOrder(tree, get(tree, 'a'), { root: ['b', 'x', 'a'], missing: ['a'] });
    expect(shape(tree)).toEqual(['b', 'a']);
  });
});

describe('nestsGroupInItself', () => {
  const order: OrderMap = { root: ['G', 'x'], G: ['a', 'H'], H: ['b'] };

  it('catches a group placed in itself or a descendant', () => {
    const tree = build({ G: ['a', { H: ['b'] }] }, 'x');
    const G = get(tree, 'G');
    expect(nestsGroupInItself({ ...order, root: ['x'], G: ['a', 'H', 'G'] }, G)).toBe(true);
    expect(nestsGroupInItself({ ...order, root: ['x'], H: ['b', 'G'] }, G)).toBe(true);
  });

  it('allows anything else', () => {
    const tree = build({ G: ['a', { H: ['b'] }] }, { I: [] }, 'x');
    expect(nestsGroupInItself(order, get(tree, 'G'))).toBe(false);
    expect(nestsGroupInItself({ ...order, root: ['x'], I: ['G'] }, get(tree, 'G'))).toBe(false);
    expect(nestsGroupInItself({ ...order, H: ['b', 'a'] }, get(tree, 'a'))).toBe(false);
  });
});

describe('classifyDrop', () => {
  const tree = build('a', { G: ['b', 'c'] }, { H: [] });
  const a = get(tree, 'a');

  it('reports a cancelled drag', () => {
    expect(classifyDrop(tree, a, drop({ targetId: 'c', canceled: true }))).toEqual({
      type: 'canceled',
    });
  });

  it('treats a click on the own container as no movement', () => {
    expect(classifyDrop(tree, a, drop({ targetId: 'root', moved: false }))).toEqual({
      type: 'no-movement',
    });
    const b = get(tree, 'b');
    expect(classifyDrop(tree, b, drop({ sourceId: 'b', targetId: 'G', moved: false }))).toEqual({
      type: 'no-movement',
    });
    expect(classifyDrop(tree, a, drop({ targetId: 'root' }))).toEqual({
      type: 'fallback',
      targetId: 'root',
    });
  });

  it('routes drop zones, ignoring the group own ones', () => {
    expect(classifyDrop(tree, a, drop({ targetId: 'empty-H' }))).toEqual({
      type: 'empty-drop-zone',
      targetId: 'empty-H',
    });
    const targetData = { targetGroupId: 'G' };
    expect(classifyDrop(tree, a, drop({ targetId: 'drop-G', targetData }))).toEqual({
      type: 'group-drop-zone',
      targetId: 'drop-G',
      targetData,
    });
    const H = get(tree, 'H');
    expect(classifyDrop(tree, H, drop({ sourceId: 'H', targetId: 'empty-H' }))).toEqual({
      type: 'fallback',
      targetId: null,
    });
  });

  it('routes targets in other groups, and group targets, as cross-group', () => {
    expect(classifyDrop(tree, a, drop({ targetId: 'c' }))).toEqual({
      type: 'cross-group',
      targetId: 'c',
    });
    const b = get(tree, 'b');
    expect(classifyDrop(tree, b, drop({ sourceId: 'b', targetId: 'H' }))).toEqual({
      type: 'cross-group',
      targetId: 'H',
    });
  });

  it('keeps an optimistic reorder, and falls back otherwise', () => {
    const b = get(tree, 'b');
    const event = drop({ sourceId: 'b', targetId: 'c' });
    expect(classifyDrop(tree, b, { ...event, reordered: true })).toEqual({
      type: 'reorder-applied',
    });
    expect(classifyDrop(tree, b, event)).toEqual({ type: 'fallback', targetId: 'c' });
  });

  it('keeps the reorder of a group dropped on itself', () => {
    const G = get(tree, 'G');
    const event = drop({ sourceId: 'G', targetId: 'G', reordered: true });
    expect(classifyDrop(tree, G, event)).toEqual({ type: 'reorder-applied' });
  });
});

describe('applyDrop', () => {
  const none = { projected: null, lastProjected: null };

  it('does nothing for a cancelled drag or a click', () => {
    const tree = build('a', 'b');
    applyDrop(tree, get(tree, 'a'), { type: 'canceled' }, { ...none, sourceIndex: 1 });
    applyDrop(tree, get(tree, 'a'), { type: 'no-movement' }, { ...none, sourceIndex: 1 });
    expect(shape(tree)).toEqual(['a', 'b']);
  });

  it('replays the last projected order for an optimistic reorder', () => {
    const tree = build('a', 'b', 'c');
    applyDrop(
      tree,
      get(tree, 'a'),
      { type: 'reorder-applied' },
      {
        projected: null,
        lastProjected: { root: ['b', 'a', 'c'] },
      },
    );
    expect(shape(tree)).toEqual(['b', 'a', 'c']);
  });

  it('falls back to the projection, then the target, then the source index', () => {
    let tree = build('a', 'b', 'c');
    applyDrop(
      tree,
      get(tree, 'a'),
      { type: 'fallback', targetId: 'b' },
      {
        projected: { root: ['b', 'c', 'a'] },
        lastProjected: { root: ['b', 'a', 'c'] },
      },
    );
    expect(shape(tree)).toEqual(['b', 'c', 'a']);

    tree = build('a', 'b', 'c');
    applyDrop(
      tree,
      get(tree, 'a'),
      { type: 'fallback', targetId: 'b' },
      {
        ...none,
        sourceIndex: 2,
      },
    );
    expect(shape(tree)).toEqual(['b', 'a', 'c']);

    tree = build('a', 'b', 'c');
    applyDrop(
      tree,
      get(tree, 'a'),
      { type: 'fallback', targetId: null },
      {
        ...none,
        sourceIndex: 2,
      },
    );
    expect(shape(tree)).toEqual(['b', 'c', 'a']);
  });

  it('runs the drop-zone and cross-group moves', () => {
    const tree = build('a', { G: ['b', 'c'] }, { H: [] });
    applyDrop(tree, get(tree, 'a'), { type: 'empty-drop-zone', targetId: 'empty-H' }, none);
    applyDrop(tree, get(tree, 'b'), { type: 'cross-group', targetId: 'a' }, none);
    expect(shape(tree)).toEqual([{ G: ['c'] }, { H: ['a', 'b'] }]);
    applyDrop(
      tree,
      get(tree, 'H'),
      { type: 'group-drop-zone', targetId: 'drop-G', targetData: { targetGroupId: 'G' } },
      none,
    );
    expect(shape(tree)).toEqual([{ G: ['c', { H: ['a', 'b'] }] }]);
  });
});

describe('projectDragOver', () => {
  const noMove = (order: OrderMap) => order;

  it('clears without a target, or over the group own zones', () => {
    const tree = build({ G: ['a', 'b'] });
    const G = get(tree, 'G');
    expect(projectDragOver(tree, G, { sourceId: 'G', targetId: null }, noMove)).toEqual({
      type: 'clear',
    });
    expect(projectDragOver(tree, G, { sourceId: 'G', targetId: 'drop-G' }, noMove)).toEqual({
      type: 'clear',
    });
    expect(projectDragOver(tree, G, { sourceId: 'G', targetId: 'empty-G' }, noMove)).toEqual({
      type: 'clear',
    });
  });

  it('projects a move into an empty nested group', () => {
    const tree = build('a', { G: ['b', { H: [] }] });
    const over = { sourceId: 'a', targetId: 'empty-H', targetData: { targetGroupId: 'H' } };
    expect(projectDragOver(tree, get(tree, 'a'), over, noMove)).toEqual({
      type: 'project',
      order: { root: ['G'], G: ['b', 'H'], H: ['a'] },
    });
  });

  it('projects a root slot, counting the source before it', () => {
    const tree = build({ G: ['a', 'b'] }, { H: ['c', 'd'] }, { I: ['e', 'f'] });
    const over = {
      sourceId: 'G',
      targetId: 'drop-root__3',
      targetData: { targetGroupId: 'root', insertAt: 3 },
    };
    const result = projectDragOver(tree, get(tree, 'G'), over, noMove);
    expect(result).toMatchObject({ type: 'project', order: { root: ['H', 'I', 'G'] } });
  });

  it('keeps the projection when the source would stay put', () => {
    const tree = build({ G: ['a', 'b'] }, { H: ['c', 'd'] });
    const over = {
      sourceId: 'G',
      targetId: 'drop-root__1',
      targetData: { targetGroupId: 'root', insertAt: 1 },
    };
    expect(projectDragOver(tree, get(tree, 'G'), over, noMove)).toEqual({ type: 'keep' });
    const sameOrder = (order: OrderMap) => ({ ...order });
    expect(projectDragOver(tree, get(tree, 'a'), { sourceId: 'a', targetId: 'b' }, noMove)).toEqual(
      { type: 'keep' },
    );
    expect(
      projectDragOver(tree, get(tree, 'a'), { sourceId: 'a', targetId: 'b' }, sameOrder),
    ).toEqual({ type: 'keep' });
  });

  it('projects a sortable move', () => {
    const tree = build('a', 'b', { G: ['c', 'd'] });
    const swap = (order: OrderMap) => ({ ...order, root: ['b', 'a', 'G'] });
    expect(projectDragOver(tree, get(tree, 'a'), { sourceId: 'a', targetId: 'b' }, swap)).toEqual({
      type: 'project',
      order: { root: ['b', 'a', 'G'], G: ['c', 'd'] },
    });
  });

  it('clears a group moving into itself, a descendant or another container', () => {
    const tree = build({ G: ['a', { H: ['b', 'c'] }] }, { I: ['d', 'e'] });
    const G = get(tree, 'G');
    const intoH = { sourceId: 'G', targetId: 'empty-H', targetData: { targetGroupId: 'H' } };
    expect(projectDragOver(tree, G, intoH, noMove)).toEqual({ type: 'clear' });

    const intoI = (order: OrderMap) => ({ ...order, root: ['I'], I: ['d', 'G', 'e'] });
    expect(projectDragOver(tree, G, { sourceId: 'G', targetId: 'd' }, intoI)).toEqual({
      type: 'clear',
    });
  });

  it('lets an item move to another container', () => {
    const tree = build('a', { G: ['b', 'c'] });
    const intoG = (order: OrderMap) => ({ ...order, root: ['G'], G: ['b', 'a', 'c'] });
    expect(projectDragOver(tree, get(tree, 'a'), { sourceId: 'a', targetId: 'b' }, intoG)).toEqual({
      type: 'project',
      order: { root: ['G'], G: ['b', 'a', 'c'] },
    });
  });
});
