import { c as create_ssr_component, a as add_attribute, b as each, e as escape, h as add_classes, v as validate_component, m as missing_component } from './ssr-BRJpAXVH.js';
import { a as subscribe, n as noop } from './lifecycle-DtuISP6h.js';
import { w as writable } from './index2-BVONNh3m.js';

const activeTable = writable("");
const activeRow = writable("");
const expandableComponents = writable({});
const activeComponent = writable();
const Filter = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { handler } = $$props;
  let { filterBy } = $$props;
  let value;
  if ($$props.handler === void 0 && $$bindings.handler && handler !== void 0) $$bindings.handler(handler);
  if ($$props.filterBy === void 0 && $$bindings.filterBy && filterBy !== void 0) $$bindings.filterBy(filterBy);
  return `<th${add_attribute("class", $$props.class ?? "", 0)}><input class="input text-sm w-full" type="text" placeholder="Filter"${add_attribute("value", value, 0)}></th>`;
});
const Rows = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let rowsPerPage;
  let $$unsubscribe_rowsPerPage = noop, $$subscribe_rowsPerPage = () => ($$unsubscribe_rowsPerPage(), $$unsubscribe_rowsPerPage = subscribe(rowsPerPage, ($$value) => $$value), rowsPerPage);
  let { handler } = $$props;
  let { options = [5, 10, 20, 50] } = $$props;
  if ($$props.handler === void 0 && $$bindings.handler && handler !== void 0) $$bindings.handler(handler);
  if ($$props.options === void 0 && $$bindings.options && options !== void 0) $$bindings.options(options);
  $$subscribe_rowsPerPage(rowsPerPage = handler.getRowsPerPage());
  $$unsubscribe_rowsPerPage();
  return `<aside${add_attribute("class", $$props.class ?? "", 0)}><label class="flex place-items-center">Show
    <select id="row-count-select" class="select ml-2" aria-label="Rows per page">${each(options, (option) => {
    return `<option${add_attribute("value", option, 0)}>${escape(option)} </option>`;
  })}</select></label></aside>`;
});
const Count = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $rowCount, $$unsubscribe_rowCount;
  let { handler } = $$props;
  const rowCount = handler.getRowCount();
  $$unsubscribe_rowCount = subscribe(rowCount, (value) => $rowCount = value);
  if ($$props.handler === void 0 && $$bindings.handler && handler !== void 0) $$bindings.handler(handler);
  $$unsubscribe_rowCount();
  return `<aside class="text-sm leading-8 mr-6">${$rowCount?.total > 0 ? `<b>${escape($rowCount.start)}</b>
    - <b>${escape($rowCount.end)}</b>
    / <b>${escape($rowCount.total)}</b>` : ``}</aside>`;
});
const Pagination = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $pages, $$unsubscribe_pages;
  let $pageNumber, $$unsubscribe_pageNumber;
  let $pageCount, $$unsubscribe_pageCount;
  let { handler } = $$props;
  const pageNumber = handler.getPageNumber();
  $$unsubscribe_pageNumber = subscribe(pageNumber, (value) => $pageNumber = value);
  const pageCount = handler.getPageCount();
  $$unsubscribe_pageCount = subscribe(pageCount, (value) => $pageCount = value);
  const pages = handler.getPages({ ellipsis: true });
  $$unsubscribe_pages = subscribe(pages, (value) => $pages = value);
  if ($$props.handler === void 0 && $$bindings.handler && handler !== void 0) $$bindings.handler(handler);
  $$unsubscribe_pages();
  $$unsubscribe_pageNumber();
  $$unsubscribe_pageCount();
  return ` <section class="btn-group-custom h-10 hidden lg:block">${$pages !== void 0 ? `<button type="button" ${$pageNumber === 1 ? "disabled" : ""}>←</button> ${each($pages, (page) => {
    return `<button type="button"${add_classes((($pageNumber === page ? "active" : "") + " " + (page === null ? "ellipse" : "")).trim())}>${escape(page ?? "...")} </button>`;
  })} <button type="button" ${$pageNumber === $pageCount ? "disabled" : ""}>→</button>` : ``}</section>`;
});
const Row = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let active;
  let $activeRow, $$unsubscribe_activeRow;
  let $activeTable, $$unsubscribe_activeTable;
  let $expandableComponents, $$unsubscribe_expandableComponents;
  let $activeComponent, $$unsubscribe_activeComponent;
  $$unsubscribe_activeRow = subscribe(activeRow, (value) => $activeRow = value);
  $$unsubscribe_activeTable = subscribe(activeTable, (value) => $activeTable = value);
  $$unsubscribe_expandableComponents = subscribe(expandableComponents, (value) => $expandableComponents = value);
  $$unsubscribe_activeComponent = subscribe(activeComponent, (value) => $activeComponent = value);
  let { cellOverides = {} } = $$props;
  let { columns = [] } = $$props;
  let { index = -2 } = $$props;
  let { row = {} } = $$props;
  let { tableName = "" } = $$props;
  let { isClickable = false } = $$props;
  let { rowClickHandler = () => {
  } } = $$props;
  if ($$props.cellOverides === void 0 && $$bindings.cellOverides && cellOverides !== void 0) $$bindings.cellOverides(cellOverides);
  if ($$props.columns === void 0 && $$bindings.columns && columns !== void 0) $$bindings.columns(columns);
  if ($$props.index === void 0 && $$bindings.index && index !== void 0) $$bindings.index(index);
  if ($$props.row === void 0 && $$bindings.row && row !== void 0) $$bindings.row(row);
  if ($$props.tableName === void 0 && $$bindings.tableName && tableName !== void 0) $$bindings.tableName(tableName);
  if ($$props.isClickable === void 0 && $$bindings.isClickable && isClickable !== void 0) $$bindings.isClickable(isClickable);
  if ($$props.rowClickHandler === void 0 && $$bindings.rowClickHandler && rowClickHandler !== void 0) $$bindings.rowClickHandler(rowClickHandler);
  active = $activeTable === tableName && ($activeRow === row?.conceptPath || $activeRow === row.dataset_id);
  $$unsubscribe_activeRow();
  $$unsubscribe_activeTable();
  $$unsubscribe_expandableComponents();
  $$unsubscribe_activeComponent();
  return `<tr id="${"row-" + escape(index.toString(), true)}"${add_attribute("class", isClickable ? "cursor-pointer" : "", 0)}${add_attribute("tabindex", isClickable ? 0 : -1, 0)}>${each(columns, (column, colIndex) => {
    return `<td id="${"row-" + escape(index.toString(), true) + "-col-" + escape(colIndex.toString(), true)}"${add_attribute(
      "class",
      column?.class?.includes("text-center") ? "text-center" : "",
      0
    )}>${cellOverides[column.dataElement] ? `${validate_component(cellOverides[column.dataElement] || missing_component, "svelte:component").$$render(
      $$result,
      {
        data: {
          index,
          row,
          cell: row[column.dataElement]
        }
      },
      {},
      {}
    )}` : `${escape(row[column.dataElement] ? row[column.dataElement] : "")}`} </td>`;
  })}</tr> ${active && Object.keys($expandableComponents).length > 0 ? `<tr id="${"active-row-" + escape(index.toString(), true)}" class="expandable-row"><td${add_attribute("colspan", columns.length, 0)}><div>${$activeComponent ? `${validate_component($activeComponent || missing_component, "svelte:component").$$render($$result, { data: row }, {}, {})}` : ``}</div></td></tr>` : ``}`;
});

export { Count as C, Filter as F, Pagination as P, Row as R, Rows as a, activeTable as b, expandableComponents as e };
//# sourceMappingURL=Row-Cb2p0o0o.js.map
