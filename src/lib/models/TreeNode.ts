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
