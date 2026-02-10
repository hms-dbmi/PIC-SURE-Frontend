import { Operator, type OperatorType } from '$lib/models/query/Query';

export interface LogicNode<T> {
  parent: LogicGroup<T> | undefined;
}

export interface LogicGroup<T> extends LogicNode<T> {
  children: T[];
  operator: OperatorType;
}

interface SerializedTree {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  children?: SerializedTree[];
  operator?: OperatorType;
  parent?: SerializedTree;
}

export class LogicTree<T extends LogicNode<T>> {
  root = $state<T & LogicGroup<T>>() as T & LogicGroup<T>;
  createGroup: (nodes: T[], operator: OperatorType) => T & LogicGroup<T>;

  constructor(createGroup: (nodes: T[], operator: OperatorType) => T & LogicGroup<T>) {
    this.createGroup = createGroup;
    this.root = createGroup([], Operator.AND);
  }

  get hasOr(): boolean {
    const hasORChild = (node: T) => {
      if (this.isGroup(node)) {
        if (node.operator === Operator.OR) return true;
        return node.children.some(hasORChild);
      }
      return false;
    };

    return hasORChild(this.root);
  }

  isGroup(node: T): node is T & LogicGroup<T> {
    return node && 'children' in node;
  }

  add(...nodes: T[]) {
    nodes.forEach((node) => {
      node.parent = this.root;
      this.root.children.push(node);
    });
  }

  remove(...toRemove: T[]) {
    toRemove.forEach((node) => {
      if (node.parent === undefined) {
        return;
      }

      // Try to find the node index by reference
      let index = node.parent.children.indexOf(node);

      // If not found by reference, try by UUID if available
      if (index === -1) {
        index = node.parent.children.findIndex((child) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const childUuid = (child as any).uuid;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const nodeUuid = (node as any).uuid;
          return childUuid && nodeUuid && childUuid === nodeUuid;
        });
      }

      if (index !== -1) {
        node.parent.children.splice(index, 1);
      }
    });
    this.pruneTree();
  }

  update(oldNode: T, newNode: T) {
    const parent = oldNode.parent;

    this.transferChildrenIfGroups(oldNode, newNode);
    newNode.parent = parent;

    if (parent === undefined) {
      // root node
      this.root = newNode as T & LogicGroup<T>;
      return;
    }

    const index = parent.children.indexOf(oldNode);
    if (index === -1) return;
    parent.children[index] = newNode;
  }

  // Prune nodes with less than 2 children,
  // move children with no siblings to their grandparent and remove empty groups
  pruneTree() {
    const mutateIfIsolatedOrEmpty = (node: T) => {
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

  private transferChildrenIfGroups(oldNode: T, newNode: T) {
    if (!this.isGroup(oldNode) || !this.isGroup(newNode)) return;

    if (newNode.children.length === 0) {
      newNode.children = oldNode.children;
      newNode.children.forEach((child) => (child.parent = newNode));
    }
  }

  private moveChildToGrandparent(childNode: T) {
    if (childNode.parent === undefined || childNode.parent.parent === undefined) {
      // child is orphaned or parent is root node - cannot move
      return;
    }

    const siblingCount = childNode.parent.children.length;
    const indexOfChildGroup = childNode.parent.parent.children.indexOf(
      childNode.parent as unknown as T,
    );
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

  private newOrGroup(sibA: T, sibB: T) {
    const newOrGroup = this.createGroup([sibA, sibB], Operator.OR);
    this.root.children.splice(this.root.children.indexOf(sibA), 1);
    this.root.children.splice(this.root.children.indexOf(sibB), 1, newOrGroup);
    newOrGroup.parent = this.root;
    sibA.parent = newOrGroup;
    sibB.parent = newOrGroup;
  }

  private splitOrCollapseOrGroup(sibA: T, sibB: T) {
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
        const newIndex = sibA.parent.parent.children.indexOf(sibA.parent as unknown as T);
        sibA.parent.parent.children.splice(newIndex + 1, 0, secondGroup);
        sibA.parent.children = sibA.parent.children.slice(0, aIndex + 1);
      }
      secondGroup.parent = sibA.parent.parent;
    }
  }

  private mergeOrGroups(sibA: T & LogicGroup<T>, sibB: T & LogicGroup<T>) {
    if (sibA.parent === undefined || sibB.parent === undefined) return;

    sibA.children.push(...(sibB.children || []));
    this.root.children = this.root.children.filter((child) => child !== (sibB as T));
    sibB.children.forEach((child) => (child.parent = sibA));
  }

  private mergeNodeIntoOrGroup(sibA: T, sibB: T) {
    const [orGroup, andNode] = this.isGroup(sibA)
      ? [sibA, sibB]
      : [sibB as T & LogicGroup<T>, sibA];
    if (andNode.parent === undefined || orGroup.parent === undefined) return;

    const andNodeIndex = andNode.parent.children.indexOf(andNode);
    const orGroupIndex = andNode.parent.children.indexOf(orGroup as T);
    const index = andNodeIndex > orGroupIndex ? orGroup.children.length : 0;
    orGroup.children.splice(index, 0, andNode);
    andNode.parent.children = andNode.parent.children.filter((child) => child !== andNode);
    andNode.parent = orGroup;
  }

  // Swaps the AND/OR grouping of two adjacent siblings
  // You'll notice, we don't really need to know the intended operator
  // because we can infer where siblings should go based on parent operators
  toggleOperator(sibA: T, sibB: T) {
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

  find(searchMethod: (node: T) => boolean): T | undefined {
    const search = (node: T): T | undefined => {
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

  get leafNodes(): T[] {
    const leaves = (node: T): T[] => {
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

  static deserialize<T extends LogicNode<T>>(
    serialized: string,
    createGroup: (nodes: T[], operator: OperatorType) => T & LogicGroup<T>,
  ): LogicTree<T> {
    const tree = new LogicTree<T>(createGroup);

    const reconstruct = (nodeData: SerializedTree): T => {
      if (nodeData.children) {
        // It is a group
        const children = nodeData.children.map(reconstruct);
        const group = createGroup(children, nodeData.operator || Operator.AND);

        const { children: rawChildren, parent: rawParent, ...restData } = nodeData;
        Object.assign(group, restData);

        children.forEach((child) => (child.parent = group));

        return group;
      } else {
        // It is a leaf node
        const { parent, children, ...rest } = nodeData;
        const leaf = { ...rest, parent: undefined } as unknown as T;
        return leaf;
      }
    };

    const parsedData = JSON.parse(serialized) as SerializedTree;
    tree.root = reconstruct(parsedData) as T & LogicGroup<T>;

    return tree;
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */
}
