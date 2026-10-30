import { createContext, type Snippet } from 'svelte';
import type { Column, Row, TableEvents } from './types.ts';

// What each row of a DataTable reads from its table.
export interface TableContext<T extends Row = Row> {
  readonly id: string;
  readonly columns: Column<T>[];
  readonly clickable: boolean;
  readonly rowClickKeys: string[];
  readonly expandedRow: Snippet<[T]> | undefined;
  isExpanded(row: T): boolean;
  tabindex(index: number): number;
  activate(row: T): void;
}

export const [getTableContext, setTableContext] = createContext<TableContext>();

export const [getTableEvents, setTableEvents, hasTableEvents] = createContext<TableEvents>();
