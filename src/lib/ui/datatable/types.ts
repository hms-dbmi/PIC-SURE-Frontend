import type { Snippet } from 'svelte';
import type { Row, TableHandler } from '@vincjo/datatables';
import type { TableHandler as ServerTableHandler } from '@vincjo/datatables/server';

export type { Row };

export type AnyTableHandler<T extends Row = Row> = TableHandler<T> | ServerTableHandler<T>;

export interface Column<T extends Row = Row> {
  dataElement: Extract<keyof T, string>;
  label: string;
  class?: string;
  sort?: boolean;
  filter?: boolean;
  // Renders the cell. Without it the cell shows the row's `dataElement` value.
  cell?: Snippet<[T]>;
}

// The one expanded row of a table, kept by the table's owner so it can close it from elsewhere.
export interface RowExpansion {
  // The expanded row's key, or '' when none is.
  readonly activeRow: string;
  toggleRow(key: string): void;
  closeRow(): void;
}

// Where every table reports paging, so ui/ doesn't depend on telemetry. Set once by the app.
export interface TableEvents {
  pageChange(page: number): void;
  pageSizeChange(size: number): void;
}

export interface TableProps<T extends Row> {
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
  columns?: Column<T>[];
  stickyHeader?: boolean;
  showPagination?: boolean;
  class?: string;
  isClickable?: boolean;
  // Identifies a row for `expansion`.
  rowKey?: Extract<keyof T, string>;
  expansion?: RowExpansion;
  // Rendered under the row `expansion` has expanded.
  expandedRow?: Snippet<[T]>;
  rowClickHandler?: (row: T) => void;
  rowClickKeys?: string[];
  tableActions?: Snippet;
  // Called with the search term once typing pauses.
  onsearch?: (term: string) => void;
  onPageChange?: () => void;
}
