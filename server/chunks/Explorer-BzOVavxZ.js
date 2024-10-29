import { a as subscribe, o as onDestroy, h as null_to_empty, m as is_promise, n as noop, s as setContext, g as get_store_value, l as compute_slots, k as createEventDispatcher, f as getContext } from './lifecycle-GVhEEkqU.js';
import { c as create_ssr_component, v as validate_component, e as escape, b as each, a as add_attribute, d as add_styles } from './ssr-Di-o4HBA.js';
import { w as writable, d as derived } from './index2-CV6P_ZFI.js';
import { F as Filter, R as Row, C as Count, a as Rows, P as Pagination, b as activeTable, e as expandableComponents } from './Row-CyujZUEb.js';
import { p as page } from './stores3-DsZ2QG0u.js';
import { g as goto } from './client-TAfaRk9z.js';
import { b as branding, f as features } from './configuration-CHJZnZTS.js';
import { l as loading, s as selectedFacets, S as SearchStore, a as searchTerm } from './Search-Dt75N7sl.js';
import { c as clearExports, E as ExportStore } from './Export-CQyK1aHM.js';
import { v4 } from 'uuid';
import { p as prefersReducedMotionStore } from './ProgressBar.svelte_svelte_type_style_lang-D52eF_WP.js';
import { P as ProgressRadial } from './ProgressRadial-B9eVk9uU.js';
import { c as clearFilters } from './Filter-DOu7lnJO.js';
import './index-CvuFLVuQ.js';
import './User-BlJO9WgU.js';
import { S as Searchbox } from './Searchbox-CdmC2p1u.js';
import { s as slide } from './index3-WKGwQsfU.js';
import { h as hiddenFacets } from './dictionary-CsH6mXzx.js';
import { g as getModalStore } from './stores-Bn6ceQfl.js';
import { driver } from 'driver.js';

const Accordion = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let classesBase;
  let $prefersReducedMotionStore, $$unsubscribe_prefersReducedMotionStore;
  $$unsubscribe_prefersReducedMotionStore = subscribe(prefersReducedMotionStore, (value) => $prefersReducedMotionStore = value);
  let { autocollapse = false } = $$props;
  let { width = "w-full" } = $$props;
  let { spacing = "space-y-1" } = $$props;
  let { disabled = false } = $$props;
  let { padding = "py-2 px-4" } = $$props;
  let { hover = "hover:bg-primary-hover-token" } = $$props;
  let { rounded = "rounded-container-token" } = $$props;
  let { caretOpen = "rotate-180" } = $$props;
  let { caretClosed = "" } = $$props;
  let { regionControl = "" } = $$props;
  let { regionPanel = "space-y-4" } = $$props;
  let { regionCaret = "" } = $$props;
  let { transitions = !$prefersReducedMotionStore } = $$props;
  let { transitionIn = slide } = $$props;
  let { transitionInParams = { duration: 200 } } = $$props;
  let { transitionOut = slide } = $$props;
  let { transitionOutParams = { duration: 200 } } = $$props;
  const active = writable(null);
  setContext("active", active);
  setContext("autocollapse", autocollapse);
  setContext("disabled", disabled);
  setContext("padding", padding);
  setContext("hover", hover);
  setContext("rounded", rounded);
  setContext("caretOpen", caretOpen);
  setContext("caretClosed", caretClosed);
  setContext("regionControl", regionControl);
  setContext("regionPanel", regionPanel);
  setContext("regionCaret", regionCaret);
  setContext("transitions", transitions);
  setContext("transitionIn", transitionIn);
  setContext("transitionInParams", transitionInParams);
  setContext("transitionOut", transitionOut);
  setContext("transitionOutParams", transitionOutParams);
  if ($$props.autocollapse === void 0 && $$bindings.autocollapse && autocollapse !== void 0) $$bindings.autocollapse(autocollapse);
  if ($$props.width === void 0 && $$bindings.width && width !== void 0) $$bindings.width(width);
  if ($$props.spacing === void 0 && $$bindings.spacing && spacing !== void 0) $$bindings.spacing(spacing);
  if ($$props.disabled === void 0 && $$bindings.disabled && disabled !== void 0) $$bindings.disabled(disabled);
  if ($$props.padding === void 0 && $$bindings.padding && padding !== void 0) $$bindings.padding(padding);
  if ($$props.hover === void 0 && $$bindings.hover && hover !== void 0) $$bindings.hover(hover);
  if ($$props.rounded === void 0 && $$bindings.rounded && rounded !== void 0) $$bindings.rounded(rounded);
  if ($$props.caretOpen === void 0 && $$bindings.caretOpen && caretOpen !== void 0) $$bindings.caretOpen(caretOpen);
  if ($$props.caretClosed === void 0 && $$bindings.caretClosed && caretClosed !== void 0) $$bindings.caretClosed(caretClosed);
  if ($$props.regionControl === void 0 && $$bindings.regionControl && regionControl !== void 0) $$bindings.regionControl(regionControl);
  if ($$props.regionPanel === void 0 && $$bindings.regionPanel && regionPanel !== void 0) $$bindings.regionPanel(regionPanel);
  if ($$props.regionCaret === void 0 && $$bindings.regionCaret && regionCaret !== void 0) $$bindings.regionCaret(regionCaret);
  if ($$props.transitions === void 0 && $$bindings.transitions && transitions !== void 0) $$bindings.transitions(transitions);
  if ($$props.transitionIn === void 0 && $$bindings.transitionIn && transitionIn !== void 0) $$bindings.transitionIn(transitionIn);
  if ($$props.transitionInParams === void 0 && $$bindings.transitionInParams && transitionInParams !== void 0) $$bindings.transitionInParams(transitionInParams);
  if ($$props.transitionOut === void 0 && $$bindings.transitionOut && transitionOut !== void 0) $$bindings.transitionOut(transitionOut);
  if ($$props.transitionOutParams === void 0 && $$bindings.transitionOutParams && transitionOutParams !== void 0) $$bindings.transitionOutParams(transitionOutParams);
  classesBase = `${width} ${spacing} ${$$props.class ?? ""}`;
  $$unsubscribe_prefersReducedMotionStore();
  return ` <div class="${"accordion " + escape(classesBase, true)}" data-testid="accordion">${slots.default ? slots.default({}) : ``}</div>`;
});
const cBase = "";
const cControl = "text-start w-full flex items-center space-x-4";
const cControlIcons = "fill-current w-3 transition-transform duration-[200ms]";
const cPanel = "";
const AccordionItem = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let openState;
  let classesBase;
  let classesControl;
  let classesCaretState;
  let classesControlCaret;
  let classesControlIcons;
  let classesPanel;
  let $$slots = compute_slots(slots);
  let $active, $$unsubscribe_active;
  const dispatch = createEventDispatcher();
  let { open = false } = $$props;
  let { id = String(Math.random()) } = $$props;
  let { autocollapse = getContext("autocollapse") } = $$props;
  let { active = getContext("active") } = $$props;
  $$unsubscribe_active = subscribe(active, (value) => $active = value);
  let { disabled = getContext("disabled") } = $$props;
  let { padding = getContext("padding") } = $$props;
  let { hover = getContext("hover") } = $$props;
  let { rounded = getContext("rounded") } = $$props;
  let { caretOpen = getContext("caretOpen") } = $$props;
  let { caretClosed = getContext("caretClosed") } = $$props;
  let { regionControl = getContext("regionControl") } = $$props;
  let { regionPanel = getContext("regionPanel") } = $$props;
  let { regionCaret = getContext("regionCaret") } = $$props;
  let { transitions = getContext("transitions") } = $$props;
  let { transitionIn = getContext("transitionIn") } = $$props;
  let { transitionInParams = getContext("transitionInParams") } = $$props;
  let { transitionOut = getContext("transitionOut") } = $$props;
  let { transitionOutParams = getContext("transitionOutParams") } = $$props;
  const svgCaretIcon = `
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
			<path d="M201.4 374.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 306.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z" />
		</svg>`;
  function setActive(event) {
    if (autocollapse === true) {
      active.set(id);
    } else {
      open = !open;
    }
    onToggle(event);
  }
  function onToggle(event) {
    const currentOpenState = autocollapse ? $active === id : open;
    dispatch("toggle", {
      event,
      id,
      panelId: `accordion-panel-${id}`,
      open: currentOpenState,
      autocollapse
    });
  }
  if (autocollapse && open) setActive();
  if ($$props.open === void 0 && $$bindings.open && open !== void 0) $$bindings.open(open);
  if ($$props.id === void 0 && $$bindings.id && id !== void 0) $$bindings.id(id);
  if ($$props.autocollapse === void 0 && $$bindings.autocollapse && autocollapse !== void 0) $$bindings.autocollapse(autocollapse);
  if ($$props.active === void 0 && $$bindings.active && active !== void 0) $$bindings.active(active);
  if ($$props.disabled === void 0 && $$bindings.disabled && disabled !== void 0) $$bindings.disabled(disabled);
  if ($$props.padding === void 0 && $$bindings.padding && padding !== void 0) $$bindings.padding(padding);
  if ($$props.hover === void 0 && $$bindings.hover && hover !== void 0) $$bindings.hover(hover);
  if ($$props.rounded === void 0 && $$bindings.rounded && rounded !== void 0) $$bindings.rounded(rounded);
  if ($$props.caretOpen === void 0 && $$bindings.caretOpen && caretOpen !== void 0) $$bindings.caretOpen(caretOpen);
  if ($$props.caretClosed === void 0 && $$bindings.caretClosed && caretClosed !== void 0) $$bindings.caretClosed(caretClosed);
  if ($$props.regionControl === void 0 && $$bindings.regionControl && regionControl !== void 0) $$bindings.regionControl(regionControl);
  if ($$props.regionPanel === void 0 && $$bindings.regionPanel && regionPanel !== void 0) $$bindings.regionPanel(regionPanel);
  if ($$props.regionCaret === void 0 && $$bindings.regionCaret && regionCaret !== void 0) $$bindings.regionCaret(regionCaret);
  if ($$props.transitions === void 0 && $$bindings.transitions && transitions !== void 0) $$bindings.transitions(transitions);
  if ($$props.transitionIn === void 0 && $$bindings.transitionIn && transitionIn !== void 0) $$bindings.transitionIn(transitionIn);
  if ($$props.transitionInParams === void 0 && $$bindings.transitionInParams && transitionInParams !== void 0) $$bindings.transitionInParams(transitionInParams);
  if ($$props.transitionOut === void 0 && $$bindings.transitionOut && transitionOut !== void 0) $$bindings.transitionOut(transitionOut);
  if ($$props.transitionOutParams === void 0 && $$bindings.transitionOutParams && transitionOutParams !== void 0) $$bindings.transitionOutParams(transitionOutParams);
  {
    if (open && autocollapse) setActive();
  }
  openState = autocollapse ? $active === id : open;
  classesBase = `${cBase} ${$$props.class ?? ""}`;
  classesControl = `${cControl} ${padding} ${hover} ${rounded} ${regionControl}`;
  classesCaretState = openState ? caretOpen : caretClosed;
  classesControlCaret = `${cControlIcons} ${regionCaret} ${classesCaretState}`;
  classesControlIcons = `${cControlIcons} ${regionCaret}`;
  classesPanel = `${cPanel} ${padding} ${rounded} ${regionPanel}`;
  $$unsubscribe_active();
  return ` <div class="${"accordion-item " + escape(classesBase, true)}" data-testid="accordion-item"> <button type="button" class="${"accordion-control " + escape(classesControl, true)}"${add_attribute("id", id, 0)}${add_attribute("aria-expanded", openState, 0)} aria-controls="${"accordion-panel-" + escape(id, true)}" ${disabled ? "disabled" : ""}> ${$$slots.lead ? `<div class="accordion-lead">${slots.lead ? slots.lead({}) : ``}</div>` : ``}  <div class="accordion-summary flex-1">${slots.summary ? slots.summary({}) : `(summary)`}</div>  ${$$slots.iconClosed || $$slots.iconOpen ? `  <div class="${"accordion-summary-icons " + escape(classesControlIcons, true)}">${openState ? `${slots.iconClosed ? slots.iconClosed({}) : `<!-- HTML_TAG_START -->${svgCaretIcon}<!-- HTML_TAG_END -->`}` : `${slots.iconOpen ? slots.iconOpen({}) : `<!-- HTML_TAG_START -->${svgCaretIcon}<!-- HTML_TAG_END -->`}`}</div>` : ` <div class="${"accordion-summary-caret " + escape(classesControlCaret, true)}"><!-- HTML_TAG_START -->${svgCaretIcon}<!-- HTML_TAG_END --></div>`}</button>  ${openState ? `<div class="${"accordion-panel " + escape(classesPanel, true)}" id="${"accordion-panel-" + escape(id, true)}" role="region"${add_attribute("aria-hidden", !openState, 0)}${add_attribute("aria-labelledby", id, 0)}>${slots.content ? slots.content({}) : `(content)`}</div>` : ``}</div>`;
});
class EventHandler {
  events = {
    change: [],
    clearFilters: [],
    clearSearch: []
  };
  triggerChange = writable(0);
  // legacy
  add(event, callback) {
    this.events[event].push(callback);
  }
  trigger(event) {
    for (const callback of this.events[event]) {
      callback();
    }
    if (event === "change") {
      this.triggerChange.update((store) => {
        return store + 1;
      });
    }
  }
}
class Context {
  totalRows;
  rowsPerPage;
  pageNumber;
  event;
  search;
  filters;
  rows;
  rowCount;
  pages;
  pagesWithEllipsis;
  pageCount;
  sort;
  selected;
  isAllSelected;
  selectedCount;
  selectBy;
  constructor(data, params) {
    this.totalRows = writable(params.totalRows);
    this.rowsPerPage = writable(params.rowsPerPage);
    this.pageNumber = writable(1);
    this.event = new EventHandler();
    this.search = writable("");
    this.filters = writable([]);
    this.rows = writable(data);
    this.rowCount = this.createRowCount();
    this.pages = this.createPages();
    this.pagesWithEllipsis = this.createPagesWithEllipsis();
    this.pageCount = this.createPageCount();
    this.sort = writable(void 0);
    this.selected = writable([]);
    this.isAllSelected = this.createIsAllSelected();
    this.selectedCount = this.createSelectedCount();
    this.selectBy = params.selectBy ?? void 0;
  }
  getState() {
    const pageNumber = get_store_value(this.pageNumber);
    const rowsPerPage = get_store_value(this.rowsPerPage);
    const sort = get_store_value(this.sort);
    const filters = get_store_value(this.filters);
    return {
      pageNumber,
      rowsPerPage,
      offset: rowsPerPage * (pageNumber - 1),
      search: get_store_value(this.search),
      sorted: sort ?? void 0,
      sort: sort ?? void 0,
      filters: filters.length > 0 ? filters : void 0,
      setTotalRows: (value) => this.totalRows.set(value)
    };
  }
  createPages() {
    return derived([this.rowsPerPage, this.totalRows], ([$rowsPerPage, $totalRows]) => {
      if (!$rowsPerPage || !$totalRows) {
        return void 0;
      }
      const pages = Array.from(Array(Math.ceil($totalRows / $rowsPerPage)));
      return pages.map((_, i) => {
        return i + 1;
      });
    });
  }
  createPagesWithEllipsis() {
    return derived([this.pages, this.pageNumber], ([$pages, $pageNumber]) => {
      if (!$pages) {
        return void 0;
      }
      if ($pages.length <= 7) {
        return $pages;
      }
      const ellipse = null;
      const firstPage = 1;
      const lastPage = $pages.length;
      if ($pageNumber <= 4) {
        return [
          ...$pages.slice(0, 5),
          ellipse,
          lastPage
        ];
      } else if ($pageNumber < $pages.length - 3) {
        return [
          firstPage,
          ellipse,
          ...$pages.slice($pageNumber - 2, $pageNumber + 1),
          ellipse,
          lastPage
        ];
      } else {
        return [
          firstPage,
          ellipse,
          ...$pages.slice($pages.length - 5, $pages.length)
        ];
      }
    });
  }
  createPageCount() {
    return derived(this.pages, ($pages) => {
      if (!$pages)
        return void 0;
      return $pages.length;
    });
  }
  createRowCount() {
    return derived([this.totalRows, this.pageNumber, this.rowsPerPage], ([$totalRows, $pageNumber, $rowsPerPage]) => {
      if (!$rowsPerPage || !$totalRows) {
        return void 0;
      }
      return {
        total: $totalRows,
        start: $pageNumber * $rowsPerPage - $rowsPerPage + 1,
        end: Math.min($pageNumber * $rowsPerPage, $totalRows)
      };
    });
  }
  createIsAllSelected() {
    return derived([this.selected, this.rows], ([$selected, $rows]) => {
      if ($rows.length === 0) {
        return false;
      }
      if (this.selectBy) {
        const ids = $rows.map((row) => row[this.selectBy]);
        return ids.every((id) => $selected.includes(id));
      }
      return $rows.every((row) => $selected.includes(row));
    });
  }
  createSelectedCount() {
    return derived([this.selected, this.totalRows], ([$selected, $totalRows]) => {
      return {
        count: $selected.length,
        total: $totalRows
      };
    });
  }
}
class TriggerHandler {
  context;
  reload;
  constructor(context) {
    this.context = context;
  }
  set(callback) {
    this.reload = callback;
  }
  async invalidate() {
    if (!this.reload)
      return;
    const state = this.context.getState();
    const data = await this.reload(state);
    if (data) {
      this.context.rows.set(data);
    }
  }
}
class SortHandler {
  event;
  hasMultipleSort;
  sort;
  constructor(context) {
    this.event = context.event;
    this.hasMultipleSort = false;
    this.sort = context.sort;
  }
  set(orderBy = null) {
    if (!orderBy)
      return;
    const sort = get_store_value(this.sort);
    if (!sort || sort.orderBy !== orderBy) {
      this.asc(orderBy);
    } else if (sort.direction === "asc") {
      this.desc(sort.orderBy);
    } else if (sort.direction === "desc") {
      this.asc(orderBy);
    }
  }
  asc(orderBy) {
    if (!orderBy)
      return;
    this.sort.set({ orderBy, direction: "asc" });
    this.event.trigger("change");
  }
  desc(orderBy) {
    if (!orderBy)
      return;
    this.sort.set({ orderBy, direction: "desc" });
    this.event.trigger("change");
  }
  apply(params = null) {
    if (params) {
      switch (params.direction) {
        case "asc":
          return this.asc(params.orderBy);
        case "desc":
          return this.desc(params.orderBy);
        default:
          return this.set(params.orderBy);
      }
    }
    const sort = get_store_value(this.sort);
    if (sort) {
      return this.apply({ orderBy: sort.orderBy, direction: sort.direction });
    }
    return;
  }
}
class SelectHandler {
  rows;
  selected;
  isAllSelected;
  selectBy;
  constructor(context) {
    this.rows = context.rows;
    this.selected = context.selected;
    this.isAllSelected = context.isAllSelected;
    this.selectBy = context.selectBy;
  }
  set(value) {
    const selected = get_store_value(this.selected);
    if (selected.includes(value)) {
      this.selected.set(selected.filter((item) => item !== value));
    } else {
      this.selected.set([value, ...selected]);
    }
  }
  all() {
    const rows = get_store_value(this.rows);
    const isAllSelected = get_store_value(this.isAllSelected);
    this.selected.update((store) => {
      if (this.selectBy) {
        return store = store.filter((item) => !rows.map((row) => row[this.selectBy]).includes(item));
      }
      return store = store.filter((item) => !rows.includes(item));
    });
    if (!isAllSelected) {
      this.selected.update((store) => {
        if (this.selectBy) {
          store = [...rows.map((row) => row[this.selectBy]), ...store];
        } else {
          store = [...rows, ...store];
        }
        return store;
      });
    }
  }
  clear() {
    this.selected.set([]);
  }
}
class PageHandler {
  totalRows;
  pageNumber;
  rowCount;
  rowsPerPage;
  event;
  pages;
  selected;
  constructor(context) {
    this.totalRows = context.totalRows;
    this.pageNumber = context.pageNumber;
    this.rowCount = context.rowCount;
    this.rowsPerPage = context.rowsPerPage;
    this.event = context.event;
    this.pages = context.pages;
    this.selected = context.selected;
  }
  get() {
    return this.pages;
  }
  goto(number) {
    const rowsPerPage = get_store_value(this.rowsPerPage);
    const totalRows = get_store_value(this.totalRows);
    this.pageNumber.update((store) => {
      if (rowsPerPage && totalRows) {
        if (number >= 1 && number <= Math.ceil(totalRows / rowsPerPage)) {
          store = number;
          this.event.trigger("change");
        }
        return store;
      } else {
        if (number >= 1) {
          store = number;
          this.event.trigger("change");
        }
        return store;
      }
    });
  }
  previous() {
    const number = get_store_value(this.pageNumber) - 1;
    this.goto(number);
  }
  next() {
    const number = get_store_value(this.pageNumber) + 1;
    this.goto(number);
  }
}
class SearchHandler {
  search;
  constructor(context) {
    this.search = context.search;
  }
  set(value) {
    this.search.set(value ?? null);
  }
  remove() {
    this.search.set(null);
  }
}
class FilterHandler {
  filters;
  constructor(context) {
    this.filters = context.filters;
  }
  set(value, filterBy) {
    const filter = { filterBy, value };
    this.filters.update((store) => {
      store = store.filter((item) => {
        return item.filterBy !== filterBy && item.value;
      });
      if (value) {
        store.push(filter);
      }
      return store;
    });
  }
  remove() {
    this.filters.set([]);
  }
}
class DataHandler {
  context;
  triggerHandler;
  sortHandler;
  selectHandler;
  pageHandler;
  searchHandler;
  filterHandler;
  i18n;
  constructor(data = [], params = { rowsPerPage: 5 }) {
    this.i18n = this.translate(params.i18n);
    this.context = new Context(data, params);
    this.triggerHandler = new TriggerHandler(this.context);
    this.sortHandler = new SortHandler(this.context);
    this.selectHandler = new SelectHandler(this.context);
    this.pageHandler = new PageHandler(this.context);
    this.searchHandler = new SearchHandler(this.context);
    this.filterHandler = new FilterHandler(this.context);
  }
  onChange(callback) {
    this.triggerHandler.set(callback);
  }
  invalidate() {
    this.triggerHandler.invalidate();
  }
  setRows(data) {
    this.context.rows.set(data);
  }
  setTotalRows(value) {
    this.context.totalRows.set(value);
  }
  getRows() {
    return this.context.rows;
  }
  select(value) {
    this.selectHandler.set(value);
  }
  getSelected() {
    return this.context.selected;
  }
  selectAll() {
    this.selectHandler.all();
  }
  isAllSelected() {
    return this.context.isAllSelected;
  }
  getSelectedCount() {
    return this.context.selectedCount;
  }
  clearSelection() {
    this.selectHandler.clear();
  }
  getRowsPerPage() {
    return this.context.rowsPerPage;
  }
  sort(orderBy) {
    this.setPage(1);
    this.sortHandler.set(orderBy);
  }
  applySort(params = null) {
    this.sortHandler.apply(params);
  }
  sortAsc(orderBy) {
    this.setPage(1);
    this.sortHandler.asc(orderBy);
  }
  sortDesc(orderBy) {
    this.setPage(1);
    this.sortHandler.desc(orderBy);
  }
  getSort() {
    return this.context.sort;
  }
  search(value) {
    this.setPage(1);
    this.context.search.set(value);
  }
  clearSearch() {
    this.searchHandler.remove();
  }
  filter(value, filterBy) {
    this.setPage(1);
    return this.filterHandler.set(value, filterBy);
  }
  clearFilters() {
    this.filterHandler.remove();
  }
  getPages(params = { ellipsis: false }) {
    if (params.ellipsis) {
      return this.context.pagesWithEllipsis;
    }
    return this.context.pages;
  }
  getPageCount() {
    return this.context.pageCount;
  }
  getPageNumber() {
    return this.context.pageNumber;
  }
  setPage(value) {
    switch (value) {
      case "previous":
        return this.pageHandler.previous();
      case "next":
        return this.pageHandler.next();
      default:
        return this.pageHandler.goto(value);
    }
  }
  getRowCount() {
    return this.context.rowCount;
  }
  on(event, callback) {
    this.context.event.add(event, callback);
  }
  translate(i18n) {
    return {
      ...{
        search: "Search...",
        show: "Show",
        entries: "entries",
        filter: "Filter",
        rowCount: "Showing {start} to {end} of {total} entries",
        noRows: "No entries found",
        previous: "Previous",
        next: "Next",
        selectedCount: "{count} of {total} row(s)."
      },
      ...i18n
    };
  }
  /**
   *
   * @depracted use on('change', callback) instead
   */
  getTriggerChange() {
    return this.context.event.triggerChange;
  }
  /**
   *
   * @deprecated use applySort() instead
   */
  applySorting(params = null) {
    this.applySort(params);
  }
  /**
   *
   * @deprecated use getSort() instead
   */
  getSorted() {
    return this.getSort();
  }
}
const css$3 = {
  code: "input.svelte-1akxeie{border:1px solid #e0e0e0;border-radius:4px;outline:none;padding:0 8px;line-height:24px;margin:0;height:24px;background:transparent;width:40%;max-width:176px;min-width:96px;transition:all, 0.1s}input.svelte-1akxeie:focus{border:1px solid #bdbdbd}input.svelte-1akxeie::-moz-placeholder{color:#9e9e9e;line-height:24px}input.svelte-1akxeie::placeholder{color:#9e9e9e;line-height:24px}",
  map: `{"version":3,"file":"Search.svelte","sources":["Search.svelte"],"sourcesContent":["<script>export let handler;\\nlet value = '';\\nlet timeout;\\nconst search = () => {\\n    handler.search(value);\\n    clearTimeout(timeout);\\n    timeout = setTimeout(() => {\\n        handler.invalidate();\\n    }, 400);\\n};\\n<\/script>\\r\\n\\r\\n<input\\r\\n\\tclass={$$props.class ?? ''}\\r\\n\\tbind:value\\r\\n\\tplaceholder={handler.i18n.search}\\r\\n\\tspellcheck=\\"false\\"\\r\\n\\ton:input={search}\\r\\n/>\\r\\n\\r\\n<style>\\r\\n\\tinput {\\r\\n\\t\\tborder: 1px solid #e0e0e0;\\r\\n\\t\\tborder-radius: 4px;\\r\\n\\t\\toutline: none;\\r\\n\\t\\tpadding: 0 8px;\\r\\n\\t\\tline-height: 24px;\\r\\n\\t\\tmargin: 0;\\r\\n\\t\\theight: 24px;\\r\\n\\t\\tbackground: transparent;\\r\\n\\t\\twidth: 40%;\\r\\n\\t\\tmax-width: 176px;\\r\\n\\t\\tmin-width: 96px;\\r\\n\\t\\ttransition: all, 0.1s;\\r\\n\\t}\\r\\n\\tinput:focus {\\r\\n\\t\\tborder: 1px solid #bdbdbd;\\r\\n\\t}\\r\\n\\tinput::-moz-placeholder {\\r\\n\\t\\tcolor: #9e9e9e;\\r\\n\\t\\tline-height: 24px;\\r\\n\\t}\\r\\n\\tinput::placeholder {\\r\\n\\t\\tcolor: #9e9e9e;\\r\\n\\t\\tline-height: 24px;\\r\\n\\t}</style>\\r\\n"],"names":[],"mappings":"AAqBC,oBAAM,CACL,MAAM,CAAE,GAAG,CAAC,KAAK,CAAC,OAAO,CACzB,aAAa,CAAE,GAAG,CAClB,OAAO,CAAE,IAAI,CACb,OAAO,CAAE,CAAC,CAAC,GAAG,CACd,WAAW,CAAE,IAAI,CACjB,MAAM,CAAE,CAAC,CACT,MAAM,CAAE,IAAI,CACZ,UAAU,CAAE,WAAW,CACvB,KAAK,CAAE,GAAG,CACV,SAAS,CAAE,KAAK,CAChB,SAAS,CAAE,IAAI,CACf,UAAU,CAAE,GAAG,CAAC,CAAC,IAClB,CACA,oBAAK,MAAO,CACX,MAAM,CAAE,GAAG,CAAC,KAAK,CAAC,OACnB,CACA,oBAAK,kBAAmB,CACvB,KAAK,CAAE,OAAO,CACd,WAAW,CAAE,IACd,CACA,oBAAK,aAAc,CAClB,KAAK,CAAE,OAAO,CACd,WAAW,CAAE,IACd"}`
};
const Search = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { handler } = $$props;
  let value = "";
  if ($$props.handler === void 0 && $$bindings.handler && handler !== void 0) $$bindings.handler(handler);
  $$result.css.add(css$3);
  return `<input class="${escape(null_to_empty($$props.class ?? ""), true) + " svelte-1akxeie"}"${add_attribute("placeholder", handler.i18n.search, 0)} spellcheck="false"${add_attribute("value", value, 0)}>`;
});
const css$2 = {
  code: "th.svelte-85yk1t.svelte-85yk1t{background:inherit;padding:8px 20px;white-space:nowrap;font-size:13px;-webkit-user-select:none;-moz-user-select:none;user-select:none;border-bottom:1px solid #e0e0e0}th.sortable.svelte-85yk1t.svelte-85yk1t{cursor:pointer}th.svelte-85yk1t strong.svelte-85yk1t{white-space:pre-wrap;font-size:13.5px;line-height:16px}th.sortable.svelte-85yk1t div.flex.svelte-85yk1t{padding:0;display:flex;align-items:center;height:100%}th.sortable.svelte-85yk1t span.svelte-85yk1t{padding-left:8px}th.sortable.svelte-85yk1t span.svelte-85yk1t:before,th.sortable.svelte-85yk1t span.svelte-85yk1t:after{border:4px solid transparent;content:'';display:block;height:0;width:0}th.sortable.svelte-85yk1t span.svelte-85yk1t:before{border-bottom-color:#e0e0e0;margin-top:2px}th.sortable.svelte-85yk1t span.svelte-85yk1t:after{border-top-color:#e0e0e0;margin-top:2px}th.active.sortable.svelte-85yk1t span.asc.svelte-85yk1t:before{border-bottom-color:#9e9e9e}th.active.sortable.svelte-85yk1t span.desc.svelte-85yk1t:after{border-top-color:#9e9e9e}th.svelte-85yk1t:not(.sortable) span.svelte-85yk1t{visibility:hidden}",
  map: `{"version":3,"file":"Th.svelte","sources":["Th.svelte"],"sourcesContent":["<script>export let handler;\\nexport let orderBy;\\nexport let align = 'left';\\nexport let rowSpan = 1;\\nconst sort = handler.getSort();\\nconst update = () => {\\n    handler.sort(orderBy);\\n    handler.invalidate();\\n};\\n<\/script>\\r\\n\\r\\n<th\\r\\n    on:click={update}\\r\\n    class:sortable={orderBy}\\r\\n    class:active={$sort?.orderBy === orderBy}\\r\\n    class={$$props.class ?? ''}\\r\\n    rowspan={rowSpan}\\r\\n>\\r\\n    <div\\r\\n        class=\\"flex\\"\\r\\n        style:justify-content={align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center'}\\r\\n    >\\r\\n        <strong>\\r\\n            <slot />\\r\\n        </strong>\\r\\n        <span class:asc={$sort?.direction === 'asc'} class:desc={$sort?.direction === 'desc'} />\\r\\n    </div>\\r\\n</th>\\r\\n\\r\\n<style>\\r\\n    th {\\r\\n        background: inherit;\\r\\n        padding: 8px 20px;\\r\\n        white-space: nowrap;\\r\\n        font-size: 13px;\\r\\n        -webkit-user-select: none;\\r\\n           -moz-user-select: none;\\r\\n                user-select: none;\\r\\n        border-bottom: 1px solid #e0e0e0;\\r\\n    }\\r\\n    th.sortable {\\r\\n        cursor: pointer;\\r\\n    }\\r\\n    th strong {\\r\\n        white-space: pre-wrap;\\r\\n        font-size: 13.5px;\\r\\n        line-height: 16px;\\r\\n    }\\r\\n    th.sortable div.flex {\\r\\n        padding: 0;\\r\\n        display: flex;\\r\\n        align-items: center;\\r\\n        height: 100%;\\r\\n    }\\r\\n    th.sortable span {\\r\\n        padding-left: 8px;\\r\\n    }\\r\\n    th.sortable span:before,\\r\\n    th.sortable span:after {\\r\\n        border: 4px solid transparent;\\r\\n        content: '';\\r\\n        display: block;\\r\\n        height: 0;\\r\\n        width: 0;\\r\\n    }\\r\\n    th.sortable span:before {\\r\\n        border-bottom-color: #e0e0e0;\\r\\n        margin-top: 2px;\\r\\n    }\\r\\n    th.sortable span:after {\\r\\n        border-top-color: #e0e0e0;\\r\\n        margin-top: 2px;\\r\\n    }\\r\\n    th.active.sortable span.asc:before {\\r\\n        border-bottom-color: #9e9e9e;\\r\\n    }\\r\\n    th.active.sortable span.desc:after {\\r\\n        border-top-color: #9e9e9e;\\r\\n    }\\r\\n    th:not(.sortable) span {\\r\\n        visibility: hidden;\\r\\n    }</style>\\r\\n"],"names":[],"mappings":"AA8BI,8BAAG,CACC,UAAU,CAAE,OAAO,CACnB,OAAO,CAAE,GAAG,CAAC,IAAI,CACjB,WAAW,CAAE,MAAM,CACnB,SAAS,CAAE,IAAI,CACf,mBAAmB,CAAE,IAAI,CACtB,gBAAgB,CAAE,IAAI,CACjB,WAAW,CAAE,IAAI,CACzB,aAAa,CAAE,GAAG,CAAC,KAAK,CAAC,OAC7B,CACA,EAAE,qCAAU,CACR,MAAM,CAAE,OACZ,CACA,gBAAE,CAAC,oBAAO,CACN,WAAW,CAAE,QAAQ,CACrB,SAAS,CAAE,MAAM,CACjB,WAAW,CAAE,IACjB,CACA,EAAE,uBAAS,CAAC,GAAG,mBAAM,CACjB,OAAO,CAAE,CAAC,CACV,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,MAAM,CACnB,MAAM,CAAE,IACZ,CACA,EAAE,uBAAS,CAAC,kBAAK,CACb,YAAY,CAAE,GAClB,CACA,EAAE,uBAAS,CAAC,kBAAI,OAAO,CACvB,EAAE,uBAAS,CAAC,kBAAI,MAAO,CACnB,MAAM,CAAE,GAAG,CAAC,KAAK,CAAC,WAAW,CAC7B,OAAO,CAAE,EAAE,CACX,OAAO,CAAE,KAAK,CACd,MAAM,CAAE,CAAC,CACT,KAAK,CAAE,CACX,CACA,EAAE,uBAAS,CAAC,kBAAI,OAAQ,CACpB,mBAAmB,CAAE,OAAO,CAC5B,UAAU,CAAE,GAChB,CACA,EAAE,uBAAS,CAAC,kBAAI,MAAO,CACnB,gBAAgB,CAAE,OAAO,CACzB,UAAU,CAAE,GAChB,CACA,EAAE,OAAO,uBAAS,CAAC,IAAI,kBAAI,OAAQ,CAC/B,mBAAmB,CAAE,OACzB,CACA,EAAE,OAAO,uBAAS,CAAC,IAAI,mBAAK,MAAO,CAC/B,gBAAgB,CAAE,OACtB,CACA,gBAAE,KAAK,SAAS,CAAC,CAAC,kBAAK,CACnB,UAAU,CAAE,MAChB"}`
};
const Th = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $sort, $$unsubscribe_sort;
  let { handler } = $$props;
  let { orderBy } = $$props;
  let { align = "left" } = $$props;
  let { rowSpan = 1 } = $$props;
  const sort = handler.getSort();
  $$unsubscribe_sort = subscribe(sort, (value) => $sort = value);
  if ($$props.handler === void 0 && $$bindings.handler && handler !== void 0) $$bindings.handler(handler);
  if ($$props.orderBy === void 0 && $$bindings.orderBy && orderBy !== void 0) $$bindings.orderBy(orderBy);
  if ($$props.align === void 0 && $$bindings.align && align !== void 0) $$bindings.align(align);
  if ($$props.rowSpan === void 0 && $$bindings.rowSpan && rowSpan !== void 0) $$bindings.rowSpan(rowSpan);
  $$result.css.add(css$2);
  $$unsubscribe_sort();
  return `<th class="${[
    escape(null_to_empty($$props.class ?? ""), true) + " svelte-85yk1t",
    (orderBy ? "sortable" : "") + " " + ($sort?.orderBy === orderBy ? "active" : "")
  ].join(" ").trim()}"${add_attribute("rowspan", rowSpan, 0)}><div class="flex svelte-85yk1t"${add_styles({
    "justify-content": align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center"
  })}><strong class="svelte-85yk1t">${slots.default ? slots.default({}) : ``}</strong> <span class="${[
    "svelte-85yk1t",
    ($sort?.direction === "asc" ? "asc" : "") + " " + ($sort?.direction === "desc" ? "desc" : "")
  ].join(" ").trim()}"></span></div> </th>`;
});
const ErrorAlert = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { title } = $$props;
  if ($$props.title === void 0 && $$bindings.title && title !== void 0) $$bindings.title(title);
  return `<aside data-testid="error-alert" class="alert variant-filled-error"><i class="fa-solid fa-triangle-exclamation text-4xl" aria-hidden="true"></i> <div class="alert-message"><h3 class="h3 text-left">${escape(title)}</h3> ${slots.default ? slots.default({}) : ``}</div></aside>`;
});
const Actions = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let exportItem;
  let isOpenAccess;
  let isExported;
  let shouldDisableFilter;
  let $exports, $$unsubscribe_exports;
  let $page, $$unsubscribe_page;
  let $$unsubscribe_activeTable;
  let $$unsubscribe_expandableComponents;
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  $$unsubscribe_activeTable = subscribe(activeTable, (value) => value);
  $$unsubscribe_expandableComponents = subscribe(expandableComponents, (value) => value);
  let { exports, addExport, removeExport } = ExportStore;
  $$unsubscribe_exports = subscribe(exports, (value) => $exports = value);
  let { data = {} } = $$props;
  if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
  exportItem = {
    id: v4(),
    searchResult: data.row,
    display: data.row.display,
    conceptPath: data.row.conceptPath
  };
  isOpenAccess = $page.url.pathname.includes("/discover");
  isExported = $exports.map((exp) => exp.conceptPath).includes(exportItem.conceptPath);
  shouldDisableFilter = isOpenAccess && !data.row.allowFiltering;
  $$unsubscribe_exports();
  $$unsubscribe_page();
  $$unsubscribe_activeTable();
  $$unsubscribe_expandableComponents();
  return `<button type="button" title="Information" class="btn-icon-color" data-svelte-h="svelte-dn5858"><i class="fa-solid fa-circle-info fa-xl"></i> <span class="sr-only">View Information</span></button> <button type="button"${add_attribute(
    "title",
    shouldDisableFilter ? "Filtering is not available for this variable" : "Filter",
    0
  )} class="btn-icon-color" ${shouldDisableFilter ? "disabled" : ""}><i class="fa-solid fa-filter fa-xl"></i> <span class="sr-only">${escape(shouldDisableFilter ? "Filtering is not available for this variable" : "View Filter")}</span></button> ${``} ${!isOpenAccess ? `<button type="button"${add_attribute("title", isExported ? "Remove from Analysis" : "Add for Analysis", 0)} class="btn-icon-color">${isExported ? `<i class="fa-regular fa-square-check fa-xl"></i>` : `<i class="fa-solid fa-right-from-bracket fa-xl"></i>`}</button>` : ``}`;
});
const css$1 = {
  code: ".pic-sure-table-compact tbody.svelte-1p87p3v td.svelte-1p87p3v:not(.expandable-component){padding-top:0.75rem !important;padding-bottom:0.75rem !important}table.svelte-1p87p3v thead th.svelte-1p87p3v{font-weight:normal !important}",
  map: '{"version":3,"file":"RemoteTable.svelte","sources":["RemoteTable.svelte"],"sourcesContent":["<script lang=\\"ts\\">import { DataHandler, Search, Th } from \\"@vincjo/datatables/remote\\";\\nimport { onMount } from \\"svelte\\";\\nimport { setComponentRegistry } from \\"$lib/stores/ExpandableRow\\";\\nimport ExpandableRow from \\"$lib/components/datatable/Row.svelte\\";\\nimport AddFilterComponent from \\"$lib/components/explorer/AddFilter.svelte\\";\\nimport ResultInfoComponent from \\"$lib/components/explorer/ResultInfoComponent.svelte\\";\\nimport HierarchyComponent from \\"$lib/components/explorer/HierarchyComponent.svelte\\";\\nimport ThFilter from \\"$lib/components/datatable/accessories/Filter.svelte\\";\\nimport RowsPerPage from \\"$lib/components/datatable/accessories/Rows.svelte\\";\\nimport RowCount from \\"$lib/components/datatable/accessories/Count.svelte\\";\\nimport Pagination from \\"$lib/components/datatable/accessories/Pagination.svelte\\";\\nimport { ProgressRadial } from \\"@skeletonlabs/skeleton\\";\\nexport let tableName = \\"ExplorerTable\\";\\nexport let handler;\\nexport let isLoading;\\nexport let searchable = false;\\nexport let title = \\"\\";\\nexport let fullWidth = false;\\nexport let options = [5, 10, 20, 50, 100];\\nexport let columns = [];\\nexport let cellOverides = {};\\nexport let rowClickHandler = () => {\\n};\\nlet rows = handler.getRows();\\nonMount(() => {\\n  setComponentRegistry({\\n    filter: AddFilterComponent,\\n    info: ResultInfoComponent,\\n    hierarchy: HierarchyComponent\\n  }, \\"info\\", tableName);\\n  return () => {\\n    setComponentRegistry({});\\n  };\\n});\\n<\/script>\\n\\n<div class=\\"space-y-1\\">\\n  {#if title || searchable || $$slots.tableActions}\\n    <header\\n      class=\\"flex items-center {title || $$slots.tableActions\\n        ? \'justify-between\'\\n        : \'justify-end\'} gap-4\\"\\n    >\\n      {#if title}\\n        <div class=\\"flex-auto\\">\\n          <h2 class=\\"my-2\\">{title}</h2>\\n        </div>\\n      {/if}\\n      <slot name=\\"tableActions\\" />\\n      {#if searchable}\\n        <div class=\\"flex-none\\">\\n          <Search {handler} />\\n        </div>\\n      {/if}\\n    </header>\\n  {/if}\\n  <table\\n    id=\\"{tableName}-table\\"\\n    data-testid=\\"{tableName}-table\\"\\n    class=\\"table table-auto table-hover align-middle {fullWidth ? \'w-max\' : \'\'}\\"\\n  >\\n    <thead style=\\"border-color: revert;\\">\\n      <tr>\\n        {#each columns as column}\\n          {#if column.sort}\\n            <Th {handler} orderBy={column.dataElement} class={`!bg-primary-300 ${column.class}`}\\n              >{column.label}</Th\\n            >\\n          {:else if column.filter}\\n            <ThFilter\\n              {handler}\\n              class={`!bg-primary-300 ${column.class}`}\\n              filterBy={column.dataElement}\\n            />\\n          {:else}\\n            <th class={`bg-primary-300 ${column.class}`}>{column.label}</th>\\n          {/if}\\n        {/each}\\n      </tr>\\n    </thead>\\n    <tbody>\\n      {#if $isLoading}\\n        <tr>\\n          <td colspan={columns.length} class=\\"text-center py-8\\">\\n            <div class=\\"flex justify-center items-center\\">\\n              <ProgressRadial width=\\"w-12\\" />\\n            </div>\\n          </td>\\n        </tr>\\n      {:else if $rows.length > 0}\\n        {#each $rows as row, i}\\n          <ExpandableRow {tableName} {cellOverides} {columns} index={i} {row} {rowClickHandler} />\\n        {/each}\\n      {:else}\\n        <tr><td colspan={columns.length}>No entries found.</td></tr>\\n      {/if}\\n    </tbody>\\n  </table>\\n  <footer class=\\"flex justify-between mt-1\\">\\n    <RowCount {handler} />\\n    <div class=\\"flex justify-end gap-4\\">\\n      <RowsPerPage {handler} {options} />\\n      <Pagination {handler} />\\n    </div>\\n  </footer>\\n</div>\\n\\n<style>\\n  .pic-sure-table-compact tbody td:not(.expandable-component) {\\n    padding-top: 0.75rem !important;\\n    padding-bottom: 0.75rem !important;\\n  }\\n\\n  table thead th {\\n    font-weight: normal !important;\\n  }</style>\\n"],"names":[],"mappings":"AA4GE,uBAAuB,CAAC,oBAAK,CAAC,iBAAE,KAAK,qBAAqB,CAAE,CAC1D,WAAW,CAAE,OAAO,CAAC,UAAU,CAC/B,cAAc,CAAE,OAAO,CAAC,UAC1B,CAEA,oBAAK,CAAC,KAAK,CAAC,iBAAG,CACb,WAAW,CAAE,MAAM,CAAC,UACtB"}'
};
const RemoteTable = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$slots = compute_slots(slots);
  let $isLoading, $$unsubscribe_isLoading;
  let $rows, $$unsubscribe_rows;
  let { tableName: tableName2 = "ExplorerTable" } = $$props;
  let { handler } = $$props;
  let { isLoading } = $$props;
  $$unsubscribe_isLoading = subscribe(isLoading, (value) => $isLoading = value);
  let { searchable = false } = $$props;
  let { title = "" } = $$props;
  let { fullWidth = false } = $$props;
  let { options = [5, 10, 20, 50, 100] } = $$props;
  let { columns = [] } = $$props;
  let { cellOverides = {} } = $$props;
  let { rowClickHandler = () => {
  } } = $$props;
  let rows = handler.getRows();
  $$unsubscribe_rows = subscribe(rows, (value) => $rows = value);
  if ($$props.tableName === void 0 && $$bindings.tableName && tableName2 !== void 0) $$bindings.tableName(tableName2);
  if ($$props.handler === void 0 && $$bindings.handler && handler !== void 0) $$bindings.handler(handler);
  if ($$props.isLoading === void 0 && $$bindings.isLoading && isLoading !== void 0) $$bindings.isLoading(isLoading);
  if ($$props.searchable === void 0 && $$bindings.searchable && searchable !== void 0) $$bindings.searchable(searchable);
  if ($$props.title === void 0 && $$bindings.title && title !== void 0) $$bindings.title(title);
  if ($$props.fullWidth === void 0 && $$bindings.fullWidth && fullWidth !== void 0) $$bindings.fullWidth(fullWidth);
  if ($$props.options === void 0 && $$bindings.options && options !== void 0) $$bindings.options(options);
  if ($$props.columns === void 0 && $$bindings.columns && columns !== void 0) $$bindings.columns(columns);
  if ($$props.cellOverides === void 0 && $$bindings.cellOverides && cellOverides !== void 0) $$bindings.cellOverides(cellOverides);
  if ($$props.rowClickHandler === void 0 && $$bindings.rowClickHandler && rowClickHandler !== void 0) $$bindings.rowClickHandler(rowClickHandler);
  $$result.css.add(css$1);
  $$unsubscribe_isLoading();
  $$unsubscribe_rows();
  return `<div class="space-y-1">${title || searchable || $$slots.tableActions ? `<header class="${"flex items-center " + escape(
    title || $$slots.tableActions ? "justify-between" : "justify-end",
    true
  ) + " gap-4"}">${title ? `<div class="flex-auto"><h2 class="my-2">${escape(title)}</h2></div>` : ``} ${slots.tableActions ? slots.tableActions({}) : ``} ${searchable ? `<div class="flex-none">${validate_component(Search, "Search").$$render($$result, { handler }, {}, {})}</div>` : ``}</header>` : ``} <table id="${escape(tableName2, true) + "-table"}" data-testid="${escape(tableName2, true) + "-table"}" class="${"table table-auto table-hover align-middle " + escape(fullWidth ? "w-max" : "", true) + " svelte-1p87p3v"}"><thead style="border-color: revert;"><tr>${each(columns, (column) => {
    return `${column.sort ? `${validate_component(Th, "Th").$$render(
      $$result,
      {
        handler,
        orderBy: column.dataElement,
        class: `!bg-primary-300 ${column.class}`
      },
      {},
      {
        default: () => {
          return `${escape(column.label)}`;
        }
      }
    )}` : `${column.filter ? `${validate_component(Filter, "ThFilter").$$render(
      $$result,
      {
        handler,
        class: `!bg-primary-300 ${column.class}`,
        filterBy: column.dataElement
      },
      {},
      {}
    )}` : `<th class="${escape(null_to_empty(`bg-primary-300 ${column.class}`), true) + " svelte-1p87p3v"}">${escape(column.label)}</th>`}`}`;
  })}</tr></thead> <tbody class="svelte-1p87p3v">${$isLoading ? `<tr><td${add_attribute("colspan", columns.length, 0)} class="text-center py-8 svelte-1p87p3v"><div class="flex justify-center items-center">${validate_component(ProgressRadial, "ProgressRadial").$$render($$result, { width: "w-12" }, {}, {})}</div></td></tr>` : `${$rows.length > 0 ? `${each($rows, (row, i) => {
    return `${validate_component(Row, "ExpandableRow").$$render(
      $$result,
      {
        tableName: tableName2,
        cellOverides,
        columns,
        index: i,
        row,
        rowClickHandler
      },
      {},
      {}
    )}`;
  })}` : `<tr><td${add_attribute("colspan", columns.length, 0)} class="svelte-1p87p3v">No entries found.</td></tr>`}`}</tbody></table> <footer class="flex justify-between mt-1">${validate_component(Count, "RowCount").$$render($$result, { handler }, {}, {})} <div class="flex justify-end gap-4">${validate_component(Rows, "RowsPerPage").$$render($$result, { handler, options }, {}, {})} ${validate_component(Pagination, "Pagination").$$render($$result, { handler }, {}, {})}</div></footer> </div>`;
});
const css = {
  code: ".svelte-1ukmbqo:is(.dark .show-more){--tw-ring-opacity:1;--tw-ring-color:rgb(var(--color-surface-500) / var(--tw-ring-opacity))\n}.show-more.svelte-1ukmbqo:disabled{cursor:not-allowed;opacity:0.5\n}.show-more.svelte-1ukmbqo:disabled:hover{--tw-brightness:brightness(1);filter:var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow)\n}.show-more.svelte-1ukmbqo:disabled:active{--tw-scale-x:1;--tw-scale-y:1;transform:translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))\n}.show-more.svelte-1ukmbqo{font-size:1rem;line-height:1.5rem;padding-left:1.25rem;padding-right:1.25rem;padding-top:9px;padding-bottom:9px;white-space:nowrap;text-align:center;display:inline-flex;align-items:center;justify-content:center;transition-property:all;transition-timing-function:cubic-bezier(0.4, 0, 0.2, 1);transition-duration:150ms;border-radius:var(--theme-rounded-base)\n}.show-more.svelte-1ukmbqo:hover{--tw-brightness:brightness(1.15);filter:var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow)\n}.show-more.svelte-1ukmbqo:active{--tw-scale-x:95%;--tw-scale-y:95%;transform:translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));--tw-brightness:brightness(.9);filter:var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow)\n}.show-more.svelte-1ukmbqo{padding-left:0.75rem;padding-right:0.75rem;padding-top:0.375rem;padding-bottom:0.375rem;font-size:0.875rem;line-height:1.25rem;--tw-ring-offset-shadow:var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);--tw-ring-shadow:var(--tw-ring-inset) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color);box-shadow:var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);--tw-ring-inset:inset;--tw-ring-opacity:1;--tw-ring-color:rgb(var(--color-surface-500) / var(--tw-ring-opacity))\n}.svelte-1ukmbqo:is(.dark .show-more){--tw-ring-opacity:1;--tw-ring-color:rgb(var(--color-surface-500) / var(--tw-ring-opacity))\n}.show-more.svelte-1ukmbqo{border-radius:var(--theme-rounded-container)\n}",
  map: `{"version":3,"file":"FacetCategory.svelte","sources":["FacetCategory.svelte"],"sourcesContent":["<script lang=\\"ts\\">import { AccordionItem } from \\"@skeletonlabs/skeleton\\";\\nimport SearchStore from \\"$lib/stores/Search\\";\\nimport { hiddenFacets } from \\"$lib/services/dictionary\\";\\nlet { updateFacet, selectedFacets } = SearchStore;\\nexport let facetCategory;\\nexport let facets = facetCategory.facets;\\nexport let numFacetsToShow = 5;\\nexport let shouldShowSearchBar = facets.length > numFacetsToShow;\\nconst anyFacetNot0 = facets.some((facet) => facet.count > 0);\\nlet textFilterValue;\\nlet moreThanTenFacets = facets.length > numFacetsToShow;\\n$: facetsToDisplay = (facets || textFilterValue || moreThanTenFacets || $selectedFacets || facetCategory) && getFacetsToDisplay();\\n$: selectedFacetsChips = $selectedFacets.filter((facet) => facet?.categoryRef?.name === facetCategory?.name);\\n$: isChecked = (facetToCheck) => {\\n  return $selectedFacets.some((facet) => {\\n    return facet.name === facetToCheck;\\n  });\\n};\\nfunction getFacetsToDisplay() {\\n  const hiddenFacetsForCategory = $hiddenFacets[facetCategory.name];\\n  let facetsToDisplay2 = facets.filter((f) => !hiddenFacetsForCategory.includes(f.name));\\n  const selectedFacetsMap = new Map($selectedFacets.map((facet) => [facet.name, facet]));\\n  facetsToDisplay2 = facetsToDisplay2.filter((f) => !selectedFacetsMap.has(f.name));\\n  const selectedFacetsForCategory = $selectedFacets.filter((facet) => facet.category === facetCategory.name);\\n  selectedFacetsForCategory.forEach((facet) => {\\n    facet.count = facets.find((f) => f.name === facet.name)?.count || 0;\\n  });\\n  facetsToDisplay2.unshift(...selectedFacetsForCategory);\\n  if (textFilterValue) {\\n    const lowerFilterValue = textFilterValue.toLowerCase();\\n    facetsToDisplay2 = facetsToDisplay2.filter((facet) => facet.display.toLowerCase().includes(lowerFilterValue) || facet.name.toLowerCase().includes(lowerFilterValue) || facet.description?.toLowerCase().includes(lowerFilterValue));\\n  } else if (moreThanTenFacets) {\\n    facetsToDisplay2 = facetsToDisplay2.slice(0, numFacetsToShow);\\n  }\\n  return facetsToDisplay2;\\n}\\n<\/script>\\n\\n<AccordionItem class=\\"card space-y-2\\" open={anyFacetNot0}>\\n  <svelte:fragment slot=\\"summary\\">{facetCategory.display}</svelte:fragment>\\n  <svelte:fragment slot=\\"content\\">\\n    <div class=\\"flex flex-col\\">\\n      {#if shouldShowSearchBar}\\n        <input\\n          class=\\"text-sm\\"\\n          type=\\"search\\"\\n          placeholder={'Filter ' + facetCategory.display}\\n          name=\\"facet-fitler\\"\\n          id={facetCategory.name + '-filter'}\\n          bind:value={textFilterValue}\\n        />\\n      {/if}\\n      {#each facetsToDisplay as facet}\\n        <label data-testId={\`facet-\${facet.name}-label\`} for={facet.name} class=\\"m-1\\">\\n          <input\\n            type=\\"checkbox\\"\\n            class=\\"&[aria-disabled=“true”]:opacity-75\\"\\n            id={facet.name}\\n            name={facet.name}\\n            value={facet}\\n            checked={isChecked(facet.name)}\\n            disabled={facet.count === 0}\\n            aria-checked={isChecked(facet.name)}\\n            on:click={() => updateFacet(facet, facetCategory)}\\n          />\\n          <span class:opacity-75={facet.count === 0}\\n            >{\`\${facet.display} (\${facet.count?.toLocaleString()})\`}</span\\n          >\\n        </label>\\n      {/each}\\n      {#if facets.length > numFacetsToShow && !textFilterValue}\\n        <button\\n          data-testId=\\"show-more-facets\\"\\n          class=\\"show-more w-fit mx-auto my-1\\"\\n          on:click={() => (moreThanTenFacets = !moreThanTenFacets)}\\n        >\\n          {moreThanTenFacets ? 'Show More' : 'Show Less'}\\n          <i class=\\"ml-1 fa-solid {moreThanTenFacets ? 'fa-angle-down' : 'fa-angle-up'}\\"></i>\\n        </button>\\n      {/if}\\n    </div>\\n  </svelte:fragment>\\n</AccordionItem>\\n<div class=\\"m-1 p-1 max-w\\">\\n  {#each selectedFacetsChips as facet}\\n    <span\\n      class=\\"badge relative z-10 variant-ringed-primary m-1 p-2 flex items-center box-border w-full max-w-full overflow-hidden\\"\\n      id={facet.name}\\n    >\\n      <span class=\\"overflow-hidden text-ellipsis whitespace-nowrap min-w-0\\">\\n        {facet.display}\\n      </span>\\n      <button\\n        class=\\"chip-close ml-1 flex-shrink-0\\"\\n        on:click={() => updateFacet(facet, facetCategory)}\\n      >\\n        <i class=\\"fa-solid fa-times hover:text-secondary-500\\"></i>\\n      </button>\\n    </span>\\n  {/each}\\n</div>\\n\\n<style lang=\\"postcss\\">\\n  :is(.dark .show-more) {\\n    --tw-ring-opacity: 1;\\n    --tw-ring-color: rgb(var(--color-surface-500) / var(--tw-ring-opacity))\\n}\\n.show-more:disabled {\\n    cursor: not-allowed;\\n    opacity: 0.5\\n}\\n.show-more:disabled:hover {\\n    --tw-brightness: brightness(1);\\n    filter: var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow)\\n}\\n.show-more:disabled:active {\\n    --tw-scale-x: 1;\\n    --tw-scale-y: 1;\\n    transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))\\n}\\n.show-more {\\n    font-size: 1rem;\\n    line-height: 1.5rem;\\n    padding-left: 1.25rem;\\n    padding-right: 1.25rem;\\n    padding-top: 9px;\\n    padding-bottom: 9px;\\n    white-space: nowrap;\\n    text-align: center;\\n    display: inline-flex;\\n    align-items: center;\\n    justify-content: center;\\n    transition-property: all;\\n    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\\n    transition-duration: 150ms;\\n    border-radius: var(--theme-rounded-base)\\n}\\n.show-more > :not([hidden]) ~ :not([hidden]) {\\n    --tw-space-x-reverse: 0;\\n    margin-right: calc(0.5rem * var(--tw-space-x-reverse));\\n    margin-left: calc(0.5rem * calc(1 - var(--tw-space-x-reverse)))\\n}\\n.show-more:hover {\\n    --tw-brightness: brightness(1.15);\\n    filter: var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow)\\n}\\n.show-more:active {\\n    --tw-scale-x: 95%;\\n    --tw-scale-y: 95%;\\n    transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\\n    --tw-brightness: brightness(.9);\\n    filter: var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow)\\n}\\n.show-more {\\n    padding-left: 0.75rem;\\n    padding-right: 0.75rem;\\n    padding-top: 0.375rem;\\n    padding-bottom: 0.375rem;\\n    font-size: 0.875rem;\\n    line-height: 1.25rem;\\n    --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);\\n    --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color);\\n    box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);\\n    --tw-ring-inset: inset;\\n    --tw-ring-opacity: 1;\\n    --tw-ring-color: rgb(var(--color-surface-500) / var(--tw-ring-opacity))\\n}\\n:is(.dark .show-more) {\\n    --tw-ring-opacity: 1;\\n    --tw-ring-color: rgb(var(--color-surface-500) / var(--tw-ring-opacity))\\n}\\n.show-more {\\n    border-radius: var(--theme-rounded-container)\\n}</style>\\n"],"names":[],"mappings":"eAuGE,IAAI,KAAK,CAAC,UAAU,CAAE,CACpB,iBAAiB,CAAE,CAAC,CACpB,eAAe,CAAE;AACrB,CACA,yBAAU,SAAU,CAChB,MAAM,CAAE,WAAW,CACnB,OAAO,CAAE;AACb,CACA,yBAAU,SAAS,MAAO,CACtB,eAAe,CAAE,aAAa,CAC9B,MAAM,CAAE,IAAI,SAAS,CAAC,CAAC,IAAI,eAAe,CAAC,CAAC,IAAI,aAAa,CAAC,CAAC,IAAI,cAAc,CAAC,CAAC,IAAI,eAAe,CAAC,CAAC,IAAI,WAAW,CAAC,CAAC,IAAI,aAAa,CAAC,CAAC,IAAI,UAAU,CAAC,CAAC,IAAI,gBAAgB;AACpL,CACA,yBAAU,SAAS,OAAQ,CACvB,YAAY,CAAE,CAAC,CACf,YAAY,CAAE,CAAC,CACf,SAAS,CAAE,UAAU,IAAI,gBAAgB,CAAC,CAAC,CAAC,IAAI,gBAAgB,CAAC,CAAC,CAAC,OAAO,IAAI,WAAW,CAAC,CAAC,CAAC,MAAM,IAAI,WAAW,CAAC,CAAC,CAAC,MAAM,IAAI,WAAW,CAAC,CAAC,CAAC,OAAO,IAAI,YAAY,CAAC,CAAC,CAAC,OAAO,IAAI,YAAY,CAAC;AAClM,CACA,yBAAW,CACP,SAAS,CAAE,IAAI,CACf,WAAW,CAAE,MAAM,CACnB,YAAY,CAAE,OAAO,CACrB,aAAa,CAAE,OAAO,CACtB,WAAW,CAAE,GAAG,CAChB,cAAc,CAAE,GAAG,CACnB,WAAW,CAAE,MAAM,CACnB,UAAU,CAAE,MAAM,CAClB,OAAO,CAAE,WAAW,CACpB,WAAW,CAAE,MAAM,CACnB,eAAe,CAAE,MAAM,CACvB,mBAAmB,CAAE,GAAG,CACxB,0BAA0B,CAAE,aAAa,GAAG,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CAAC,CAAC,CAAC,CACxD,mBAAmB,CAAE,KAAK,CAC1B,aAAa,CAAE,IAAI,oBAAoB;AAC3C,CAMA,yBAAU,MAAO,CACb,eAAe,CAAE,gBAAgB,CACjC,MAAM,CAAE,IAAI,SAAS,CAAC,CAAC,IAAI,eAAe,CAAC,CAAC,IAAI,aAAa,CAAC,CAAC,IAAI,cAAc,CAAC,CAAC,IAAI,eAAe,CAAC,CAAC,IAAI,WAAW,CAAC,CAAC,IAAI,aAAa,CAAC,CAAC,IAAI,UAAU,CAAC,CAAC,IAAI,gBAAgB;AACpL,CACA,yBAAU,OAAQ,CACd,YAAY,CAAE,GAAG,CACjB,YAAY,CAAE,GAAG,CACjB,SAAS,CAAE,UAAU,IAAI,gBAAgB,CAAC,CAAC,CAAC,IAAI,gBAAgB,CAAC,CAAC,CAAC,OAAO,IAAI,WAAW,CAAC,CAAC,CAAC,MAAM,IAAI,WAAW,CAAC,CAAC,CAAC,MAAM,IAAI,WAAW,CAAC,CAAC,CAAC,OAAO,IAAI,YAAY,CAAC,CAAC,CAAC,OAAO,IAAI,YAAY,CAAC,CAAC,CAC/L,eAAe,CAAE,cAAc,CAC/B,MAAM,CAAE,IAAI,SAAS,CAAC,CAAC,IAAI,eAAe,CAAC,CAAC,IAAI,aAAa,CAAC,CAAC,IAAI,cAAc,CAAC,CAAC,IAAI,eAAe,CAAC,CAAC,IAAI,WAAW,CAAC,CAAC,IAAI,aAAa,CAAC,CAAC,IAAI,UAAU,CAAC,CAAC,IAAI,gBAAgB;AACpL,CACA,yBAAW,CACP,YAAY,CAAE,OAAO,CACrB,aAAa,CAAE,OAAO,CACtB,WAAW,CAAE,QAAQ,CACrB,cAAc,CAAE,QAAQ,CACxB,SAAS,CAAE,QAAQ,CACnB,WAAW,CAAE,OAAO,CACpB,uBAAuB,CAAE,kFAAkF,CAC3G,gBAAgB,CAAE,uFAAuF,CACzG,UAAU,CAAE,IAAI,uBAAuB,CAAC,CAAC,CAAC,IAAI,gBAAgB,CAAC,CAAC,CAAC,IAAI,WAAW,CAAC,UAAU,CAAC,CAC5F,eAAe,CAAE,KAAK,CACtB,iBAAiB,CAAE,CAAC,CACpB,eAAe,CAAE;AACrB,gBACA,IAAI,KAAK,CAAC,UAAU,CAAE,CAClB,iBAAiB,CAAE,CAAC,CACpB,eAAe,CAAE;AACrB,CACA,yBAAW,CACP,aAAa,CAAE,IAAI,yBAAyB;AAChD"}`
};
const FacetCategory = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let facetsToDisplay;
  let selectedFacetsChips;
  let isChecked;
  let $selectedFacets, $$unsubscribe_selectedFacets;
  let $hiddenFacets, $$unsubscribe_hiddenFacets;
  $$unsubscribe_hiddenFacets = subscribe(hiddenFacets, (value) => $hiddenFacets = value);
  let { updateFacet, selectedFacets: selectedFacets2 } = SearchStore;
  $$unsubscribe_selectedFacets = subscribe(selectedFacets2, (value) => $selectedFacets = value);
  let { facetCategory } = $$props;
  let { facets = facetCategory.facets } = $$props;
  let { numFacetsToShow = 5 } = $$props;
  let { shouldShowSearchBar = facets.length > numFacetsToShow } = $$props;
  const anyFacetNot0 = facets.some((facet) => facet.count > 0);
  let textFilterValue;
  let moreThanTenFacets = facets.length > numFacetsToShow;
  function getFacetsToDisplay() {
    const hiddenFacetsForCategory = $hiddenFacets[facetCategory.name];
    let facetsToDisplay2 = facets.filter((f) => !hiddenFacetsForCategory.includes(f.name));
    const selectedFacetsMap = new Map($selectedFacets.map((facet) => [facet.name, facet]));
    facetsToDisplay2 = facetsToDisplay2.filter((f) => !selectedFacetsMap.has(f.name));
    const selectedFacetsForCategory = $selectedFacets.filter((facet) => facet.category === facetCategory.name);
    selectedFacetsForCategory.forEach((facet) => {
      facet.count = facets.find((f) => f.name === facet.name)?.count || 0;
    });
    facetsToDisplay2.unshift(...selectedFacetsForCategory);
    if (moreThanTenFacets) {
      facetsToDisplay2 = facetsToDisplay2.slice(0, numFacetsToShow);
    }
    return facetsToDisplay2;
  }
  if ($$props.facetCategory === void 0 && $$bindings.facetCategory && facetCategory !== void 0) $$bindings.facetCategory(facetCategory);
  if ($$props.facets === void 0 && $$bindings.facets && facets !== void 0) $$bindings.facets(facets);
  if ($$props.numFacetsToShow === void 0 && $$bindings.numFacetsToShow && numFacetsToShow !== void 0) $$bindings.numFacetsToShow(numFacetsToShow);
  if ($$props.shouldShowSearchBar === void 0 && $$bindings.shouldShowSearchBar && shouldShowSearchBar !== void 0) $$bindings.shouldShowSearchBar(shouldShowSearchBar);
  $$result.css.add(css);
  facetsToDisplay = (facets || textFilterValue || moreThanTenFacets || $selectedFacets || facetCategory) && getFacetsToDisplay();
  selectedFacetsChips = $selectedFacets.filter((facet) => facet?.categoryRef?.name === facetCategory?.name);
  isChecked = (facetToCheck) => {
    return $selectedFacets.some((facet) => {
      return facet.name === facetToCheck;
    });
  };
  $$unsubscribe_selectedFacets();
  $$unsubscribe_hiddenFacets();
  return `${validate_component(AccordionItem, "AccordionItem").$$render(
    $$result,
    {
      class: "card space-y-2",
      open: anyFacetNot0
    },
    {},
    {
      content: () => {
        return `<div class="flex flex-col svelte-1ukmbqo">${shouldShowSearchBar ? `<input class="text-sm svelte-1ukmbqo" type="search"${add_attribute("placeholder", "Filter " + facetCategory.display, 0)} name="facet-fitler"${add_attribute("id", facetCategory.name + "-filter", 0)}${add_attribute("value", textFilterValue, 0)}>` : ``} ${each(facetsToDisplay, (facet) => {
          return `<label${add_attribute("data-testid", `facet-${facet.name}-label`, 0)}${add_attribute("for", facet.name, 0)} class="m-1 svelte-1ukmbqo"><input type="checkbox" class="&amp;[aria-disabled=“true”]:opacity-75 svelte-1ukmbqo"${add_attribute("id", facet.name, 0)}${add_attribute("name", facet.name, 0)}${add_attribute("value", facet, 0)} ${isChecked(facet.name) ? "checked" : ""} ${facet.count === 0 ? "disabled" : ""}${add_attribute("aria-checked", isChecked(facet.name), 0)}> <span class="${["svelte-1ukmbqo", facet.count === 0 ? "opacity-75" : ""].join(" ").trim()}">${escape(`${facet.display} (${facet.count?.toLocaleString()})`)}</span> </label>`;
        })} ${facets.length > numFacetsToShow && !textFilterValue ? `<button data-testid="show-more-facets" class="show-more w-fit mx-auto my-1 svelte-1ukmbqo">${escape(moreThanTenFacets ? "Show More" : "Show Less")} <i class="${"ml-1 fa-solid " + escape(moreThanTenFacets ? "fa-angle-down" : "fa-angle-up", true) + " svelte-1ukmbqo"}"></i></button>` : ``}</div> `;
      },
      summary: () => {
        return `${escape(facetCategory.display)}`;
      }
    }
  )} <div class="m-1 p-1 max-w svelte-1ukmbqo">${each(selectedFacetsChips, (facet) => {
    return `<span class="badge relative z-10 variant-ringed-primary m-1 p-2 flex items-center box-border w-full max-w-full overflow-hidden svelte-1ukmbqo"${add_attribute("id", facet.name, 0)}><span class="overflow-hidden text-ellipsis whitespace-nowrap min-w-0 svelte-1ukmbqo">${escape(facet.display)}</span> <button class="chip-close ml-1 flex-shrink-0 svelte-1ukmbqo" data-svelte-h="svelte-1kytydx"><i class="fa-solid fa-times hover:text-secondary-500 svelte-1ukmbqo"></i></button> </span>`;
  })} </div>`;
});
const FacetSideBar = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $selectedFacets, $$unsubscribe_selectedFacets;
  let $$unsubscribe_searchTerm;
  let { searchTerm: searchTerm2, selectedFacets: selectedFacets2 } = SearchStore;
  $$unsubscribe_searchTerm = subscribe(searchTerm2, (value) => value);
  $$unsubscribe_selectedFacets = subscribe(selectedFacets2, (value) => $selectedFacets = value);
  let facetsPromise;
  function recreateFacetCategories() {
    let facetsToShow = [];
    $selectedFacets.forEach((facet) => {
      let facetCategory = facetsToShow.find((category) => category.display === facet.category);
      if (facetCategory) {
        facetCategory.facets.push(facet);
      } else {
        facetsToShow.push({
          display: facet?.categoryRef?.display || facet.category,
          facets: [facet],
          description: facet?.categoryRef?.description || "",
          name: facet.category
        });
      }
    });
    return facetsToShow;
  }
  onDestroy(() => {
  });
  $$unsubscribe_selectedFacets();
  $$unsubscribe_searchTerm();
  return `${function(__value) {
    if (is_promise(__value)) {
      __value.then(null, noop);
      return ` ${validate_component(ProgressRadial, "ProgressRadial").$$render($$result, {}, {}, {})} `;
    }
    return function(newFacets) {
      return ` ${`${validate_component(Accordion, "Accordion").$$render($$result, {}, {}, {
        default: () => {
          return `${each(recreateFacetCategories(), (facetCategory) => {
            return `${validate_component(FacetCategory, "FacetCategory").$$render($$result, { facetCategory }, {}, {})}`;
          })}`;
        }
      })}`} `;
    }();
  }(facetsPromise)}`;
});
function replacePlaceholders(text, searchTerm2) {
  return text.replace(/\{\{searchTerm\}\}/g, searchTerm2);
}
const ExplorerTour = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$unsubscribe_loading;
  $$unsubscribe_loading = subscribe(loading, (value) => value);
  let { tourConfig } = $$props;
  getModalStore();
  const disablePrevious = () => {
  };
  const clickElement = (element) => {
    element?.click();
  };
  const clickElementThenNext = (element) => {
    element?.click();
    tourDriver.moveNext();
  };
  const addHighlightClass = (on) => {
    return (element) => {
      if (on) {
        element.classList.add("highlight");
      } else {
        element.classList.remove("highlight");
      }
    };
  };
  function resetSearch() {
    searchTerm.set("");
    clearFilters();
    clearExports();
  }
  const applyNumericFilter = (activeRowSelector) => {
    const filter = document.querySelector(`#${activeRowSelector} [data-testid="add-filter"]`);
    filter.click();
    tourDriver.moveNext();
  };
  const clickFilterOption = (activeRowSelector) => {
    const allOptions = document.querySelector(`#${activeRowSelector} #select-all`);
    allOptions?.click();
    const addFilter = document.querySelector(`#${activeRowSelector} [data-testid="add-filter"]`);
    addFilter.click();
    tourDriver.moveNext();
  };
  const applyFilterThenNext = (element) => {
    const activeRowId = element?.id;
    const filterType = document.querySelector(`#${activeRowId} [data-testid="numerical-filter"]`) ? "numerical" : "categorical";
    if (filterType === "numerical") {
      applyNumericFilter(activeRowId);
    } else {
      clickFilterOption(activeRowId);
    }
  };
  const findAndSetFirstNonStigmatizedAvailableFilterThenNext = () => {
    const table = document.querySelector("#ExplorerTable-table");
    const rows = table.querySelectorAll("tr");
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      let filter = row.querySelector('button[title="Filter"]');
      if (filter) {
        row.classList.add("non-stigmatized-row");
        break;
      }
    }
    tourDriver.moveNext();
  };
  const functionMap = {
    disablePrevious,
    clickElement,
    clickElementThenNext,
    addHighlightClass: addHighlightClass(true),
    removeHighlightClass: addHighlightClass(false),
    resetSearch,
    applyFilterThenNext,
    findAndSetFirstNonStigmatizedAvailableFilterThenNext
  };
  function mapConfigurationToSteps(steps2) {
    return steps2.map((step) => {
      const { popover, ...rest } = step;
      const serializedStep = {
        ...rest,
        popover: {
          ...popover,
          title: replacePlaceholders(popover.title, tourConfig?.searchTerm),
          description: replacePlaceholders(popover.description, tourConfig?.searchTerm)
        }
      };
      if (popover.onPrevClick) {
        serializedStep.popover.onPrevClick = functionMap[popover.onPrevClick];
      }
      if (popover.onNextClick) {
        serializedStep.popover.onNextClick = functionMap[popover.onNextClick];
      }
      if (step.onHighlightStarted) {
        serializedStep.onHighlightStarted = functionMap[step.onHighlightStarted];
      }
      return serializedStep;
    });
  }
  const steps = mapConfigurationToSteps(tourConfig.steps);
  const tourDriver = driver({
    showProgress: true,
    popoverClass: "picsure-theme",
    overlayColor: "rgb(var(--color-surface-400) / .7)",
    // Although we're not using the previous button, this would be it's custom text
    // prevBtnText: '<i class="fa-solid fa-arrow-left mr-1"></i> Previous',
    nextBtnText: 'Next <i class="fa-solid fa-arrow-right ml-1"></i>',
    // Even if previous button is disabled, navigating with the left arrow key still seems to trigger,
    // so we'll disable it in each step.
    showButtons: ["next", "close"],
    disableButtons: ["previous"],
    steps,
    onDestroyed: () => {
      resetSearch();
      selectedFacets.set([]);
      const sidePanel = document.querySelector("#side-panel");
      if (sidePanel.classList.contains("open-panel")) {
        document.querySelector("#results-panel-toggle")?.click();
      }
      const searchBox = document.querySelector("#explorer-search-box");
      searchBox.value = "";
      searchBox.focus();
    }
  });
  if ($$props.tourConfig === void 0 && $$bindings.tourConfig && tourConfig !== void 0) $$bindings.tourConfig(tourConfig);
  $$unsubscribe_loading();
  return `<button type="button" data-testid="explorer-tour-btn" id="tourBtn" class="btn variant-filled-secondary" data-svelte-h="svelte-1247os5">Take a Tour</button>`;
});
const tableName = "ExplorerTable";
const Explorer = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let tourEnabled;
  let isOpenAccess;
  let $error, $$unsubscribe_error;
  let $selectedFacets, $$unsubscribe_selectedFacets;
  let $searchTerm, $$unsubscribe_searchTerm;
  let $page, $$unsubscribe_page;
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  let { tourConfig } = $$props;
  const isLoading = writable(false);
  let { searchTerm: searchTerm2, search, selectedFacets: selectedFacets2, error } = SearchStore;
  $$unsubscribe_searchTerm = subscribe(searchTerm2, (value) => $searchTerm = value);
  $$unsubscribe_selectedFacets = subscribe(selectedFacets2, (value) => $selectedFacets = value);
  $$unsubscribe_error = subscribe(error, (value) => $error = value);
  let searchInput = $page.url.searchParams.get("search") || $searchTerm || "";
  const additionalColumns = branding.explorePage.additionalColumns || [];
  const columns = [
    ...additionalColumns,
    {
      dataElement: "display",
      label: "Variable Name",
      sort: false
    },
    {
      dataElement: "description",
      label: "Variable Description",
      sort: false
    },
    {
      dataElement: "id",
      label: "Actions",
      class: "w-36 text-center"
    }
  ];
  const cellOverides = { id: Actions };
  const handler = new DataHandler([], { rowsPerPage: 10 });
  handler.onChange(async (state) => {
    doDisableTour();
    isLoading.set(true);
    try {
      const results = await search($searchTerm, $selectedFacets, state);
      return results;
    } finally {
      isLoading.set(false);
    }
  });
  function doDisableTour() {
    if (tourEnabled && (searchInput || $selectedFacets && $selectedFacets.length > 0)) {
      tourEnabled = false;
    }
  }
  function updateSearch() {
    if ($error) {
      error.set("");
      searchTerm2.set("");
    }
    searchTerm2.set(searchInput);
    const path = isOpenAccess ? "/discover" : "/explorer";
    goto(
      searchInput ? `${path}?search=${searchInput}` : `${path}`,
      { replaceState: true }
    );
  }
  onDestroy(() => {
  });
  if ($$props.tourConfig === void 0 && $$bindings.tourConfig && tourConfig !== void 0) $$bindings.tourConfig(tourConfig);
  let $$settled;
  let $$rendered;
  let previous_head = $$result.head;
  do {
    $$settled = true;
    $$result.head = previous_head;
    tourEnabled = true;
    isOpenAccess = $page.url.pathname.includes("/discover");
    $$rendered = `<section id="search-container" class="flex gap-9"><div id="facet-side-bar" class="flex-none flex-col items-center w-64">${validate_component(FacetSideBar, "FacetSideBar").$$render($$result, {}, {}, {})}</div> <div id="search-results-col" class="flex-auto"><div id="search-bar" class="flex gap-2 mb-6"><div class="flex-auto">${validate_component(Searchbox, "Searchbox").$$render(
      $$result,
      {
        search: updateSearch,
        searchTerm: searchInput
      },
      {
        searchTerm: ($$value) => {
          searchInput = $$value;
          $$settled = false;
        }
      },
      {}
    )}</div> <div class="flex-none">${!isOpenAccess && features.enableGENEQuery ? `<a data-testid="genomic-filter-btn" class="btn variant-ghost-primary hover:variant-filled-primary" href="/explorer/genome-filter" data-svelte-h="svelte-1nwljm2">Genomic Filtering</a>` : ``} <button type="button" class="btn variant-ghost-error hover:variant-filled-error" aria-label="You are on the reset button" ${!searchInput && $selectedFacets.length === 0 ? "disabled" : ""}>Reset</button></div></div> ${$error ? `${validate_component(ErrorAlert, "ErrorAlert").$$render($$result, { title: "API Error" }, {}, {
      default: () => {
        return `<p>${escape($error)}</p>`;
      }
    })}` : `${$searchTerm || $selectedFacets.length > 0 ? `${validate_component(RemoteTable, "SearchDatatable").$$render(
      $$result,
      {
        tableName,
        handler,
        columns,
        cellOverides,
        isLoading
      },
      {},
      {}
    )}` : ``}`} ${features.explorer.enableTour && tourEnabled ? `<div id="explorer-tour" class="text-center mt-4">${validate_component(ExplorerTour, "ExplorerTour").$$render($$result, { tourConfig }, {}, {})}</div>` : ``}</div></section>`;
  } while (!$$settled);
  $$unsubscribe_error();
  $$unsubscribe_selectedFacets();
  $$unsubscribe_searchTerm();
  $$unsubscribe_page();
  return $$rendered;
});

export { Explorer as E };
//# sourceMappingURL=Explorer-BzOVavxZ.js.map
