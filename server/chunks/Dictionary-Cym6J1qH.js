import { w as writable, l as get } from './utils-D3IkxnGP.js';
import './index2-CFqWCRce.js';
import { a3 as post, a4 as Picsure, u as user, a6 as get$1 } from './User-CeJunCPd.js';
import { a7 as derived } from './index-C9dy-hDW.js';

class EventDispatcher {
  listeners = {
    change: [],
    clearFilters: [],
    clearSearch: []
  };
  queue = /* @__PURE__ */ new Set();
  add(event, callback) {
    this.listeners[event].push(callback);
  }
  async dispatch(event) {
    this.queue.add(event);
    await new Promise((resolve) => setTimeout(resolve, 40));
    if (this.queue.size > 0) {
      this.run();
    }
    this.queue.clear();
  }
  run() {
    for (const event of this.queue) {
      for (const callback of this.listeners[event]) {
        callback();
      }
    }
  }
}
class AbstractTableHandler {
  selectBy;
  event = new EventDispatcher();
  search = "";
  sort = {};
  totalRows = void 0;
  isLoading = false;
  rowsPerPage = 10;
  currentPage = 1;
  filters = [];
  #filterCount = derived(() => this.filters.length);
  get filterCount() {
    return this.#filterCount();
  }
  set filterCount($$value) {
    return this.#filterCount($$value);
  }
  rows = [];
  #rowCount = derived(() => this.createRowCount());
  get rowCount() {
    return this.#rowCount();
  }
  set rowCount($$value) {
    return this.#rowCount($$value);
  }
  #pages = derived(() => this.createPages());
  get pages() {
    return this.#pages();
  }
  set pages($$value) {
    return this.#pages($$value);
  }
  #pageCount = derived(() => this.createPageCount());
  get pageCount() {
    return this.#pageCount();
  }
  set pageCount($$value) {
    return this.#pageCount($$value);
  }
  #pagesWithEllipsis = derived(() => this.createPagesWithEllipsis());
  get pagesWithEllipsis() {
    return this.#pagesWithEllipsis();
  }
  set pagesWithEllipsis($$value) {
    return this.#pagesWithEllipsis($$value);
  }
  selected = [];
  #isAllSelected = derived(() => this.createIsAllSelected());
  get isAllSelected() {
    return this.#isAllSelected();
  }
  set isAllSelected($$value) {
    return this.#isAllSelected($$value);
  }
  element = void 0;
  clientWidth = 1e3;
  constructor(data, params) {
    this.rows = data;
    this.selectBy = params.selectBy ?? void 0;
    this.totalRows = params.totalRows;
    this.rowsPerPage = params.rowsPerPage ?? 10;
  }
  getState() {
    return {
      currentPage: this.currentPage,
      rowsPerPage: this.rowsPerPage,
      offset: this.rowsPerPage * (this.currentPage - 1),
      search: this.search,
      sort: this.sort.field ? this.sort : void 0,
      filters: this.filters.length > 0 ? this.filters : void 0,
      setTotalRows: (value) => this.totalRows = value
    };
  }
  createPages() {
    if (!this.rowsPerPage || !this.totalRows) {
      return void 0;
    }
    const pages = Array.from(Array(Math.ceil(this.totalRows / this.rowsPerPage)));
    return pages.map((_, i) => i + 1);
  }
  createPageCount() {
    if (!this.pages) return void 0;
    return this.pages.length;
  }
  createPagesWithEllipsis() {
    if (!this.pages) {
      return void 0;
    }
    if (this.pageCount <= 7) {
      return this.pages;
    }
    const ellipse = null;
    const firstPage = 1;
    const lastPage = this.pageCount;
    if (this.currentPage <= 4) {
      return [...this.pages.slice(0, 5), ellipse, lastPage];
    } else if (this.currentPage < this.pageCount - 3) {
      return [
        firstPage,
        ellipse,
        ...this.pages.slice(this.currentPage - 2, this.currentPage + 1),
        ellipse,
        lastPage
      ];
    } else {
      return [
        firstPage,
        ellipse,
        ...this.pages.slice(this.pageCount - 5, this.pageCount)
      ];
    }
  }
  createRowCount() {
    if (!this.rowsPerPage || !this.totalRows) {
      return {
        total: void 0,
        start: void 0,
        end: void 0,
        selected: this.selected.length
      };
    }
    return {
      total: this.totalRows,
      start: this.currentPage * this.rowsPerPage - this.rowsPerPage + 1,
      end: Math.min(this.currentPage * this.rowsPerPage, this.totalRows),
      selected: this.selected.length
    };
  }
  createIsAllSelected() {
    if (this.rows.length === 0) {
      return false;
    }
    const ids = this.rows.map((row) => row[this.selectBy]);
    return ids.every((id) => this.selected.includes(id));
  }
}
class FetchHandler {
  table;
  reload;
  constructor(table) {
    this.table = table;
  }
  set(callback) {
    this.reload = callback;
  }
  async invalidate() {
    if (!this.reload) return;
    this.table.isLoading = true;
    const state = this.table.getState();
    const data = await this.reload(state);
    this.table.isLoading = false;
    if (data) {
      this.table.rows = data;
    }
  }
}
class SortHandler {
  table;
  constructor(table) {
    this.table = table;
  }
  set(field) {
    const sort = this.table["sort"];
    if (!sort || sort.field !== field) {
      this.asc(field);
    } else if (sort.direction === "asc") {
      this.desc(field);
    } else if (sort.direction === "desc") {
      this.asc(field);
    }
  }
  asc(field) {
    this.table["sort"] = { field, direction: "asc" };
    this.table.setPage(1);
  }
  desc(field) {
    this.table["sort"] = { field, direction: "desc" };
    this.table.setPage(1);
  }
}
class SelectHandler {
  table;
  constructor(table) {
    this.table = table;
  }
  set(value) {
    if (this.table.selected.includes(value)) {
      this.table.selected = this.table.selected.filter((item) => item !== value);
    } else {
      this.table.selected = [value, ...this.table.selected];
    }
  }
  all() {
    const selection = this.table.rows.map((row) => row[this.table["selectBy"]]);
    if (this.table.isAllSelected) {
      this.table.selected = this.table.selected.filter((item) => selection.includes(item) === false);
    } else {
      this.table.selected = [.../* @__PURE__ */ new Set([...selection, ...this.table.selected])];
    }
  }
  clear() {
    this.table.selected = [];
  }
}
class PageHandler {
  table;
  constructor(table) {
    this.table = table;
  }
  goto(number) {
    if (this.table.rowsPerPage && this.table.totalRows) {
      if (number >= 1 && number <= this.table.pageCount) {
        this.table.currentPage = number;
        this.table["event"].dispatch("change");
        this.table.invalidate();
      }
    } else {
      if (number >= 1) {
        this.table.currentPage = number;
        this.table["event"].dispatch("change");
        this.table.invalidate();
      }
    }
  }
  previous() {
    this.goto(this.table.currentPage - 1);
  }
  next() {
    this.goto(this.table.currentPage + 1);
  }
}
class SearchHandler {
  table;
  constructor(table) {
    this.table = table;
  }
  clear() {
    this.table["event"].dispatch("clearSearch");
  }
}
class FilterHandler {
  table;
  constructor(table) {
    this.table = table;
  }
  set(value, field) {
    this.table.filters = this.table.filters.filter((filter) => filter.field !== field && filter.value);
    if (value) {
      this.table.filters.push({ value, field });
    }
  }
  unset(field) {
    this.table.filters = this.table.filters.filter((filter) => filter.field !== field);
  }
  clear() {
    this.table.filters = [];
    this.table["event"].dispatch("clearFilters");
  }
}
class ViewBuilder {
  columns = [];
  table;
  interval;
  mutation;
  constructor(table, columns) {
    this.table = table;
    this.columns = [];
    this.interval = setInterval(() => this.createColumns(columns), 200);
  }
  toggle(name) {
    if (!this.table.element) return;
    const column = this.columns.find((column2) => column2.name === name);
    if (!column) return;
    column.toggle();
  }
  createColumns(columns) {
    if (!this.table?.element) {
      return;
    }
    clearInterval(this.interval);
    this.columns = columns.map(({ name, index, isVisible, isFrozen }) => {
      return {
        name,
        index,
        isVisible: isVisible === false ? false : true,
        isFrozen: isFrozen === true ? true : false,
        element: this.table.element,
        toggle() {
          this.isVisible = !this.isVisible;
          this.element.querySelectorAll(`tr > *:nth-child(${this.index + 1})`).forEach((element) => {
            element.classList.toggle("hidden");
          });
        }
      };
    });
    this.preset();
    this.mutation = new MutationObserver(() => {
      setTimeout(
        () => {
          this.preset();
        },
        2
      );
    });
    this.mutation.observe(this.table.element, { childList: true, subtree: true });
  }
  preset() {
    let left = 0;
    for (const { isVisible, isFrozen, index } of this.columns) {
      if (isFrozen === true) {
        left += this.freeze(index, left);
      }
      if (isVisible === false) {
        this.table.element.querySelectorAll(`tr > *:nth-child(${index + 1})`).forEach((element) => {
          element.classList.add("hidden");
        });
      }
    }
  }
  freeze(index, left = 0) {
    const column = this.table.element.querySelector(`thead th:nth-child(${index + 1})`);
    const { width } = column.getBoundingClientRect();
    this.table.element.querySelectorAll(`tr > *:nth-child(${index + 1})`).forEach((element) => {
      element.style.position = "sticky";
      element.style.left = left + "px";
      element.style.width = width + "px";
    });
    return width;
  }
  setPosition(current, destination) {
    this.table.element.querySelectorAll("tr").forEach((row) => {
      const cells = [].slice.call(row.querySelectorAll("th, td"));
      if (current > destination) {
        cells[destination].parentNode.insertBefore(cells[current], cells[destination]);
      } else {
        cells[destination].parentNode.insertBefore(cells[current], cells[destination].nextSibling);
      }
    });
  }
}
class SearchBuilder {
  value = "";
  timeout = void 0;
  table;
  constructor(table) {
    this.table = table;
    this.cleanup();
  }
  set() {
    this.table["search"] = this.value;
    clearTimeout(this.timeout);
    this.timeout = setTimeout(
      () => {
        this.table.setPage(1);
      },
      400
    );
  }
  init(value) {
    if (!value) return this;
    this.value = value;
    this.table["search"] = value;
    return this;
  }
  clear() {
    this.value = "";
    this.table["search"] = "";
    this.table.invalidate();
  }
  cleanup() {
    this.table.on("clearSearch", () => this.clear());
  }
}
class SortBuilder {
  sortHandler;
  field;
  #isActive = derived(() => this.createIsActive());
  get isActive() {
    return this.#isActive();
  }
  set isActive($$value) {
    return this.#isActive($$value);
  }
  #direction = derived(() => this.createDirection());
  get direction() {
    return this.#direction();
  }
  set direction($$value) {
    return this.#direction($$value);
  }
  constructor(sortHandler, field) {
    this.sortHandler = sortHandler;
    this.field = field;
  }
  set() {
    this.sortHandler.set(this.field);
  }
  init(direction) {
    if (!direction) return this;
    this[direction]();
    return this;
  }
  asc() {
    this.sortHandler.asc(this.field);
  }
  desc() {
    this.sortHandler.desc(this.field);
  }
  createIsActive() {
    if (this.field === this.sortHandler["table"]["sort"]?.field) {
      return true;
    }
    return false;
  }
  createDirection() {
    if (this.isActive === false) return null;
    return this.sortHandler["table"]["sort"]?.direction;
  }
}
class FilterBuilder {
  value = "";
  timeout = void 0;
  filterHandler;
  field;
  constructor(filterHandler, field) {
    this.filterHandler = filterHandler;
    this.field = field;
    this.cleanup();
  }
  set() {
    this.filterHandler.set(this.value, this.field);
    clearTimeout(this.timeout);
    this.timeout = setTimeout(
      () => {
        this.filterHandler["table"].invalidate();
      },
      400
    );
  }
  init(value) {
    if (!value) return this;
    this.value = value;
    this.filterHandler.set(this.value, this.field);
    return this;
  }
  clear() {
    this.value = "";
    this.filterHandler.unset(this.field);
  }
  cleanup() {
    this.filterHandler["table"].on("clearFilters", () => this.clear());
  }
}
class TableHandler extends AbstractTableHandler {
  fetchHandler;
  sortHandler;
  selectHandler;
  pageHandler;
  searchHandler;
  filterHandler;
  view;
  i18n;
  constructor(data = [], params = { rowsPerPage: 5 }) {
    super(data, params);
    this.i18n = this.translate(params.i18n);
    this.fetchHandler = new FetchHandler(this);
    this.sortHandler = new SortHandler(this);
    this.selectHandler = new SelectHandler(this);
    this.pageHandler = new PageHandler(this);
    this.searchHandler = new SearchHandler(this);
    this.filterHandler = new FilterHandler(this);
  }
  load(callback) {
    this.fetchHandler.set(callback);
  }
  invalidate() {
    this.fetchHandler.invalidate();
  }
  setRowsPerPage(value) {
    this.rowsPerPage = value;
    this.setPage(1);
  }
  setPage(value) {
    switch (value) {
      case "previous":
        return this.pageHandler.previous();
      case "next":
        return this.pageHandler.next();
      case "last":
        return this.pageHandler.goto(this.pageCount);
      default:
        return this.pageHandler.goto(value);
    }
  }
  clearSearch() {
    this.searchHandler.clear();
  }
  createSearch() {
    return new SearchBuilder(this);
  }
  createSort(field) {
    if (typeof field === "function") {
      throw new Error(`Invalid field argument: ${String(field)}. Function type arguments are not allowed in server-side mode`);
    }
    return new SortBuilder(this.sortHandler, field);
  }
  clearFilters() {
    this.filterHandler.clear();
    this.invalidate();
  }
  createFilter(field) {
    if (typeof field === "function") {
      throw new Error(`Invalid field argument: ${String(field)}. Function type arguments are not allowed in server-side mode`);
    }
    return new FilterBuilder(this.filterHandler, field);
  }
  select(value) {
    this.selectHandler.set(value);
  }
  selectAll() {
    this.selectHandler.all();
  }
  clearSelection() {
    this.selectHandler.clear();
  }
  on(event, callback) {
    this.event.add(event, callback);
  }
  createView(columns) {
    this.view = new ViewBuilder(this, columns);
    return this.view;
  }
  getView() {
    return this.view;
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
}
const DEFAULT_ROW_NUMBER = 10;
const defaultRows = writable(restoreSettings());
defaultRows.subscribe((rows) => {
});
function restoreSettings() {
  return {};
}
function getDefaultRows(tableName) {
  if (!tableName) return DEFAULT_ROW_NUMBER;
  const settings = get(defaultRows);
  if (!settings) return DEFAULT_ROW_NUMBER;
  if (settings[tableName]) {
    return settings[tableName];
  } else {
    settings[tableName] = DEFAULT_ROW_NUMBER;
    defaultRows.set(settings);
    return DEFAULT_ROW_NUMBER;
  }
}
const loading = writable(false);
const searchPromise = writable(
  Promise.resolve(void 0)
);
const searchTerm = writable("");
const selectedFacets = writable([]);
const tableHandler = new TableHandler([], {
  rowsPerPage: getDefaultRows("ExplorerTable")
});
const tour = writable(true);
const error = writable("");
writable(getDefaultRows("ExplorerTable"));
const SearchStore = {
  selectedFacets
};
const hiddenFacets = writable({});
const facetsPromise = writable(
  Promise.resolve([])
);
const openFacets = writable([]);
const dictonaryCacheMap = /* @__PURE__ */ new Map();
const ENSURE_MAX_DEPTH = 100;
function cacheResult(key, value) {
  if (!key || !value) return;
  if (dictonaryCacheMap.size > 100) {
    dictonaryCacheMap.clear();
  }
  dictonaryCacheMap.set(key, value);
}
async function getConceptDetails(conceptPath, dataset) {
  const url = `${Picsure.Concept.Detail}/${dataset}`;
  const rawConceptPath = String.raw`${conceptPath.replace(/\\\\/g, "\\")}`;
  if (dictonaryCacheMap.has(rawConceptPath)) {
    return dictonaryCacheMap.get(rawConceptPath);
  }
  const response = await post(url, rawConceptPath);
  if (!response) {
    throw new Error("No response");
  }
  cacheResult(rawConceptPath, response);
  return response;
}
async function getHierarchyConcepts(dataset, conceptPath) {
  const response = await post(
    `${Picsure.Concept.Hierarchy}/${dataset}`,
    conceptPath
  );
  if (!response) {
    throw new Error("No response");
  }
  return response;
}
function addConsents(request) {
  const queryTemplate = get(user)?.queryTemplate;
  if (queryTemplate) {
    const filters = queryTemplate.categoryFilters || {};
    const consents = filters["\\_consents\\"] || [];
    request.consents = consents;
  }
  return request;
}
async function getDatasetDetails(datasetId) {
  return get$1(`${Picsure.DashboardDrawer}/${datasetId}`);
}
async function getConceptTree(dataset, depth, conceptPath) {
  const url = `${Picsure.Concept.Tree}/${dataset}?depth=${depth}`;
  return post(url, conceptPath);
}
async function getInitialTree(depth = 1) {
  if (depth > ENSURE_MAX_DEPTH) {
    depth = ENSURE_MAX_DEPTH;
  }
  return get$1(`${Picsure.Concept.Tree}?depth=${depth}`);
}

export { EventDispatcher as E, SearchStore as S, ViewBuilder as V, selectedFacets as a, addConsents as b, getDefaultRows as c, getConceptDetails as d, getHierarchyConcepts as e, error as f, getDatasetDetails as g, tour as h, facetsPromise as i, hiddenFacets as j, searchPromise as k, loading as l, getInitialTree as m, getConceptTree as n, openFacets as o, searchTerm as s, tableHandler as t };
//# sourceMappingURL=Dictionary-Cym6J1qH.js.map
