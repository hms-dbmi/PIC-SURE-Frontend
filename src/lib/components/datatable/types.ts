import type { Indexable } from '$lib/types';

export interface Column {
  dataElement: string;
  label: string;
  class?: string;
  sort?: boolean;
  filter?: boolean;
}

/**
 * How a page change was asked for.
 *
 * A consumer that moves focus onto the new page needs to know: a keyboard user has just
 * activated Next and has nothing under a cursor to go back to, so leaving focus behind drops
 * them at the top of the document; a mouse user still has their pointer where they left it and
 * must not have focus taken from them.
 */
export type PageChangeSource = 'mouse' | 'keyboard';

export interface TableProps {
  tableName: string;
  isLoading?: boolean;
  searchable?: boolean;
  title?: string;
  ariaLabel?: string;
  fullWidth?: boolean;
  options?: number[];
  columns?: Column[];
  cellOverides?: Indexable;
  tableAuto?: boolean;
  stickyHeader?: boolean;
  showPagination?: boolean;
  class?: string;
  isClickable?: boolean;
  rowClickHandler?: (row: Indexable) => void;
  rowClickKeys?: string[];
  tableActions?: import('svelte').Snippet;
  searchLogAction?: string;
  rowClickLogAction?: string;
  onPageChange?: (source: PageChangeSource) => void;
}
