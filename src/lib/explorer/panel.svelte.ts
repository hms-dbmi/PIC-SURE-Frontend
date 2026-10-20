import { assertNoSsrWrite } from '#lib/utils/ssrWrite.ts';

/** What an expanded search-result row shows under it. */
export type RowView = 'info' | 'filter' | 'hierarchy';

/** The explorer's results side panel, and the one table row expanded at a time. */
class ExplorerPanel {
  #open = $state(false);
  #table = $state('');
  #row = $state('');
  #view: RowView = $state('info');

  get open() {
    return this.#open;
  }

  get activeTable() {
    return this.#table;
  }

  get activeRow() {
    return this.#row;
  }

  get activeView() {
    return this.#view;
  }

  show() {
    assertNoSsrWrite('explorerPanel');
    this.#open = true;
  }

  hide() {
    assertNoSsrWrite('explorerPanel');
    this.#open = false;
  }

  /** Returns whether the panel is now open. */
  toggle(): boolean {
    assertNoSsrWrite('explorerPanel');
    this.#open = !this.#open;
    return this.#open;
  }

  isExpanded(table: string, row: string | undefined): boolean {
    return !!row && this.#table === table && this.#row === row;
  }

  /**
   * Expands `row`, or collapses it when it's already expanded with the same view and table.
   * Without a `view` a row shows its info; without a `table` the active table is kept.
   */
  toggleRow(row: string, { view, table }: { view?: RowView; table?: string } = {}) {
    assertNoSsrWrite('explorerPanel');
    const sameView = !view || this.#view === view;
    const sameTable = !table || this.#table === table;
    if (this.#row === row && sameView && sameTable) {
      this.closeRow();
      return;
    }
    this.#row = row;
    if (table) this.#table = table;
    this.#view = view ?? 'info';
  }

  closeRow() {
    assertNoSsrWrite('explorerPanel');
    this.#row = '';
    this.#view = 'info';
  }
}

export const explorerPanel = new ExplorerPanel();
