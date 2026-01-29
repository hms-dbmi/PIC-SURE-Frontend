export interface TreeNodeInterface {
  name: string;
  value: string;
  open: boolean;
  selected: boolean;
  disabled: boolean;
  children: TreeNodeInterface[];
  isLeaf: boolean;
  someSelected: boolean;
  allSelected: boolean;
  noneSelected: boolean;
  indeterminant: boolean;
  someSelectedNotDisabled: boolean;
  select: () => void | Promise<void>;
  unselect: () => void | Promise<void>;
  toggleSelected: () => void | Promise<void>;
  toggleOpen: () => void | Promise<void>;
}

export interface NodeInterface {
  name: string;
  value: string;
  children: NodeInterface[];
  open: boolean;
  selected: boolean;
}

export interface RadioNodeInterface {
  name: string;
  value: string;
  selected: boolean;
  disabled: boolean;
  children: RadioNodeInterface[];
  isLeaf: boolean;
  select: () => void;
}

export interface RadioNodeData {
  name: string;
  value: string;
  children: RadioNodeData[];
  selected: boolean;
}
