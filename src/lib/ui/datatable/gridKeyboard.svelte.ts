import type { Attachment } from 'svelte/attachments';
import { on } from 'svelte/events';

import { createAnnouncer } from '#lib/ui/announcer.svelte.ts';
import { isFormField, isTextEntryField } from './keyboard.ts';
import type { AnyTableHandler, Row, RowExpansion } from './types.ts';

export interface GridKeyboardOptions<T extends Row> {
  readonly enabled: boolean;
  readonly id: string;
  readonly handler: AnyTableHandler<T>;
  readonly loading: boolean;
  readonly stickyHeader: boolean;
  readonly expansion: RowExpansion | undefined;
  onpagechange?(page: number): void;
}

const focusableSelector = 'a[href], button, input, select, textarea';

/**
 * The APG grid pattern for a table's rows: one roving tab stop, arrow keys between rows and
 * across pages, Home/End, left/right through a row's actions, and Escape to close the expanded
 * row. Attach `attach` to the `<table>`; rows take their tabindex from `tabindex(index)`.
 */
export class GridKeyboard<T extends Row> {
  readonly announcer = createAnnouncer({ repeat: true, clearAfter: 5000 });
  #options: GridKeyboardOptions<T>;
  #active = $state(0);
  #tbody: HTMLTableSectionElement | undefined;
  #pendingPageFocus: { page: number; rowsAtRequest: unknown } | null = null;

  constructor(options: GridKeyboardOptions<T>) {
    this.#options = options;
  }

  // Clamped, so the tab stop stays on a rendered row when the rows shrink.
  get activeRowIndex(): number {
    return Math.min(this.#active, Math.max(0, this.#options.handler.rows.length - 1));
  }

  tabindex(index: number): number {
    return this.#options.enabled && index === this.activeRowIndex ? 0 : -1;
  }

  attach: Attachment<HTMLTableElement> = (table) => {
    this.#tbody = table.tBodies[0];
    const thead = table.tHead;
    const onKeydown = (event: KeyboardEvent) => {
      if (!(event.target instanceof Node)) return;
      if (this.#tbody?.contains(event.target)) this.#onTbodyKeydown(event);
      else if (thead?.contains(event.target)) this.#onTheadKeydown(event);
    };
    // `on` keeps these in order with the rows' and panels' own delegated handlers, which run
    // first, so an inner widget can still claim Escape.
    const offKeydown = on(table, 'keydown', onKeydown);
    const offFocusin = on(table, 'focusin', (event) => this.#onFocusin(event));

    // Take the rows' interactive children out of the page tab order as rows render (they stay
    // reachable with the left/right arrow keys).
    $effect(() => {
      void this.#options.handler.rows;
      if (!this.#options.enabled) return;
      for (const rowElement of this.#dataRows()) {
        rowElement
          .querySelectorAll<HTMLElement>(focusableSelector)
          .forEach((element) => element.setAttribute('tabindex', '-1'));
      }
    });

    // After a keyboard-initiated page change, focus the first row of the new page once it has
    // rendered - in both directions, so focus lands where callers scroll to (see onPageChange
    // consumers) rather than fighting them for the viewport. The server handler updates
    // currentPage synchronously but replaces rows only after a debounced fetch (with a loading
    // placeholder in between), so the request stays pending until the rows identity actually
    // changes; a page mismatch at that point means the data changed for another reason (e.g. a
    // new search) and the focus request is stale.
    $effect(() => {
      const { handler, loading, enabled } = this.#options;
      void handler.rows;
      void loading;
      if (!enabled || !this.#pendingPageFocus) return;
      const { page, rowsAtRequest } = this.#pendingPageFocus;
      if (handler.rows === rowsAtRequest) return;
      if (handler.currentPage !== page) {
        this.#pendingPageFocus = null;
        return;
      }
      const rows = this.#dataRows();
      if (!rows.length) {
        // The loading placeholder is still rendered; retry when it clears.
        if (loading) return;
        this.#pendingPageFocus = null;
        return;
      }
      this.#pendingPageFocus = null;
      this.#focusRow(rows[0], 0);
      void this.announcer.announce(`Page ${handler.currentPage} of ${handler.pages?.length ?? 1}`);
    });

    return () => {
      offKeydown();
      offFocusin();
      this.#tbody = undefined;
    };
  };

  #dataRows(): HTMLTableRowElement[] {
    if (!this.#tbody) return [];
    return Array.from(
      this.#tbody.querySelectorAll<HTMLTableRowElement>(`tr[id^="${this.#options.id}-row-"]`),
    );
  }

  #focusRow(rowElement: HTMLTableRowElement, index: number) {
    this.#active = index;
    if (this.#options.stickyHeader) {
      const thead = this.#tbody?.parentElement?.querySelector('thead');
      if (thead instanceof HTMLElement) {
        rowElement.style.scrollMarginTop = `${thead.offsetHeight}px`;
      }
    }
    rowElement.focus();
    rowElement.scrollIntoView?.({ block: 'nearest' });
  }

  #pageByKeyboard(direction: 'previous' | 'next') {
    if (this.#pendingPageFocus) return; // a page change is already in flight (key repeat)
    const { handler } = this.#options;
    const lastPage = handler.pages?.length ?? 1;
    if (direction === 'next' && handler.currentPage >= lastPage) return;
    if (direction === 'previous' && handler.currentPage <= 1) return;
    this.#pendingPageFocus = {
      page: handler.currentPage + (direction === 'next' ? 1 : -1),
      rowsAtRequest: handler.rows,
    };
    handler.setPage(direction);
    this.#options.onpagechange?.(handler.currentPage);
  }

  #rowFocusables(rowElement: HTMLTableRowElement): HTMLElement[] {
    return Array.from(rowElement.querySelectorAll<HTMLElement>(focusableSelector)).filter(
      (element) => !('disabled' in element && (element as HTMLButtonElement).disabled),
    );
  }

  #closeExpandedRow() {
    const { expansion } = this.#options;
    if (!expansion?.activeRow) return;
    const owner = this.#tbody?.querySelector('tr.expandable-row')
      ?.previousElementSibling as HTMLElement | null;
    // Only pull focus back to the opener row when focus was on it or inside the closing panel; if
    // the user has arrowed to another row, leave them there.
    const current = document.activeElement;
    const currentRow = current instanceof HTMLElement ? current.closest('tr') : null;
    const onAnotherRow =
      currentRow instanceof HTMLTableRowElement &&
      currentRow !== owner &&
      this.#dataRows().includes(currentRow);
    expansion.closeRow();
    if (!onAnotherRow) owner?.focus();
  }

  #onFocusin(event: FocusEvent) {
    if (!this.#options.enabled || !(event.target instanceof HTMLElement)) return;
    const rowElement = event.target.closest('tr');
    if (!rowElement) return;
    const index = this.#dataRows().indexOf(rowElement as HTMLTableRowElement);
    if (index >= 0) this.#active = index;
  }

  // Sort headers are ordinary tab stops before the grid; ArrowDown from the header row drops
  // focus into the grid's active row so "tab to the table, press down" works on sortable tables
  // too.
  #onTheadKeydown(event: KeyboardEvent) {
    if (!this.#options.enabled || event.key !== 'ArrowDown') return;
    if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    if (isFormField(event.target)) return;
    const rows = this.#dataRows();
    const index = Math.min(this.activeRowIndex, rows.length - 1);
    if (index < 0) return;
    event.preventDefault();
    this.#focusRow(rows[index], index);
  }

  #onTbodyKeydown(event: KeyboardEvent) {
    if (!this.#options.enabled) return;
    if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    const target = event.target as HTMLElement;
    if (event.key === 'Escape') {
      // An inner widget (e.g. a combobox closing its dropdown) already used this press.
      if (event.defaultPrevented) return;
      if (isTextEntryField(target)) {
        // Per the APG grid pattern, the first Escape steps out of the field back to the row; a
        // second Escape then closes the panel.
        const fieldRow = target.closest('tr');
        const rowElement = fieldRow?.classList.contains('expandable-row')
          ? (fieldRow.previousElementSibling as HTMLElement | null)
          : fieldRow;
        if (rowElement) {
          event.preventDefault();
          rowElement.focus();
        }
        return;
      }
      this.#closeExpandedRow();
      return;
    }
    const rowElement = target.closest('tr');
    if (!rowElement || rowElement.classList.contains('expandable-row') || isFormField(target)) {
      return;
    }
    const rows = this.#dataRows();
    const index = rows.indexOf(rowElement);
    if (index === -1) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (index < rows.length - 1) this.#focusRow(rows[index + 1], index + 1);
        else this.#pageByKeyboard('next');
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (index > 0) this.#focusRow(rows[index - 1], index - 1);
        else this.#pageByKeyboard('previous');
        break;
      case 'Home':
        event.preventDefault();
        this.#focusRow(rows[0], 0);
        break;
      case 'End':
        event.preventDefault();
        this.#focusRow(rows[rows.length - 1], rows.length - 1);
        break;
      case 'ArrowRight': {
        const focusables = this.#rowFocusables(rowElement);
        const current = target.closest('a[href], button') as HTMLElement | null;
        const next = focusables[current ? focusables.indexOf(current) + 1 : 0];
        if (next) {
          event.preventDefault();
          next.focus();
        }
        break;
      }
      case 'ArrowLeft': {
        const current = target.closest('a[href], button') as HTMLElement | null;
        if (!current) break;
        event.preventDefault();
        const focusables = this.#rowFocusables(rowElement);
        const previous = focusables[focusables.indexOf(current) - 1];
        if (previous) previous.focus();
        else rowElement.focus();
        break;
      }
    }
  }
}
