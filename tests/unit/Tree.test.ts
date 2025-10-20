import { describe, it, expect } from 'vitest';

import { Operator, type OperatorType } from '$lib/models/query/Query';
import { Tree } from '$lib/models/Tree';
import type { TreeNode, TreeGroup } from '$lib/models/Tree';

interface TestNode extends TreeNode<string> {
  type: 'node';
  value: string;
}

interface TestGroup extends TreeNode<string>, TreeGroup<string> {
  type: 'group';
}

function createTestNode(value: string): TestNode {
  return {
    parent: undefined,
    type: 'node',
    value,
  };
}

function createTestGroup(children: TreeNode<string>[], operator: OperatorType): TestGroup {
  const parent: TestGroup = {
    parent: undefined,
    type: 'group',
    children,
    operator,
  };
  children.forEach((child) => (child.parent = parent));
  return parent;
}

describe('FlatFilterTree Model', () => {
  it('has no operator when there is one filter', () => {
    // Given
    const tree = new Tree<string>(createTestGroup);

    // Then
    expect(tree.root.children.length).toBe(0);
    expect(tree.root.operator).toBe(Operator.AND);
    expect(tree.serialized).toBe(
      JSON.stringify({
        children: [],
        type: 'group',
        operator: 'AND',
      }),
    );
  });
  describe('add', () => {
    it('add new element to root', () => {
      // Given
      const tree = new Tree<string>(createTestGroup);

      // When
      tree.add(createTestNode('A'));

      // Then
      expect(tree.serialized).toBe(
        JSON.stringify({
          children: [{ type: 'node', value: 'A' }],
          type: 'group',
          operator: 'AND',
        }),
      );
    });
    it('add multiple elements to root', () => {
      // Given
      const tree = new Tree<string>(createTestGroup);

      // When
      tree.add(createTestNode('A'), createTestNode('B'));

      // Then
      expect(tree.serialized).toBe(
        JSON.stringify({
          children: [
            { type: 'node', value: 'A' },
            { type: 'node', value: 'B' },
          ],
          type: 'group',
          operator: 'AND',
        }),
      );
    });
  });
  describe('remove', () => {
    it('remove only child', () => {
      // Given
      const tree = new Tree<string>(createTestGroup);
      const A = createTestNode('A');
      tree.add(A);

      // When
      expect(tree.serialized).toBe(
        JSON.stringify({
          children: [{ type: 'node', value: 'A' }],
          type: 'group',
          operator: 'AND',
        }),
      );
      tree.remove(A);

      // Then
      expect(tree.serialized).toBe(
        JSON.stringify({ children: [], type: 'group', operator: 'AND' }),
      );
    });
    it('remove one child from OR subgroup, collapsing OR group to root AND group', () => {
      // Given
      const tree = new Tree<string>(createTestGroup);
      const A = createTestNode('A');
      const B = createTestNode('B');
      const OR = createTestGroup([A, B], Operator.OR);
      tree.add(OR);

      // When
      expect(tree.serialized).toBe(
        JSON.stringify({
          children: [
            {
              children: [
                { type: 'node', value: 'A' },
                { type: 'node', value: 'B' },
              ],
              type: 'group',
              operator: 'OR',
            },
          ],
          type: 'group',
          operator: 'AND',
        }),
      );
      tree.remove(A);

      // Then
      expect(tree.serialized).toBe(
        JSON.stringify({
          children: [{ type: 'node', value: 'B' }],
          type: 'group',
          operator: 'AND',
        }),
      );
    });
    it('remove one child from OR subgroup, OR group remains', () => {
      // Given
      const tree = new Tree<string>(createTestGroup);
      const A = createTestNode('A');
      const B = createTestNode('B');
      const C = createTestNode('C');
      const OR = createTestGroup([A, B, C], Operator.OR);
      tree.add(OR);

      // When
      expect(tree.serialized).toBe(
        JSON.stringify({
          children: [
            {
              children: [
                { type: 'node', value: 'A' },
                { type: 'node', value: 'B' },
                { type: 'node', value: 'C' },
              ],
              type: 'group',
              operator: 'OR',
            },
          ],
          type: 'group',
          operator: 'AND',
        }),
      );
      tree.remove(A);

      // Then
      expect(tree.serialized).toBe(
        JSON.stringify({
          children: [
            {
              children: [
                { type: 'node', value: 'B' },
                { type: 'node', value: 'C' },
              ],
              type: 'group',
              operator: 'OR',
            },
          ],
          type: 'group',
          operator: 'AND',
        }),
      );
    });
    it('remove multiple children', () => {
      // Given
      const tree = new Tree<string>(createTestGroup);
      const A = createTestNode('A');
      const B = createTestNode('B');
      const C = createTestNode('C');
      tree.add(A, B, C);

      // When
      expect(tree.serialized).toBe(
        JSON.stringify({
          children: [
            { type: 'node', value: 'A' },
            { type: 'node', value: 'B' },
            { type: 'node', value: 'C' },
          ],
          type: 'group',
          operator: 'AND',
        }),
      );
      tree.remove(A, B);

      // Then
      expect(tree.serialized).toBe(
        JSON.stringify({
          children: [{ type: 'node', value: 'C' }],
          type: 'group',
          operator: 'AND',
        }),
      );
    });
  });
  describe('update', () => {
    it('update root node', () => {
      // Given
      const tree = new Tree<string>(createTestGroup);
      tree.add(createTestNode('A'));

      // When
      const newTree: TreeGroup<string> = {
        ...(tree.root as TestGroup),
        operator: Operator.OR,
      };
      tree.update(tree.root, newTree);

      // Then
      expect(tree.serialized).toBe(
        JSON.stringify({
          children: [{ type: 'node', value: 'A' }],
          type: 'group',
          operator: 'OR',
        }),
      );
    });
    it('update non-root node', () => {
      // Given
      const tree = new Tree<string>(createTestGroup);
      const A = createTestNode('A');
      tree.add(A);

      // When
      const newNode = { ...A, value: 'B' };
      tree.update(A, newNode);

      // Then
      expect(tree.serialized).toBe(
        JSON.stringify({
          children: [{ type: 'node', value: 'B' }],
          type: 'group',
          operator: 'AND',
        }),
      );
    });
    it('update non-root group', () => {
      // Given
      const tree = new Tree<string>(createTestGroup);
      const A = createTestNode('A');
      const B = createTestNode('B');
      const OR = createTestGroup([A, B], Operator.OR);
      tree.add(OR);

      // When
      const C = createTestNode('C');
      const newGroup = { ...OR, children: [A, C] };
      tree.update(OR, newGroup);

      // Then
      expect(tree.serialized).toBe(
        JSON.stringify({
          children: [
            {
              children: [
                { type: 'node', value: 'A' },
                { type: 'node', value: 'C' },
              ],
              type: 'group',
              operator: 'OR',
            },
          ],
          type: 'group',
          operator: 'AND',
        }),
      );
    });
  });
  describe('toggleOperator', () => {
    it('make new OR subgroup', () => {
      // Given
      const tree = new Tree<string>(createTestGroup);
      const A = createTestNode('A');
      const B = createTestNode('B');
      tree.add(A);
      tree.add(B);

      // When
      expect(tree.serialized).toBe(
        JSON.stringify({
          children: [
            { type: 'node', value: 'A' },
            { type: 'node', value: 'B' },
          ],
          type: 'group',
          operator: 'AND',
        }),
      );
      tree.toggleOperator(A, B);

      // Then
      expect(tree.serialized).toBe(
        JSON.stringify({
          children: [
            {
              children: [
                { type: 'node', value: 'A' },
                { type: 'node', value: 'B' },
              ],
              type: 'group',
              operator: 'OR',
            },
          ],
          type: 'group',
          operator: 'AND',
        }),
      );
    });
    it('collapse OR subgroup', () => {
      // Given
      const tree = new Tree<string>(createTestGroup);
      const A = createTestNode('A');
      const B = createTestNode('B');
      const OR = createTestGroup([A, B], Operator.OR);
      tree.add(OR);

      // When
      expect(tree.serialized).toBe(
        JSON.stringify({
          children: [
            {
              children: [
                { type: 'node', value: 'A' },
                { type: 'node', value: 'B' },
              ],
              type: 'group',
              operator: 'OR',
            },
          ],
          type: 'group',
          operator: 'AND',
        }),
      );
      tree.toggleOperator(A, B);

      // Then
      expect(tree.serialized).toBe(
        JSON.stringify({
          children: [
            { type: 'node', value: 'A' },
            { type: 'node', value: 'B' },
          ],
          type: 'group',
          operator: 'AND',
        }),
      );
    });
    it('merge two OR subgroups', () => {
      // Given
      const tree = new Tree<string>(createTestGroup);
      const A = createTestNode('A');
      const B = createTestNode('B');
      tree.add(A);
      tree.add(B);
      tree.toggleOperator(A, B);
      const C = createTestNode('C');
      const D = createTestNode('D');
      tree.add(C);
      tree.add(D);
      tree.toggleOperator(C, D);

      // When
      expect(tree.serialized).toBe(
        JSON.stringify({
          children: [
            {
              children: [
                { type: 'node', value: 'A' },
                { type: 'node', value: 'B' },
              ],
              type: 'group',
              operator: 'OR',
            },
            {
              children: [
                { type: 'node', value: 'C' },
                { type: 'node', value: 'D' },
              ],
              type: 'group',
              operator: 'OR',
            },
          ],
          type: 'group',
          operator: 'AND',
        }),
      );
      tree.toggleOperator(B, C);

      // Then
      expect(tree.serialized).toBe(
        JSON.stringify({
          children: [
            {
              children: [
                { type: 'node', value: 'A' },
                { type: 'node', value: 'B' },
                { type: 'node', value: 'C' },
                { type: 'node', value: 'D' },
              ],
              type: 'group',
              operator: 'OR',
            },
          ],
          type: 'group',
          operator: 'AND',
        }),
      );
    });
    it('split OR group', () => {
      // Given
      const tree = new Tree<string>(createTestGroup);
      const A = createTestNode('A');
      const B = createTestNode('B');
      const C = createTestNode('C');
      const D = createTestNode('D');
      const OR = createTestGroup([A, B, C, D], Operator.OR);
      tree.add(OR);

      // When
      expect(tree.serialized).toBe(
        JSON.stringify({
          children: [
            {
              children: [
                { type: 'node', value: 'A' },
                { type: 'node', value: 'B' },
                { type: 'node', value: 'C' },
                { type: 'node', value: 'D' },
              ],
              type: 'group',
              operator: 'OR',
            },
          ],
          type: 'group',
          operator: 'AND',
        }),
      );
      tree.toggleOperator(B, C);

      // Then
      expect(tree.serialized).toBe(
        JSON.stringify({
          children: [
            {
              children: [
                { type: 'node', value: 'A' },
                { type: 'node', value: 'B' },
              ],
              type: 'group',
              operator: 'OR',
            },
            {
              children: [
                { type: 'node', value: 'C' },
                { type: 'node', value: 'D' },
              ],
              type: 'group',
              operator: 'OR',
            },
          ],
          type: 'group',
          operator: 'AND',
        }),
      );
    });
    it('merge AND into leading OR group', () => {
      // Given
      const tree = new Tree<string>(createTestGroup);
      const A = createTestNode('A');
      const B = createTestNode('B');
      const C = createTestNode('C');
      const D = createTestNode('D');
      tree.add(A);
      tree.add(B);
      tree.add(C);
      tree.add(D);
      tree.toggleOperator(A, B);

      // When
      expect(tree.serialized).toBe(
        JSON.stringify({
          children: [
            {
              children: [
                { type: 'node', value: 'A' },
                { type: 'node', value: 'B' },
              ],
              type: 'group',
              operator: 'OR',
            },
            { type: 'node', value: 'C' },
            { type: 'node', value: 'D' },
          ],
          type: 'group',
          operator: 'AND',
        }),
      );
      tree.toggleOperator(B, C);

      // Then
      expect(tree.serialized).toBe(
        JSON.stringify({
          children: [
            {
              children: [
                { type: 'node', value: 'A' },
                { type: 'node', value: 'B' },
                { type: 'node', value: 'C' },
              ],
              type: 'group',
              operator: 'OR',
            },
            { type: 'node', value: 'D' },
          ],
          type: 'group',
          operator: 'AND',
        }),
      );
    });
    it('merge AND into trailing OR group', () => {
      // Given
      const tree = new Tree<string>(createTestGroup);
      const A = createTestNode('A');
      const B = createTestNode('B');
      const C = createTestNode('C');
      const D = createTestNode('D');
      tree.add(A);
      tree.add(B);
      tree.add(C);
      tree.add(D);
      tree.toggleOperator(C, D);

      // When
      expect(tree.serialized).toBe(
        JSON.stringify({
          children: [
            { type: 'node', value: 'A' },
            { type: 'node', value: 'B' },
            {
              children: [
                { type: 'node', value: 'C' },
                { type: 'node', value: 'D' },
              ],
              type: 'group',
              operator: 'OR',
            },
          ],
          type: 'group',
          operator: 'AND',
        }),
      );
      tree.toggleOperator(B, C);

      // Then
      expect(tree.serialized).toBe(
        JSON.stringify({
          children: [
            { type: 'node', value: 'A' },
            {
              children: [
                { type: 'node', value: 'B' },
                { type: 'node', value: 'C' },
                { type: 'node', value: 'D' },
              ],
              type: 'group',
              operator: 'OR',
            },
          ],
          type: 'group',
          operator: 'AND',
        }),
      );
    });
    it('split from leading OR group', () => {
      // Given
      const tree = new Tree<string>(createTestGroup);
      const A = createTestNode('A');
      const B = createTestNode('B');
      const C = createTestNode('C');
      const D = createTestNode('D');
      const OR = createTestGroup([A, B, C], Operator.OR);
      tree.add(OR);
      tree.add(D);

      // When
      expect(tree.serialized).toBe(
        JSON.stringify({
          children: [
            {
              children: [
                { type: 'node', value: 'A' },
                { type: 'node', value: 'B' },
                { type: 'node', value: 'C' },
              ],
              type: 'group',
              operator: 'OR',
            },
            { type: 'node', value: 'D' },
          ],
          type: 'group',
          operator: 'AND',
        }),
      );
      tree.toggleOperator(B, C);

      // Then
      expect(tree.serialized).toBe(
        JSON.stringify({
          children: [
            {
              children: [
                { type: 'node', value: 'A' },
                { type: 'node', value: 'B' },
              ],
              type: 'group',
              operator: 'OR',
            },
            { type: 'node', value: 'C' },
            { type: 'node', value: 'D' },
          ],
          type: 'group',
          operator: 'AND',
        }),
      );
    });
    it('split from trailing OR group', () => {
      // Given
      const tree = new Tree<string>(createTestGroup);
      const A = createTestNode('A');
      const B = createTestNode('B');
      const C = createTestNode('C');
      const D = createTestNode('D');
      const OR = createTestGroup([B, C, D], Operator.OR);
      tree.add(A);
      tree.add(OR);

      // When
      expect(tree.serialized).toBe(
        JSON.stringify({
          children: [
            { type: 'node', value: 'A' },
            {
              children: [
                { type: 'node', value: 'B' },
                { type: 'node', value: 'C' },
                { type: 'node', value: 'D' },
              ],
              type: 'group',
              operator: 'OR',
            },
          ],
          type: 'group',
          operator: 'AND',
        }),
      );
      tree.toggleOperator(B, C);

      // Then
      expect(tree.serialized).toBe(
        JSON.stringify({
          children: [
            { type: 'node', value: 'A' },
            { type: 'node', value: 'B' },
            {
              children: [
                { type: 'node', value: 'C' },
                { type: 'node', value: 'D' },
              ],
              type: 'group',
              operator: 'OR',
            },
          ],
          type: 'group',
          operator: 'AND',
        }),
      );
    });
    it('complex structure', () => {
      // Given
      const tree = new Tree<string>(createTestGroup);
      const A = createTestNode('A');
      const B = createTestNode('B');
      const C = createTestNode('C');
      const D = createTestNode('D');
      const E = createTestNode('E');
      const F = createTestNode('F');
      const OR1 = createTestGroup([B, C, D], Operator.OR);
      const OR2 = createTestGroup([E, F], Operator.OR);
      tree.add(A);
      tree.add(OR1);
      tree.add(OR2);

      // When
      expect(tree.serialized).toBe(
        JSON.stringify({
          children: [
            { type: 'node', value: 'A' },
            {
              children: [
                { type: 'node', value: 'B' },
                { type: 'node', value: 'C' },
                { type: 'node', value: 'D' },
              ],
              type: 'group',
              operator: 'OR',
            },
            {
              children: [
                { type: 'node', value: 'E' },
                { type: 'node', value: 'F' },
              ],
              type: 'group',
              operator: 'OR',
            },
          ],
          type: 'group',
          operator: 'AND',
        }),
      );
      tree.toggleOperator(B, C);

      // Then
      expect(tree.serialized).toBe(
        JSON.stringify({
          children: [
            { type: 'node', value: 'A' },
            { type: 'node', value: 'B' },
            {
              children: [
                { type: 'node', value: 'C' },
                { type: 'node', value: 'D' },
              ],
              type: 'group',
              operator: 'OR',
            },
            {
              children: [
                { type: 'node', value: 'E' },
                { type: 'node', value: 'F' },
              ],
              type: 'group',
              operator: 'OR',
            },
          ],
          type: 'group',
          operator: 'AND',
        }),
      );
    });
  });
  describe('find', () => {
    it('returns a nested node', () => {
      // Given
      const tree = new Tree<string>(createTestGroup);
      const OR = createTestGroup([createTestNode('A'), createTestNode('B')], Operator.OR);
      tree.add(OR);

      // Then
      const node = tree.find((node) => 'value' in node && node.value === 'A') as
        | TestNode
        | undefined;
      expect(node?.value).toBe('A');
    });
    it('returns undefined when node not found', () => {
      const tree = new Tree<string>(createTestGroup);
      tree.add(createTestNode('A'));

      // Then
      const node = tree.find((node) => 'value' in node && node.value === 'Z');
      expect(node).toBeUndefined();
    });
    it('finds a group node', () => {
      // Given
      const tree = new Tree<string>(createTestGroup);
      const OR = createTestGroup([createTestNode('A')], Operator.OR);
      tree.add(OR);

      // Then
      const found = tree.find((node) => tree.isGroup(node) && node.operator === Operator.OR);
      expect(found).toBeDefined();
      expect(tree.isGroup(found!)).toBe(true);
    });
    it('finds first node', () => {
      // Given
      const tree = new Tree<string>(createTestGroup);
      const OR1 = createTestGroup([createTestNode('A')], Operator.OR);
      const OR2 = createTestGroup([createTestNode('B')], Operator.OR);
      tree.add(OR1);
      tree.add(OR2);

      // Then
      const found = tree.find((node) => tree.isGroup(node) && node.operator === Operator.OR);
      expect(found).toBeDefined();
      expect(((found as TestGroup).children[0] as TestNode).value).toBe('A');
    });
  });
  describe('getLeafNodes', () => {
    it('returns a list of leaves', () => {
      // Given
      const tree = new Tree<string>(createTestGroup);
      tree.add(createTestNode('A'));
      tree.add(createTestNode('B'));

      // When
      const leaves = tree.leafNodes;

      // Then
      expect(leaves.length).toBe(2);
      expect(
        leaves
          .map((leaf) =>
            'value' in leaf && leaf.parent ? leaf.value + ':' + leaf.parent.operator : undefined,
          )
          .filter((x) => x)
          .join(','),
      ).toBe('A:AND,B:AND');
    });
    it('returns empty array for tree with only root', () => {
      // Given
      const tree = new Tree<string>(createTestGroup);

      // Then
      expect(tree.leafNodes).toEqual([]);
    });

    it('handles nested OR groups', () => {
      // Given
      const tree = new Tree<string>(createTestGroup);
      const innerOR = createTestGroup([createTestNode('A'), createTestNode('B')], Operator.OR);
      const outerOR = createTestGroup([innerOR, createTestNode('C')], Operator.OR);
      tree.add(outerOR);

      // Then
      const leaves = tree.leafNodes;
      expect(leaves.length).toBe(3);
    });
  });
  describe('serialize', () => {
    it('returns string without parent links', () => {
      // Given
      const tree = new Tree<string>(createTestGroup);
      const OR = createTestGroup(
        ['B', 'C', 'D'].map((v) => createTestNode(v)),
        Operator.OR,
      );
      tree.add(createTestNode('A'), OR);

      // Then
      expect(tree.serialized).toBe(
        JSON.stringify({
          children: [
            { type: 'node', value: 'A' },
            {
              children: [
                { type: 'node', value: 'B' },
                { type: 'node', value: 'C' },
                { type: 'node', value: 'D' },
              ],
              type: 'group',
              operator: 'OR',
            },
          ],
          type: 'group',
          operator: 'AND',
        }),
      );
    });
  });
  describe('deserialize', () => {
    it('deserializes a simple tree', () => {
      // Given
      const serialized = JSON.stringify({
        children: [
          { type: 'node', value: 'A' },
          { type: 'node', value: 'B' },
        ],
        type: 'group',
        operator: 'AND',
      });

      // When
      const tree = Tree.deserialize<string>(serialized, createTestGroup);

      // Then
      expect(tree.serialized).toBe(serialized);
    });

    it('deserializes a tree with OR groups', () => {
      // Given
      const serialized = JSON.stringify({
        children: [
          { type: 'node', value: 'A' },
          {
            children: [
              { type: 'node', value: 'B' },
              { type: 'node', value: 'C' },
            ],
            type: 'group',
            operator: 'OR',
          },
        ],
        type: 'group',
        operator: 'AND',
      });

      // When
      const tree = Tree.deserialize<string>(serialized, createTestGroup);

      // Then
      expect(tree.serialized).toBe(serialized);
      expect(tree.root.children.length).toBe(2);
      expect(tree.leafNodes.length).toBe(3);
    });

    it('deserializes a complex nested structure', () => {
      // Given
      const tree1 = new Tree<string>(createTestGroup);
      const A = createTestNode('A');
      const OR1 = createTestGroup([createTestNode('B'), createTestNode('C')], Operator.OR);
      const OR2 = createTestGroup([createTestNode('D'), createTestNode('E')], Operator.OR);
      tree1.add(A, OR1, OR2);

      // When
      const serialized = tree1.serialized;
      const tree2 = Tree.deserialize<string>(serialized, createTestGroup);

      // Then
      expect(tree2.serialized).toBe(serialized);
      expect(tree2.leafNodes.length).toBe(5);
    });

    it('maintains parent references', () => {
      // Given
      const serialized = JSON.stringify({
        children: [
          {
            children: [
              { type: 'node', value: 'A' },
              { type: 'node', value: 'B' },
            ],
            type: 'group',
            operator: 'OR',
          },
        ],
        type: 'group',
        operator: 'AND',
      });

      // When
      const tree = Tree.deserialize<string>(serialized, createTestGroup);

      // Then
      const nodeA = tree.find((node) => 'value' in node && node.value === 'A') as TestNode;
      expect(nodeA).toBeDefined();
      expect(nodeA.parent).toBeDefined();
      expect(nodeA.parent?.operator).toBe(Operator.OR);
      expect(nodeA.parent?.parent).toBe(tree.root);
    });

    it('throws error for invalid JSON', () => {
      // Then
      expect(() => {
        Tree.deserialize<string>('invalid json', createTestGroup);
      }).toThrow();
    });

    it('deserializes an empty tree', () => {
      // Given
      const serialized = JSON.stringify({
        children: [],
        type: 'group',
        operator: 'AND',
      });

      // When
      const tree = Tree.deserialize<string>(serialized, createTestGroup);

      // Then
      expect(tree.serialized).toBe(serialized);
      expect(tree.root.children.length).toBe(0);
      expect(tree.leafNodes.length).toBe(0);
    });

    it('round-trip: serialize then deserialize produces identical tree', () => {
      // Given
      const tree1 = new Tree<string>(createTestGroup);
      const OR = createTestGroup(
        ['B', 'C', 'D'].map((v) => createTestNode(v)),
        Operator.OR,
      );
      tree1.add(createTestNode('A'), OR);

      // When
      const tree2 = Tree.deserialize<string>(tree1.serialized, createTestGroup);

      // Then
      expect(tree2.serialized).toBe(tree1.serialized);
      expect(tree2.leafNodes.length).toBe(tree1.leafNodes.length);

      const leaves1 = tree1.leafNodes;
      const leaves2 = tree2.leafNodes;
      leaves1.forEach((leaf, i) => {
        expect('value' in leaf ? leaf.value : undefined).toBe(
          'value' in leaves2[i] ? leaves2[i].value : undefined,
        );
      });
    });
  });
});
