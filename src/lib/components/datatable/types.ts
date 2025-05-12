import type { Indexable } from '$lib/types';

export interface Column {
  dataElement: string;
  label: string;
  class?: string;
  sort?: boolean;
  filter?: boolean;
}

export interface TableProps {
  tableName: string;
  isLoading?: boolean;
  searchable?: boolean;
  title?: string;
  fullWidth?: boolean;
  options?: number[];
  columns?: Column[];
  cellOverides?: Indexable;
  tableAuto?: boolean;
  stickyHeader?: boolean;
  showPagination?: boolean;
  class?: string;
  isClickable?: boolean;
  expandable?: boolean;
  rowClickHandler?: (row: Indexable) => void;
  tableActions?: import('svelte').Snippet;
}
