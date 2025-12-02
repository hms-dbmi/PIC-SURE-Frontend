import { x as push, a1 as spread_props, z as pop, $ as run, a7 as derived } from './index-C9dy-hDW.js';
import { c as getDefaultRows, V as ViewBuilder, E as EventDispatcher } from './Dictionary-Cym6J1qH.js';
import { R as RemoteTable } from './RemoteTable-CuygI6T5.js';

const isNull = (value) => {
  if (value === null || value === void 0 || value === "")
    return true;
  return false;
};
const isNotNull = (value) => {
  return !isNull(value);
};
const stringify = (value = null) => {
  return String(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};
const isObjectArray = (value) => {
  if (typeof value !== "object")
    return false;
  else if (value === null)
    return false;
  return true;
};
const check = {
  isLike: (entry, value) => stringify(entry).includes(stringify(value)),
  isEqualTo: (entry, value) => stringify(entry) === stringify(value),
  // multiple criteria
  whereIn: (entry, criteria = []) => {
    if (criteria.length === 0)
      return false;
    for (const { value, check: check2 } of criteria) {
      if (value?.["key"]) {
        return checkByKey(entry, value, check2);
      } else if (check2(entry, value)) {
        return true;
      }
    }
    return false;
  },
  // regexp
  match: (entry, pattern) => {
    const match2 = pattern.match(/^([\/~@;%#'])(.*?)\1([gimsuy]*)$/);
    const regex = match2 ? new RegExp(match2[2], match2[3].split("").filter((char, pos, flagArr) => flagArr.indexOf(char) === pos).join("")) : new RegExp(pattern);
    return stringify(entry).match(regex) ? true : false;
  }
};
const checkByKey = (entry, param, check2) => {
  if (!param?.key)
    return false;
  const { key, value } = param;
  if (Array.isArray(entry) === false && typeof entry === "object") {
    const keys = Object.keys(entry);
    if (keys.includes(key) && check2(entry[key], value)) {
      return true;
    }
  }
  return false;
};
const match = (entry, value, params) => {
  params.check = params.check ?? check.isLike;
  if (isNull(value)) {
    return true;
  } else if (isObjectArray(entry)) {
    return Object.keys(entry).some((k) => match(entry[k], value, params));
  }
  return params.check(entry, value);
};
const sift = (entry, value, params) => {
  if (Array.isArray(entry)) {
    entry = entry.filter((item) => {
      const check2 = params.isRecursive === true ? match(item, value, params) : true;
      if (typeof item === "object" && check2 === true) {
        for (const k of Object.keys(item)) {
          item[k] = sift(item[k], value, params);
        }
      }
      return check2;
    });
  }
  if (params.highlight && (typeof entry === "string" || typeof entry === "number") && typeof value === "string" && match(entry, value, params)) {
    return emphasize(entry, value);
  }
  return entry;
};
const emphasize = (entry, value) => {
  const search = value.replace(/a/g, "[aàâáä]").replace(/e/g, "[eèêéë]").replace(/i/g, "[iìîíï]").replace(/o/g, "[oòôо́ö]").replace(/u/g, "[uùûúü]").replace(/y/g, "[yỳŷýÿ]");
  const exp = new RegExp(`${search}`, "gi");
  return String(entry).replace(exp, `<u class="highlight">$&</u>`);
};
const deepEmphasize = (entry, value, callback) => {
  const path = callback.toString().split("=>")[1].replace(/\(\)/g, "").replace(/\?/g, "").split(".").splice(1).join(".").trim();
  if (path.indexOf(" ") > -1)
    return entry;
  return deepSet(entry, path, value);
};
const deepSet = (entry, path, value) => {
  const initial = entry;
  const keys = path.replace(/\[/g, ".[").split(".");
  try {
    for (let i = 0; i < keys.length; i++) {
      let current = keys[i];
      let next = keys[i + 1];
      if (current.includes("[")) {
        current = String(parseInt(current.substring(1, current.length - 1)));
      }
      if (next && next.includes("[")) {
        next = String(parseInt(next.substring(1, next.length - 1)));
      }
      if (next !== void 0) {
        entry[current] = entry[current] ? entry[current] : isNaN(Number(next)) ? {} : [];
      } else {
        entry[current] = emphasize(entry[current], value);
      }
      entry = entry[current];
    }
    return initial;
  } catch (_) {
    return initial;
  }
};
const parse = (field, id) => {
  if (typeof field === "string") {
    return {
      callback: (row) => row[field],
      id,
      key: field
    };
  } else if (typeof field === "function") {
    return {
      callback: field,
      id,
      key: void 0
    };
  }
  throw new Error(`Invalid field argument: ${String(field)}`);
};
const data = {
  search: (allRows, { scope, isRecursive, value, check: check2 }, highlight = false) => {
    return allRows.filter((row) => {
      const keys = scope ?? Object.keys(row);
      const fields = keys.map((field) => parse(field));
      for (const { key, callback } of fields) {
        if (key) {
          row[key] = sift(row[key], value, {
            highlight,
            isRecursive: isRecursive === true
          });
        } else if (highlight) {
          row = deepEmphasize(row, value, callback);
        }
      }
      return fields.some(({ callback }) => {
        return match(callback(row), value, { check: check2 });
      });
    });
  },
  filter: (allRows, { callback, value, check: check2, key }, highlight = false) => {
    return allRows.filter((row) => {
      const checked = match(callback(row), value, { check: check2 });
      if (key) {
        row[key] = sift(row[key], value, {
          highlight,
          check: check2,
          isRecursive: true
        });
      } else if (highlight && checked && value && typeof value === "string") {
        row = deepEmphasize(row, value, callback);
      }
      return checked;
    });
  },
  query: (allRows, { path, value, check: check2 }) => {
    return allRows.filter((row) => {
      if (path.length === 0) {
        return check2(row, value);
      }
      let obj = row;
      let i = 1;
      let verify = false;
      for (const prop of path) {
        if (i === 1 && i < path.length) {
          obj = obj[prop];
          for (const subobj of obj[prop]) {
          }
        }
        if (i === path.length) {
          console.log(prop, obj);
          obj[prop] = data.query(obj[prop], { path: [], value, check: check2 });
          if (obj[prop].length > 0) {
            verify = true;
          }
        }
        obj = obj[prop];
        i++;
      }
      return verify;
    });
  }
};
const sort = {
  asc: (a, b, locales, options) => {
    if (a === b)
      return 0;
    else if (isNull(a))
      return 1;
    else if (isNull(b))
      return -1;
    else if (typeof a === "boolean")
      return a === false ? 1 : -1;
    else if (typeof a === "string")
      return a.localeCompare(b, locales, options);
    else if (typeof a === "number")
      return a - b;
    else if (typeof a === "object")
      return JSON.stringify(a).localeCompare(JSON.stringify(b), locales, options);
    return String(a).localeCompare(String(b), locales, options);
  },
  desc: (a, b, locales, options) => {
    if (a === b)
      return 0;
    else if (isNull(a))
      return 1;
    else if (isNull(b))
      return -1;
    else if (typeof b === "boolean")
      return b === false ? 1 : -1;
    else if (typeof b === "string")
      return b.localeCompare(a, locales, options);
    else if (typeof b === "number")
      return b - a;
    else if (typeof b === "object")
      return JSON.stringify(b).localeCompare(JSON.stringify(a), locales, options);
    else
      return String(b).localeCompare(String(a), locales, options);
  }
};
class AbstractTableHandler {
  selectBy;
  selectScope = "currentPage";
  highlight;
  event = new EventDispatcher();
  rawRows = [];
  search = { value: null };
  sort = {};
  filters = [];
  queries = [];
  rowsPerPage = 10;
  currentPage = 1;
  element = void 0;
  clientWidth = 1e3;
  #filterCount = derived(() => this.filters.length);
  get filterCount() {
    return this.#filterCount();
  }
  set filterCount($$value) {
    return this.#filterCount($$value);
  }
  #allRows = derived(() => this.createAllRows());
  get allRows() {
    return this.#allRows();
  }
  set allRows($$value) {
    return this.#allRows($$value);
  }
  #rows = derived(() => this.createRows());
  get rows() {
    return this.#rows();
  }
  set rows($$value) {
    return this.#rows($$value);
  }
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
  #pageCount = derived(() => this.pages.length);
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
  constructor(data2, params) {
    this.rawRows = data2;
    this.rowsPerPage = params.rowsPerPage ?? null;
    this.highlight = params.highlight ?? false;
    this.selectBy = params.selectBy;
  }
  createAllRows() {
    let allRows = this.rawRows;
    if (this.search.value) {
      allRows = data.search(allRows, this.search, this.highlight);
      this.event.dispatch("change");
    } else if (this.filters.length > 0) {
      for (const filter of this.filters) {
        allRows = data.filter(allRows, filter, this.highlight);
      }
      this.event.dispatch("change");
    } else if (this.queries.length > 0) {
      for (const query of this.queries) {
        allRows = data.query(allRows, query);
      }
      this.event.dispatch("change");
    }
    return allRows;
  }
  createRows() {
    if (!this.rowsPerPage) return this.allRows;
    return this.allRows.slice((this.currentPage - 1) * this.rowsPerPage, this.currentPage * this.rowsPerPage);
  }
  createRowCount() {
    const total = this.allRows.length;
    if (!this.rowsPerPage) {
      return { total, start: 1, end: total, selected: this.selected.length };
    }
    return {
      total,
      start: this.currentPage * this.rowsPerPage - this.rowsPerPage + 1,
      end: Math.min(this.currentPage * this.rowsPerPage, total),
      selected: this.selected.length
    };
  }
  createPages() {
    if (!this.rowsPerPage) {
      return [1];
    }
    const pages = Array.from(Array(Math.ceil(this.allRows.length / this.rowsPerPage)));
    return pages.map((_, i) => i + 1);
  }
  createPagesWithEllipsis() {
    if (this.pageCount <= 7) {
      return this.pages;
    }
    const ellipse = null;
    const firstPage = 1;
    const lastPage = this.pageCount;
    if (this.currentPage <= 4) {
      return [...this.pages.slice(0, 5), ellipse, lastPage];
    } else if (this.currentPage < lastPage - 3) {
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
        ...this.pages.slice(lastPage - 5, lastPage)
      ];
    }
  }
  createIsAllSelected() {
    if (this.rowCount.total === 0 || !this.selectBy) {
      return false;
    }
    const { callback } = parse(this.selectBy);
    if (this.selectScope === "all") {
      const identifiers2 = this.allRows.map(callback);
      return identifiers2.every((id) => this.selected.includes(id));
    }
    const identifiers = this.rows.map(callback);
    return identifiers.every((id) => this.selected.includes(id));
  }
}
class SortHandler {
  backup;
  table;
  constructor(table) {
    this.table = table;
    this.backup = [];
  }
  set(field, id, params = {}) {
    if (this.table["sort"].id !== id) {
      this.table["sort"].direction = null;
    }
    if (this.table["sort"].direction === null || this.table["sort"].direction === "desc") {
      this.asc(field, id, params);
    } else if (this.table["sort"].direction === "asc") {
      this.desc(field, id, params);
    }
  }
  asc(field, id, { locales, options } = {}) {
    if (!field) return;
    const { callback, key } = parse(field, id);
    this.table["sort"] = { id, callback, direction: "asc", key };
    this.table["rawRows"] = [...this.table["rawRows"]].sort((x, y) => {
      const [a, b] = [callback(x), callback(y)];
      return sort.asc(a, b, locales, options);
    });
    this.save({ id, callback, direction: "asc" });
    this.table.setPage(1);
  }
  desc(field, id, { locales, options } = {}) {
    if (!field) return;
    const { callback, key } = parse(field, id);
    this.table["sort"] = { id, callback, direction: "desc", key };
    this.table["rawRows"] = [...this.table["rawRows"]].sort((x, y) => {
      const [a, b] = [callback(x), callback(y)];
      return sort.desc(a, b, locales, options);
    });
    this.save({ id, callback, direction: "desc" });
    this.table.setPage(1);
  }
  clear() {
    this.backup = [];
    this.table["sort"] = {};
  }
  restore() {
    for (const { key, callback, direction, id } of this.backup) {
      const field = key ?? callback;
      this[direction](field, id);
    }
  }
  save(sort2) {
    this.backup = this.backup.filter((item) => item.id !== sort2.id);
    if (this.backup.length >= 3) {
      const [_, slot2, slot3] = this.backup;
      this.backup = [slot2, slot3, sort2];
    } else {
      this.backup = [...this.backup, sort2];
    }
  }
}
class FilterHandler {
  table;
  constructor(table) {
    this.table = table;
  }
  set(value, field, check2 = null, id) {
    this.table.setPage(1);
    const { callback, key } = parse(field, id);
    const filter = { value, id, callback, check: check2, key };
    this.table.filters = this.table.filters.filter((filter2) => filter2.id !== id);
    if (isNotNull(value)) {
      this.table.filters.push(filter);
    }
  }
  unset(id) {
    this.table.setPage(1);
    this.table.filters = this.table.filters.filter((filter) => filter.id !== id);
  }
}
class QueryHandler {
  table;
  constructor(table) {
    this.table = table;
  }
  set(path, value, check2, id) {
    this.table.setPage(1);
    this.table.queries = this.table.queries.filter((query) => query.id !== id);
    this.table.queries.push({ path, value, check: check2, id });
  }
  unset(id) {
    this.table.setPage(1);
    this.table.queries = this.table.queries.filter((query) => query.id !== id);
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
  all(scope) {
    const rows = scope === "currentPage" ? this.table.rows : this.table.allRows;
    const { callback } = parse(this.table["selectBy"]);
    const selection = rows.map(callback);
    if (scope === "currentPage") {
      if (this.table.isAllSelected) {
        this.table.selected = this.table.selected.filter((item) => selection.includes(item) === false);
      } else {
        this.table.selected = [.../* @__PURE__ */ new Set([...selection, ...this.table.selected])];
      }
    } else {
      this.table.isAllSelected ? this.clear() : this.table.selected = selection;
    }
  }
  clear() {
    this.table.selected = [];
  }
  getRows() {
    const { callback } = parse(this.table["selectBy"]);
    return this.table["rawRows"].filter((row) => {
      return this.table.selected.includes(callback(row));
    });
  }
}
class PageHandler {
  table;
  constructor(table) {
    this.table = table;
  }
  goto(page) {
    if (this.table.rowsPerPage) {
      if (page >= 1 && page <= this.table.pageCount) {
        this.table.currentPage = page;
        this.table["event"].dispatch("change");
      }
    }
  }
  previous() {
    this.goto(this.table.currentPage - 1);
  }
  next() {
    this.goto(this.table.currentPage + 1);
  }
  last() {
    this.goto(this.table.pageCount);
  }
}
class SearchHandler {
  table;
  constructor(table) {
    this.table = table;
  }
  set(value, scope) {
    this.table.setPage(1);
    this.table["search"] = { value, scope };
  }
  recursive(value, scope) {
    this.table.setPage(1);
    this.table["search"] = { value, scope, isRecursive: true };
  }
  regex(pattern, scope) {
    this.table.setPage(1);
    this.table["search"] = { value: pattern, scope, check: check.match };
  }
  clear() {
    this.table.setPage(1);
    this.table["search"] = { value: "" };
  }
}
class SearchBuilder {
  value = "";
  scope;
  searchHandler;
  constructor(searchHandler, scope) {
    this.searchHandler = searchHandler;
    this.scope = scope;
    this.cleanup();
  }
  set() {
    this.searchHandler.set(this.value, this.scope);
  }
  init(value) {
    this.value = value;
    this.set();
    return this;
  }
  recursive() {
    this.searchHandler.recursive(this.value, this.scope);
  }
  regex() {
    this.searchHandler.regex(this.value, this.scope);
  }
  clear() {
    this.value = "";
    this.searchHandler.clear();
  }
  cleanup() {
    this.searchHandler["table"].on("clearSearch", () => this.clear());
  }
}
class FilterBuilder {
  value = "";
  id = Math.random().toString(36).substring(2, 15);
  filterHandler;
  field;
  check;
  constructor(filterHandler, field, check$1) {
    this.filterHandler = filterHandler;
    this.field = field;
    this.check = check$1 ?? check.isLike;
    this.cleanup();
  }
  set(check2) {
    this.filterHandler.set(this.value, this.field, check2 ?? this.check, this.id);
  }
  init(value) {
    this.value = value;
    this.set();
    return this;
  }
  clear() {
    this.value = "";
    this.filterHandler.unset(this.id);
  }
  cleanup() {
    this.filterHandler["table"].on("clearFilters", () => this.clear());
  }
}
class QueryBuilder {
  value = "";
  id = Math.random().toString(36).substring(2, 15);
  queryHandler;
  path = [];
  check;
  constructor(queryHandler) {
    this.queryHandler = queryHandler;
    this.cleanup();
  }
  from(path) {
    this.path = path;
    return this;
  }
  where(filter) {
    this.check = filter;
    return this;
  }
  set(value) {
    if (value) this.value = value;
    this.queryHandler.set(this.path, this.value, this.check, this.id);
  }
  clear() {
    this.value = "";
    this.queryHandler.unset(this.id);
  }
  cleanup() {
    this.queryHandler["table"].on("clearFilters", () => this.clear());
  }
}
class AdvancedFilterBuilder {
  criteria = [];
  id = Math.random().toString(36).substring(2, 15);
  filterHandler;
  collection;
  field;
  check;
  constructor(filterHandler, field, check$1) {
    this.filterHandler = filterHandler;
    this.field = field;
    this.collection = [];
    this.check = check$1 ?? check.isEqualTo;
    this.cleanup();
  }
  set(value, check$1) {
    if (this.collection.find((criterion) => criterion.value === value)) {
      this.collection = this.collection.filter((criterion) => criterion.value !== value);
    } else {
      this.collection = [{ value, check: check$1 ?? this.check }, ...this.collection];
    }
    if (this.collection.length === 0) {
      return this.clear();
    }
    this.filterHandler.set(this.collection, this.field, check.whereIn, this.id);
    this.criteria = this.collection.map((criterion) => criterion.value);
  }
  clear() {
    this.collection = [];
    this.criteria = [];
    this.filterHandler.unset(this.id);
  }
  cleanup() {
    this.filterHandler["table"].on("clearFilters", () => this.clear());
  }
}
class CalcultationBuilder {
  callback;
  precision;
  table;
  constructor(table, field) {
    this.table = table;
    this.callback = parse(field).callback;
  }
  distinct(param) {
    const values = this.table.allRows.map((row) => this.callback(row));
    const aggregate = values.reduce(
      (acc, curr) => {
        if (Array.isArray(curr)) {
          for (const item of curr) {
            acc[item] = (acc[item] ?? 0) + 1;
          }
          return acc;
        }
        acc[curr] = (acc[curr] ?? 0) + 1;
        return acc;
      },
      {}
    );
    const result = Object.entries(aggregate).map(([value, count]) => ({ value, count }));
    if (param?.sort) {
      const [field, direction] = param.sort;
      if (field === "count") {
        result.sort((x, y) => sort.asc(x.value, y.value));
      }
      result.sort((a, b) => sort[direction](a[field], b[field]));
    }
    return result;
  }
  avg(param) {
    this.precision = param?.precision ?? 2;
    if (this.table.allRows.length === 0) return 0;
    const values = this.table.allRows.map((row) => this.callback(row)).filter(Boolean);
    return this.round(values.reduce((acc, curr) => acc + curr, 0) / values.length);
  }
  sum(param) {
    this.precision = param?.precision ?? 2;
    const values = this.table.allRows.map((row) => this.callback(row));
    return this.round(values.reduce((acc, curr) => acc + curr, 0));
  }
  median(param) {
    this.precision = param?.precision ?? 2;
    const values = [...this.table.allRows.map((row) => this.callback(row))].sort((a, b) => a - b).filter(Boolean);
    if (values.length === 0) return null;
    const half = Math.floor(values.length / 2);
    return values.length % 2 ? values[half] : this.round((values[half - 1] + values[half]) / 2);
  }
  bounds() {
    const values = this.table.allRows.map((row) => this.callback(row));
    const numbers = values.filter(Boolean);
    if (numbers.length === 0) return [null, null];
    return [Math.min(...numbers), Math.max(...numbers)];
  }
  round(value) {
    console.log(value, typeof value);
    return Number(value.toFixed(this.precision));
  }
}
class SortBuilder {
  #direction = derived(() => this.createDirection());
  get direction() {
    return this.#direction();
  }
  set direction($$value) {
    return this.#direction($$value);
  }
  #isActive = derived(() => this.createIsActive());
  get isActive() {
    return this.#isActive();
  }
  set isActive($$value) {
    return this.#isActive($$value);
  }
  id = Math.random().toString(36).substring(2, 15);
  sortHandler;
  field;
  params;
  constructor(sortHandler, field, params) {
    this.sortHandler = sortHandler;
    this.field = field;
    this.params = params ?? {};
  }
  set() {
    this.sortHandler.set(this.field, this.id, this.params);
  }
  init(direction) {
    if (!direction) return this;
    this[direction]();
    return this;
  }
  asc() {
    this.sortHandler.asc(this.field, this.id, this.params);
  }
  desc() {
    this.sortHandler.desc(this.field, this.id, this.params);
  }
  clear() {
    this.sortHandler.clear();
  }
  createIsActive() {
    if (this.id === this.sortHandler["table"]["sort"]?.id) {
      return true;
    }
    return false;
  }
  createDirection() {
    if (this.isActive === false) return null;
    return this.sortHandler["table"]["sort"]?.direction;
  }
}
class CSVBuilder {
  table;
  constructor(table) {
    this.table = table;
  }
  download(filename) {
    const csv = this.get();
    const element = document.createElement("a");
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(csv));
    element.setAttribute("download", filename);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }
  get() {
    const rows = this.getRows();
    rows.unshift(this.getHeader().join(","));
    return rows.join("\r\n");
  }
  getRows() {
    return this.table.allRows.map((row) => {
      const entries = Object.entries(row).map(([_, value]) => {
        if (value === null) return "";
        if (typeof value === "number") {
          return value;
        }
        return `"${value}"`;
      });
      return entries.join(",");
    });
  }
  getHeader() {
    const [row] = this.table.allRows;
    return Object.entries(row).map(([key, _]) => {
      return `"${key}"`;
    });
  }
}
class RecordFilterBuilder {
  value = "";
  #records = derived(() => this.createRecords());
  get records() {
    return this.#records();
  }
  set records($$value) {
    return this.#records($$value);
  }
  rawRecords = [];
  filter = "";
  constructor(records) {
    this.rawRecords = records;
  }
  set() {
    this.filter = this.value;
  }
  createRecords() {
    if (isNotNull(this.filter)) {
      return this.rawRecords.filter((record) => match(record, this.filter));
    }
    return this.rawRecords;
  }
}
class TableHandler extends AbstractTableHandler {
  i18n;
  view;
  sortHandler;
  filterHandler;
  queryHandler;
  selectHandler;
  pageHandler;
  searchHandler;
  constructor(data2 = [], params = { rowsPerPage: null }) {
    super(data2, params);
    this.translate(params.i18n);
    this.sortHandler = new SortHandler(this);
    this.filterHandler = new FilterHandler(this);
    this.queryHandler = new QueryHandler(this);
    this.selectHandler = new SelectHandler(this);
    this.pageHandler = new PageHandler(this);
    this.searchHandler = new SearchHandler(this);
  }
  setRows(data2) {
    const scrollTop = this.element?.scrollTop ?? 0;
    this.rawRows = data2;
    run(() => {
      this.event.dispatch("change");
      this.sortHandler.restore();
      if (this.element) {
        setTimeout(() => this.element.scrollTop = scrollTop, 2);
      }
    });
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
        return this.pageHandler.last();
      default:
        return this.pageHandler.goto(value);
    }
  }
  createSearch(scope) {
    return new SearchBuilder(this.searchHandler, scope);
  }
  clearSearch() {
    this.searchHandler.clear();
    this.event.dispatch("clearSearch");
    this.setPage(1);
  }
  createRecordFilter(records) {
    return new RecordFilterBuilder(records);
  }
  createSort(field, params) {
    return new SortBuilder(this.sortHandler, field, params);
  }
  clearSort() {
    this.sortHandler.clear();
  }
  clearFilters() {
    this.filters = [];
    this.event.dispatch("clearFilters");
    this.setPage(1);
  }
  createAdvancedFilter(field, check2) {
    return new AdvancedFilterBuilder(this.filterHandler, field, check2);
  }
  createFilter(field, check2) {
    return new FilterBuilder(this.filterHandler, field, check2);
  }
  createQuery() {
    return new QueryBuilder(this.queryHandler);
  }
  select(value) {
    this.selectHandler.set(value);
  }
  selectAll(params = {}) {
    this.selectScope = params.scope === "all" ? "all" : "currentPage";
    this.selectHandler.all(this.selectScope);
  }
  getSelectedRows() {
    return this.selectHandler.getRows();
  }
  clearSelection() {
    this.selectHandler.clear();
  }
  on(event, callback) {
    this.event.add(event, callback);
  }
  createCalculation(field) {
    return new CalcultationBuilder(this, field);
  }
  createCSV() {
    return new CSVBuilder(this);
  }
  createView(columns) {
    this.view = new ViewBuilder(this, columns);
    return this.view;
  }
  getView() {
    return this.view;
  }
  translate(i18n) {
    this.i18n = {
      ...{
        search: "Search...",
        show: "Show",
        entries: "entries",
        filter: "Filter",
        rowCount: "Showing {start} to {end} of {total} entries",
        noRows: "No entries found",
        previous: "Previous",
        next: "Next"
      },
      ...i18n
    };
  }
}
function StaticTable($$payload, $$props) {
  push();
  let { data: data2 = [], $$slots, $$events, ...rest } = $$props;
  const handler = new TableHandler(data2, { rowsPerPage: getDefaultRows(rest.tableName) });
  RemoteTable($$payload, spread_props([{ handler }, rest]));
  pop();
}

export { StaticTable as S };
//# sourceMappingURL=StaticTable-CFTFs3M2.js.map
