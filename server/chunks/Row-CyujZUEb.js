import { h as null_to_empty, a as subscribe } from './lifecycle-GVhEEkqU.js';
import { c as create_ssr_component, e as escape, a as add_attribute, b as each, h as add_classes, v as validate_component, m as missing_component } from './ssr-Di-o4HBA.js';
import { w as writable } from './index2-CV6P_ZFI.js';

const activeTable = writable("");
const activeRow = writable("");
const expandableComponents = writable({});
const activeComponent = writable();
const css$1 = {
  code: "th.svelte-1q8lxw8{font-weight:normal !important}",
  map: `{"version":3,"file":"Filter.svelte","sources":["Filter.svelte"],"sourcesContent":["<script lang=\\"ts\\">import { DataHandler as RemoteDataHandler } from \\"@vincjo/datatables/remote\\";\\nexport let handler;\\nexport let filterBy;\\nlet timeout;\\nlet value;\\nconst filter = () => {\\n  handler.filter(value, filterBy);\\n  if (handler instanceof RemoteDataHandler) {\\n    clearTimeout(timeout);\\n    timeout = setTimeout(() => {\\n      handler.invalidate();\\n    }, 400);\\n  }\\n};\\n<\/script>\\n\\n<th class={$$props.class ?? ''}>\\n  <input\\n    class=\\"input text-sm w-full\\"\\n    type=\\"text\\"\\n    placeholder=\\"Filter\\"\\n    bind:value\\n    on:input={filter}\\n  />\\n</th>\\n\\n<style>\\n  th {\\n    font-weight: normal !important;\\n  }</style>\\n"],"names":[],"mappings":"AA2BE,iBAAG,CACD,WAAW,CAAE,MAAM,CAAC,UACtB"}`
};
const Filter = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { handler } = $$props;
  let { filterBy } = $$props;
  let value;
  if ($$props.handler === void 0 && $$bindings.handler && handler !== void 0) $$bindings.handler(handler);
  if ($$props.filterBy === void 0 && $$bindings.filterBy && filterBy !== void 0) $$bindings.filterBy(filterBy);
  $$result.css.add(css$1);
  return `<th class="${escape(null_to_empty($$props.class ?? ""), true) + " svelte-1q8lxw8"}"><input class="input text-sm w-full" type="text" placeholder="Filter"${add_attribute("value", value, 0)}> </th>`;
});
const Rows = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$unsubscribe_rowsPerPage;
  let { handler } = $$props;
  let { options = [5, 10, 20, 50] } = $$props;
  const rowsPerPage = handler.getRowsPerPage();
  $$unsubscribe_rowsPerPage = subscribe(rowsPerPage, (value) => value);
  if ($$props.handler === void 0 && $$bindings.handler && handler !== void 0) $$bindings.handler(handler);
  if ($$props.options === void 0 && $$bindings.options && options !== void 0) $$bindings.options(options);
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
const css = {
  code: ".expandable-row.svelte-1ho0u1e.svelte-1ho0u1e{background-color:rgb(var(--color-surface-300)) !important}tr.svelte-1ho0u1e:not(.expandable-row) td.svelte-1ho0u1e:last-child{text-align:center}",
  map: `{"version":3,"file":"Row.svelte","sources":["Row.svelte"],"sourcesContent":["<script lang=\\"ts\\">import { slide } from \\"svelte/transition\\";\\nimport { activeTable, activeRow, expandableComponents, activeComponent, setActiveRow } from \\"$lib/stores/ExpandableRow\\";\\nexport let cellOverides = {};\\nexport let columns = [];\\nexport let index = -2;\\nexport let row = {};\\nexport let tableName = \\"\\";\\nexport let rowClickHandler = () => {\\n};\\nfunction onClick(row2) {\\n  setActiveRow({ row: row2.conceptPath, table: tableName });\\n  rowClickHandler(row2);\\n}\\n$: active = $activeTable === tableName && $activeRow === row?.conceptPath;\\n<\/script>\\n\\n<tr\\n  id=\\"row-{index.toString()}\\"\\n  on:click|stopPropagation={() => onClick(row)}\\n  class=\\"cursor-pointer\\"\\n>\\n  {#each columns as column, colIndex}\\n    <td id=\\"row-{index.toString()}-col-{colIndex.toString()}\\">\\n      {#if cellOverides[column.dataElement]}\\n        <svelte:component\\n          this={cellOverides[column.dataElement]}\\n          data={{ index, row, cell: row[column.dataElement] }}\\n        />\\n      {:else}\\n        {row[column.dataElement] ? row[column.dataElement] : ''}\\n      {/if}\\n    </td>\\n  {/each}\\n</tr>\\n\\n{#if active && Object.keys($expandableComponents).length > 0}\\n  <tr id=\\"active-row-{index.toString()}\\" class=\\"expandable-row\\">\\n    <td colspan={columns.length}>\\n      <div transition:slide={{ axis: 'y' }}>\\n        {#if $activeComponent}\\n          <svelte:component this={$activeComponent} data={row} />\\n        {/if}\\n      </div>\\n    </td>\\n  </tr>\\n{/if}\\n\\n<style>\\n  .expandable-row {\\n    background-color: rgb(var(--color-surface-300)) !important;\\n  }\\n\\n  tr:not(.expandable-row) td:last-child {\\n    text-align: center;\\n  }</style>\\n"],"names":[],"mappings":"AAgDE,6CAAgB,CACd,gBAAgB,CAAE,IAAI,IAAI,mBAAmB,CAAC,CAAC,CAAC,UAClD,CAEA,iBAAE,KAAK,eAAe,CAAC,CAAC,iBAAE,WAAY,CACpC,UAAU,CAAE,MACd"}`
};
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
  let { rowClickHandler = () => {
  } } = $$props;
  if ($$props.cellOverides === void 0 && $$bindings.cellOverides && cellOverides !== void 0) $$bindings.cellOverides(cellOverides);
  if ($$props.columns === void 0 && $$bindings.columns && columns !== void 0) $$bindings.columns(columns);
  if ($$props.index === void 0 && $$bindings.index && index !== void 0) $$bindings.index(index);
  if ($$props.row === void 0 && $$bindings.row && row !== void 0) $$bindings.row(row);
  if ($$props.tableName === void 0 && $$bindings.tableName && tableName !== void 0) $$bindings.tableName(tableName);
  if ($$props.rowClickHandler === void 0 && $$bindings.rowClickHandler && rowClickHandler !== void 0) $$bindings.rowClickHandler(rowClickHandler);
  $$result.css.add(css);
  active = $activeTable === tableName && $activeRow === row?.conceptPath;
  $$unsubscribe_activeRow();
  $$unsubscribe_activeTable();
  $$unsubscribe_expandableComponents();
  $$unsubscribe_activeComponent();
  return `<tr id="${"row-" + escape(index.toString(), true)}" class="cursor-pointer svelte-1ho0u1e">${each(columns, (column, colIndex) => {
    return `<td id="${"row-" + escape(index.toString(), true) + "-col-" + escape(colIndex.toString(), true)}" class="svelte-1ho0u1e">${cellOverides[column.dataElement] ? `${validate_component(cellOverides[column.dataElement] || missing_component, "svelte:component").$$render(
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
  })}</tr> ${active && Object.keys($expandableComponents).length > 0 ? `<tr id="${"active-row-" + escape(index.toString(), true)}" class="expandable-row svelte-1ho0u1e"><td${add_attribute("colspan", columns.length, 0)} class="svelte-1ho0u1e"><div>${$activeComponent ? `${validate_component($activeComponent || missing_component, "svelte:component").$$render($$result, { data: row }, {}, {})}` : ``}</div></td></tr>` : ``}`;
});

export { Count as C, Filter as F, Pagination as P, Row as R, Rows as a, activeTable as b, expandableComponents as e };
//# sourceMappingURL=Row-CyujZUEb.js.map
