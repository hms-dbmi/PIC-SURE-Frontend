import { Operator, type OperatorType } from '$lib/models/query/Query';

export interface TreeNode<T> {
  parent: TreeGroup<T> | undefined;
}

export interface TreeGroup<T> extends TreeNode<T> {
  children: TreeNode<T>[];
  operator: OperatorType;
}

interface SerializedTree {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  children?: SerializedTree[];
  operator?: OperatorType;
  parent?: SerializedTree;
}

export class Tree<T> {
  root: TreeGroup<T>;
  createGroup: (nodes: TreeNode<T>[], operator: OperatorType) => TreeGroup<T>;

  constructor(createGroup: (nodes: TreeNode<T>[], operator: OperatorType) => TreeGroup<T>) {
    this.root = createGroup([], Operator.AND);
    this.createGroup = createGroup;
  }

  isGroup(node: TreeNode<T>): node is TreeGroup<T> {
    return node && 'children' in node;
  }

  add(...nodes: TreeNode<T>[]) {
    nodes.forEach((node) => {
      node.parent = this.root;
      this.root.children.push(node);
    });
  }

  remove(...toRemove: TreeNode<T>[]) {
    toRemove.forEach((node) => {
      if (node.parent === undefined) return;
      node.parent.children = node.parent.children.filter((child) => child !== node);
    });
    this.pruneTree();
  }

  update(oldNode: TreeNode<T>, newNode: TreeNode<T>) {
    const parent = oldNode.parent;

    this.transferChildrenIfGroups(oldNode, newNode);
    newNode.parent = parent;

    if (parent === undefined) {
      // root node
      this.root = newNode as TreeGroup<T>;
      return;
    }

    const index = parent.children.indexOf(oldNode);
    if (index === -1) return;
    parent.children[index] = newNode;
  }

  // Prune nodes with less than 2 children,
  // move children with no siblings to their grandparent and remove empty groups
  pruneTree() {
    const mutateIfIsolatedOrEmpty = (node: TreeNode<T>) => {
      if (this.isGroup(node)) {
        node.children.forEach(mutateIfIsolatedOrEmpty);

        // move isolated children
        if (node.children.length === 1) {
          this.moveChildToGrandparent(node.children[0]);
        }

        // remove empty groups
        if (node.children.length === 0 && node.parent) {
          node.parent.children = node.parent.children.filter((child) => child !== node);
        }
      }
    };

    this.root.children.forEach(mutateIfIsolatedOrEmpty);
  }

  private transferChildrenIfGroups(oldNode: TreeNode<T>, newNode: TreeNode<T>) {
    if (!this.isGroup(oldNode) || !this.isGroup(newNode)) return;

    if (newNode.children.length === 0) {
      newNode.children = oldNode.children;
      newNode.children.forEach((child) => (child.parent = newNode));
    }
  }

  private moveChildToGrandparent(childNode: TreeNode<T>) {
    if (childNode.parent === undefined || childNode.parent.parent === undefined) {
      // child is orphaned or parent is root node - cannot move
      return;
    }

    const siblingCount = childNode.parent.children.length;
    const indexOfChildGroup = childNode.parent.parent.children.indexOf(childNode.parent);
    if (indexOfChildGroup < 0) {
      console.error('Tree may be malformed');
      return;
    }

    // auto prune child's group if it's the only child
    // divorce child, insert into grandparent's children, reassign parent
    childNode.parent.children = childNode.parent.children.filter((child) => child !== childNode);
    childNode.parent.parent.children.splice(
      indexOfChildGroup,
      siblingCount === 1 ? 1 : 0,
      childNode,
    );
    childNode.parent = childNode.parent.parent;
  }

  private newOrGroup(sibA: TreeNode<T>, sibB: TreeNode<T>) {
    const newOrGroup = this.createGroup([sibA, sibB], Operator.OR);
    this.root.children.splice(this.root.children.indexOf(sibA), 1);
    this.root.children.splice(this.root.children.indexOf(sibB), 1, newOrGroup);
    newOrGroup.parent = this.root;
    sibA.parent = newOrGroup;
    sibB.parent = newOrGroup;
  }

  private splitOrCollapseOrGroup(sibA: TreeNode<T>, sibB: TreeNode<T>) {
    if (sibA.parent === undefined || sibB.parent === undefined) return;

    if (sibA.parent.children.length === 2) {
      // collapse both siblings into grandparent
      this.moveChildToGrandparent(sibA);
      this.moveChildToGrandparent(sibB);
    } else if (sibA.parent.children.length > 2) {
      // split group into two
      const aIndex = sibA.parent.children.indexOf(sibA);
      const bIndex = sibB.parent.children.indexOf(sibB);
      const secondGroupChildren = sibB.parent.children.slice(bIndex);
      const secondGroup = this.createGroup(secondGroupChildren, Operator.OR);
      secondGroupChildren.forEach((child) => (child.parent = secondGroup));
      if (sibA.parent.parent) {
        const newIndex = sibA.parent.parent.children.indexOf(sibA.parent);
        sibA.parent.parent.children.splice(newIndex + 1, 0, secondGroup);
        sibA.parent.children = sibA.parent.children.slice(0, aIndex + 1);
      }
      secondGroup.parent = sibA.parent.parent;
    }
  }

  private mergeOrGroups(sibA: TreeGroup<T>, sibB: TreeGroup<T>) {
    if (sibA.parent === undefined || sibB.parent === undefined) return;

    sibA.children.push(...(sibB.children || []));
    this.root.children = this.root.children.filter((child) => child !== sibB);
    sibB.children.forEach((child) => (child.parent = sibA));
  }

  private mergeNodeIntoOrGroup(sibA: TreeNode<T>, sibB: TreeNode<T>) {
    const [orGroup, andNode] = this.isGroup(sibA)
      ? [sibA as TreeGroup<T>, sibB]
      : [sibB as TreeGroup<T>, sibA];
    if (andNode.parent === undefined || orGroup.parent === undefined) return;

    const andNodeIndex = andNode.parent.children.indexOf(andNode);
    const orGroupIndex = andNode.parent.children.indexOf(orGroup);
    const index = andNodeIndex > orGroupIndex ? orGroup.children.length : 0;
    orGroup.children.splice(index, 0, andNode);
    andNode.parent.children = andNode.parent.children.filter((child) => child !== andNode);
    andNode.parent = orGroup;
  }

  // Swaps the AND/OR grouping of two adjacent siblings
  // You'll notice, we don't really need to know the intended operator
  // because we can infer where siblings should go based on parent operators
  toggleOperator(sibA: TreeNode<T>, sibB: TreeNode<T>) {
    // both siblings should be part of a group and should therefore have parents.
    if (sibA.parent === undefined || sibB.parent === undefined) return;

    if (!this.isGroup(sibA) && !this.isGroup(sibB)) {
      if (sibA.parent.operator === Operator.AND) {
        // A & B are Nodes in AND group
        this.newOrGroup(sibA, sibB);
      } else {
        // A & B are Nodes in OR group
        this.splitOrCollapseOrGroup(sibA, sibB);
      }
    } else if (this.isGroup(sibA) && this.isGroup(sibB)) {
      // A & B are both Or groups
      this.mergeOrGroups(sibA, sibB);
    } else {
      // A or B is Group, the other is Node
      this.mergeNodeIntoOrGroup(sibA, sibB);
    }

    this.pruneTree();
  }

  find(searchMethod: (node: TreeNode<T>) => boolean): TreeNode<T> | undefined {
    const search = (node: TreeNode<T>): TreeNode<T> | undefined => {
      if (searchMethod(node)) return node;

      if (this.isGroup(node)) {
        for (const child of node.children) {
          const result = search(child);
          if (result) {
            return result;
          }
        }
      }

      return undefined;
    };

    return search(this.root);
  }

  get leafNodes(): TreeNode<T>[] {
    const leaves = (node: TreeNode<T>): TreeNode<T>[] => {
      if (this.isGroup(node)) {
        return node.children.flatMap((child) => leaves(child));
      }

      return [node];
    };
    return leaves(this.root);
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  get serialized(): string {
    const toObj = (node: SerializedTree): any => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { parent, children, ...objData } = node as SerializedTree;
      if (children) {
        return {
          children: children?.map(toObj),
          ...objData,
        };
      }
      return objData;
    };
    return JSON.stringify(toObj(this.root));
  }

  static deserialize<T>(
    serialized: string,
    createGroup: (nodes: TreeNode<T>[], operator: OperatorType) => TreeGroup<T>,
  ): Tree<T> {
    const tree = new Tree<T>(createGroup);
    const linkParents = (node: TreeNode<T>, parent?: TreeGroup<T>) => {
      if (tree.isGroup(node)) {
        node.children.forEach((child) => linkParents(child, node));
      }
      node.parent = parent;
    };
    const parsed: TreeGroup<T> = JSON.parse(serialized) as TreeGroup<T>;
    linkParents(parsed);
    tree.root = parsed;
    return tree;
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */
}
