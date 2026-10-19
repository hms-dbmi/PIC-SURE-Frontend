export type TreeSelection = 'multi' | 'single';

/** A node as callers describe it. Without `children` it is a leaf; with `lazy` its children load on first use. */
export interface TreeNodeInit<T> {
  /** What's shown is `label`; `name` and `value` go into testids and the inputs' attributes. */
  name: string;
  value: string;
  label: string;
  payload: T;
  children?: TreeNodeInit<T>[];
  lazy?: boolean;
  open?: boolean;
  selected?: boolean;
  disabled?: boolean;
}

export interface TreeModelOptions<T> {
  nodes: TreeNodeInit<T>[];
  selection: TreeSelection;
  /** Called with a lazy node's payload; null or an empty list makes it a leaf. */
  loadChildren?: (payload: T) => Promise<TreeNodeInit<T>[] | null | undefined>;
  /** Fired for each leaf that a selection reaches (single select: for the chosen node). */
  onselect?: (payload: T) => void;
  onunselect?: (payload: T) => void;
  /** Multi select only: selecting a parent also opens it. */
  expandOnSelect?: boolean;
}

export class TreeNode<T> {
  readonly key: number;
  readonly name: string;
  readonly value: string;
  readonly label: string;
  readonly payload: T;
  readonly parent: TreeNode<T> | undefined;
  readonly level: number;
  open = $state(false);
  selected = $state(false);
  disabled = $state(false);
  isLeaf = $state(false);
  children: TreeNode<T>[] = $state([]);
  childrenLoaded = $state(false);
  loading = $state(false);
  error: string | null = $state(null);
  #model: TreeModel<T>;

  constructor(model: TreeModel<T>, init: TreeNodeInit<T>, parent?: TreeNode<T>) {
    this.#model = model;
    this.key = model.nextKey();
    this.name = init.name;
    this.value = init.value;
    this.label = init.label;
    this.payload = init.payload;
    this.parent = parent;
    this.level = parent ? parent.level + 1 : 1;
    this.open = init.open ?? false;
    this.selected = init.selected ?? false;
    this.disabled = init.disabled ?? false;
    if (init.children?.length) {
      this.children = init.children.map((child) => new TreeNode(model, child, this));
      this.childrenLoaded = true;
    } else {
      this.isLeaf = !init.lazy;
    }
  }

  someSelected: boolean = $derived.by(() => {
    if (this.isLeaf) return this.selected;
    return this.children.some((child) => child.someSelected || child.selected);
  });

  allSelected: boolean = $derived.by(() => {
    if (this.isLeaf || this.children.length === 0) return this.selected;
    return this.children.every((child) => child.allSelected);
  });

  /** The `aria-checked` value: single select reports the node itself, multi select its leaves. */
  checked: boolean | 'mixed' = $derived.by(() => {
    if (this.#model.selection === 'single') return this.selected;
    if (this.allSelected) return true;
    return this.someSelected && this.children.length > 0 ? 'mixed' : false;
  });

  allDisabled: boolean = $derived.by(() => {
    if (this.children.length === 0) return this.disabled;
    return this.children.every((child) => child.allDisabled);
  });

  hasLoading: boolean = $derived.by(
    () => this.loading || this.children.some((child) => child.hasLoading),
  );

  /** Disabled nodes still open if their children are loaded; there's nothing to show otherwise. */
  canToggle: boolean = $derived(
    !this.isLeaf && !this.hasLoading && (this.childrenLoaded || !this.disabled),
  );

  /** Like the checkbox: not while anything below is still loading. */
  canSelect: boolean = $derived(!this.allDisabled && !this.hasLoading);

  // A parent that's still loading has a select or open in flight; a second one would find no
  // children yet and select the parent itself.
  async select(): Promise<void> {
    if (this.disabled || this.loading) return;
    if (this.#model.selection === 'single') {
      this.#model.selectOnly(this);
      return;
    }
    if (!this.isLeaf) {
      await this.#loadChildren();
      if (this.error) return;
      if (this.children.length > 0) {
        await Promise.all(this.children.map((child) => child.select()));
        if (this.#model.expandOnSelect) this.open = true;
        return;
      }
    }
    this.#model.onselect?.(this.payload);
    this.selected = true;
  }

  async unselect(): Promise<void> {
    if (this.disabled || this.loading) return;
    if (!this.isLeaf) {
      await this.#loadChildren();
      if (this.error) return;
      if (this.children.length > 0) {
        await Promise.all(this.children.map((child) => child.unselect()));
        return;
      }
    }
    this.selected = false;
    this.#model.onunselect?.(this.payload);
  }

  async toggleSelected(): Promise<void> {
    if (this.#model.selection === 'multi' && this.allSelected) {
      await this.unselect();
    } else {
      await this.select();
    }
  }

  async toggleOpen(): Promise<void> {
    if (!this.canToggle) return;
    if (this.open) {
      this.open = false;
      return;
    }
    await this.#loadChildren();
    this.open = true;
  }

  async #loadChildren(): Promise<void> {
    const load = this.#model.loadChildren;
    if (!load || this.childrenLoaded || this.loading || this.isLeaf || this.disabled) return;

    this.loading = true;
    this.error = null;
    try {
      const children = await load(this.payload);
      this.isLeaf = !children?.length;
      this.children = children?.map((child) => new TreeNode(this.#model, child, this)) ?? [];
      this.childrenLoaded = true;
    } catch (err) {
      // never the error's message: an API error's is the raw response body
      this.error = 'Failed to load children';
      console.error('Error loading children for', this.value, err);
    } finally {
      this.loading = false;
    }
  }
}

/** Selection, expansion and keyboard focus for one tree (WAI-ARIA tree pattern). */
export class TreeModel<T> {
  readonly selection: TreeSelection;
  readonly loadChildren: TreeModelOptions<T>['loadChildren'];
  readonly onselect: TreeModelOptions<T>['onselect'];
  readonly onunselect: TreeModelOptions<T>['onunselect'];
  readonly expandOnSelect: boolean;
  readonly roots: TreeNode<T>[];
  /** The node that last had focus; it keeps the tree's single tab stop. */
  active: TreeNode<T> | undefined = $state();
  #keys = 0;

  constructor(options: TreeModelOptions<T>) {
    this.selection = options.selection;
    this.loadChildren = options.loadChildren;
    this.onselect = options.onselect;
    this.onunselect = options.onunselect;
    this.expandOnSelect = options.expandOnSelect ?? false;
    this.roots = options.nodes.map((node) => new TreeNode(this, node));
  }

  nextKey(): number {
    return this.#keys++;
  }

  visible: TreeNode<T>[] = $derived.by(() => {
    const out: TreeNode<T>[] = [];
    const walk = (nodes: TreeNode<T>[]) => {
      for (const node of nodes) {
        out.push(node);
        if (node.open) walk(node.children);
      }
    };
    walk(this.roots);
    return out;
  });

  tabStop: TreeNode<T> | undefined = $derived(
    this.active && this.visible.includes(this.active)
      ? this.active
      : (this.visible.find((node) => node.checked === true) ?? this.visible[0]),
  );

  selectOnly(target: TreeNode<T>): void {
    const clear = (nodes: TreeNode<T>[]) => {
      for (const node of nodes) {
        if (node !== target) node.selected = false;
        clear(node.children);
      }
    };
    clear(this.roots);
    target.selected = true;
    this.onselect?.(target.payload);
  }

  /**
   * Handles a tree key for the focused node and returns the node that should take focus, or
   * undefined if the key isn't one the tree handles.
   */
  keydown(key: string, node: TreeNode<T>): TreeNode<T> | undefined {
    const at = this.visible.indexOf(node);
    switch (key) {
      case 'ArrowDown':
        return this.visible[at + 1] ?? node;
      case 'ArrowUp':
        return this.visible[at - 1] ?? node;
      case 'Home':
        return this.visible[0];
      case 'End':
        return this.visible[this.visible.length - 1];
      case 'ArrowRight':
        if (node.isLeaf) return node;
        if (!node.open) {
          void node.toggleOpen();
          return node;
        }
        return node.children[0] ?? node;
      case 'ArrowLeft':
        if (node.open && !node.isLeaf) {
          node.open = false;
          return node;
        }
        return node.parent ?? node;
      case ' ':
        if (node.canSelect) void node.toggleSelected();
        return node;
      case 'Enter':
        if (node.isLeaf) {
          if (node.canSelect) void node.toggleSelected();
        } else {
          void node.toggleOpen();
        }
        return node;
      default:
        return undefined;
    }
  }
}
