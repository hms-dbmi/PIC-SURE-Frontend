import type { RowExpansion } from '#lib/ui/datatable/types.ts';
import { assertNoSsrWrite } from '#lib/utils/ssrWrite.ts';

/** What an expanded search-result row shows under it. */
export type RowView = 'info' | 'filter' | 'hierarchy';

/** The explorer's results side panel, and the one search-result row expanded at a time. */
class ExplorerPanel implements RowExpansion {
  #open = $state(false);
  #row = $state('');
  #view: RowView = $state('info');

  get open() {
    return this.#open;
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

  isExpanded(row: string | undefined): boolean {
    return !!row && this.#row === row;
  }

  /**
   * Expands `row`, or collapses it when it's already expanded with the same view. Without a
   * `view` a row shows its info.
   */
  toggleRow(row: string, view?: RowView) {
    assertNoSsrWrite('explorerPanel');
    if (this.#row === row && (!view || this.#view === view)) {
      this.closeRow();
      return;
    }
    this.#row = row;
    this.#view = view ?? 'info';
  }

  closeRow() {
    assertNoSsrWrite('explorerPanel');
    this.#row = '';
    this.#view = 'info';
  }
}

export const explorerPanel = new ExplorerPanel();
