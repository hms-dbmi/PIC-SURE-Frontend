import type { Indexable } from '#lib/utils/objects.ts';

export interface Column {
  dataElement: string;
  label: string;
  class?: string;
  sort?: boolean;
  filter?: boolean;
}

export interface TableProps {
  // Also the rows-per-page storage key and the fallback caption.
  tableName: string;
  // The table's DOM id (unique by default); its rows are `<id>-row-<n>`.
  id?: string;
  'data-testid'?: string;
  isLoading?: boolean;
  searchable?: boolean;
  title?: string;
  ariaLabel?: string;
  fullWidth?: boolean;
  options?: number[];
  columns?: Column[];
  cellOverides?: Indexable;
  stickyHeader?: boolean;
  showPagination?: boolean;
  class?: string;
  isClickable?: boolean;
  // Rendered under the row the explorer panel has expanded in this table.
  expandedRow?: import('svelte').Snippet<[Indexable]>;
  rowClickHandler?: (row: Indexable) => void;
  rowClickKeys?: string[];
  tableActions?: import('svelte').Snippet;
  searchLogAction?: string;
  rowClickLogAction?: string;
  onPageChange?: () => void;
}
