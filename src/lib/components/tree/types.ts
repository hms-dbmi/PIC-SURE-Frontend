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
  select: () => void;
  unselect: () => void;
  toggleSelected: () => void;
  toggleOpen: () => void;
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
