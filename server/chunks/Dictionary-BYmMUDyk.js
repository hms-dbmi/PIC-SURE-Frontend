import { w as writable, d as derived } from './index2-BVONNh3m.js';
import { p as page } from './stores4-C3NPX6l0.js';
import { p as post, u as user, g as get } from './User-Cv0Sr19m.js';
import { g as get_store_value } from './lifecycle-DtuISP6h.js';

/* empty css                                         */
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
const loading = writable(false);
const searchPromise = writable(
  Promise.resolve(void 0)
);
const searchTerm = writable("");
const selectedFacets = writable([]);
const tableHandler = new DataHandler([], {
  rowsPerPage: 10
});
const tour = writable(true);
const error = writable("");
selectedFacets.subscribe(() => {
  tableHandler.setPage(1);
  tableHandler.invalidate();
});
searchTerm.subscribe(() => {
  tableHandler.setPage(1);
  tableHandler.invalidate();
});
tableHandler.onChange(async (state) => {
  const term = get_store_value(searchTerm);
  const facets = get_store_value(selectedFacets);
  loading.set(true);
  if (get_store_value(tour) && (term || facets.length > 0)) {
    tour.set(false);
  }
  try {
    facetsPromise.set(updateFacetsFromSearch());
    return await search(state);
  } catch (e) {
    return [];
  } finally {
    loading.set(false);
  }
});
async function search(state) {
  const facets = get_store_value(selectedFacets);
  const term = get_store_value(searchTerm);
  if (!term && !facets.length) {
    state?.setTotalRows(0);
    return [];
  }
  const search2 = searchDictionary(term.trim(), facets, {
    pageNumber: state?.pageNumber ? state?.pageNumber - 1 : 0,
    pageSize: state?.rowsPerPage
  });
  searchPromise.set(search2);
  const response = await search2.catch((e) => {
    console.error(e);
    state?.setTotalRows(0);
    error.set(
      "An error occurred while searching. If the problem persists, please contact an administrator."
    );
    throw e;
  });
  if (!response) {
    error.set(
      "An error occurred while searching. If the problem persists, please contact an administrator."
    );
  }
  state?.setTotalRows(response?.totalElements ?? 0);
  return response?.content ?? [];
}
async function updateFacets(facetsToUpdate) {
  const currentFacets = get_store_value(selectedFacets);
  facetsToUpdate.forEach((facet) => {
    const facetIndex = currentFacets.findIndex((f) => f.name === facet.name);
    if (facetIndex !== -1) {
      currentFacets.splice(facetIndex, 1);
    } else {
      currentFacets.push(facet);
    }
  });
  selectedFacets.set(currentFacets.sort((a, b) => b.count - a.count));
}
function resetSearch() {
  searchTerm.set("");
  selectedFacets.set([]);
  error.set("");
  tour.set(true);
}
const SearchStore = {
  selectedFacets,
  searchTerm,
  error,
  search,
  updateFacets,
  resetSearch
};
const DICT_URL = "picsure/proxy/dictionary-api/";
const CONCEPT_URL = "picsure/proxy/dictionary-api/concepts";
const DATASET_DETAIL_URL = "picsure/proxy/dictionary-api/dashboard-drawer/";
const hiddenFacets = writable({});
const facetsPromise = writable(
  Promise.resolve([])
);
function searchDictionary(searchTerm2 = "", facets, pageable) {
  let request = { facets, search: searchTerm2 };
  if (!get_store_value(page).url.pathname.includes("/discover")) {
    request = addConsents(request);
  }
  return post(
    `${CONCEPT_URL}?page_number=${pageable.pageNumber}&page_size=${pageable.pageSize}`,
    request
  );
}
function initializeHiddenFacets(response) {
  const facetsWithZeroConcepts = response.map((cat) => {
    return {
      name: cat.name,
      values: cat.facets.filter((f) => f.count === 0).map((f) => f.name)
    };
  }).reduce((prev, cur) => {
    prev[cur.name] = cur.values;
    return prev;
  }, {});
  console.debug(
    "Found the following facets that should be hidden:",
    JSON.stringify(facetsWithZeroConcepts)
  );
  hiddenFacets.set(facetsWithZeroConcepts);
}
async function updateFacetsFromSearch() {
  const search2 = get_store_value(searchTerm);
  const facets = get_store_value(selectedFacets);
  let request = { facets, search: search2 };
  if (!get_store_value(page).url.pathname.includes("/discover")) {
    request = addConsents(request);
  }
  try {
    const response = await post(`${DICT_URL}facets/`, request);
    initializeHiddenFacets(response);
    processFacetResults(response);
    return response;
  } catch (error2) {
    console.error("Failed to update facets from search:", error2);
    throw error2;
  }
}
function processFacetResults(response) {
  response.forEach((category) => {
    category.facets.forEach((facet) => {
      facet.categoryRef = {
        name: category.name,
        display: category.display,
        description: category.description
      };
      if (facet.children?.length) {
        facet.children.forEach((child) => {
          child.categoryRef = {
            name: category.name,
            display: category.display,
            description: category.description
          };
          child.parentRef = {
            name: facet.name,
            display: facet.display,
            description: facet.description
          };
        });
      }
    });
  });
}
function addConsents(request) {
  const queryTemplate = get_store_value(user)?.queryTemplate;
  if (queryTemplate) {
    const filters = queryTemplate.categoryFilters || {};
    const consents = filters["\\_consents\\"] || [];
    request.consents = consents;
  }
  return request;
}
async function getDatasetDetails(datasetId) {
  return get(`${DATASET_DETAIL_URL}${datasetId}`);
}

export { SearchStore as S, selectedFacets as a, tableHandler as b, searchPromise as c, error as e, facetsPromise as f, getDatasetDetails as g, hiddenFacets as h, loading as l, searchTerm as s, tour as t };
//# sourceMappingURL=Dictionary-BYmMUDyk.js.map
