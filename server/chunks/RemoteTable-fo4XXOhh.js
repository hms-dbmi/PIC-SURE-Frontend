import { x as push, S as ensure_array_like, N as attr_class, M as escape_html, O as attr, Q as stringify, P as clsx, Z as bind_props, z as pop, U as store_get, X as unsubscribe_stores, a3 as maybe_selected, Y as await_block, V as copy_payload, W as assign_payload, a1 as attr_style } from './index-BYsoXH7a.js';
import { b as getConceptDetails } from './Dictionary-SO9EnU4C.js';
import { w as writable } from './utils-Dn8W3aSK.js';
import { A as AddFilter } from './AddFilter-DdRxu9jO.js';
import { L as Loading } from './Loading-D4A6B7i5.js';
import './Filter-D4fknGLB.js';
import './User-CGCqDR6a.js';
import { M as Modal_1 } from './Modal-CHSSe0AJ.js';
import { p as page } from './index2-DXnmzf54.js';
import { E as ErrorAlert } from './ErrorAlert-BJMruCzq.js';

function ResultInfoComponent($$payload, $$props) {
  push();
  let { data = {} } = $$props;
  let detailPromise = getConceptDetails(data.conceptPath, data.dataset);
  $$payload.out.push(`<div class="card bg-surface-100 min-h-60 p-4"><div class="card-body">`);
  await_block(
    $$payload,
    detailPromise,
    () => {
      Loading($$payload, { ring: true, size: "medium" });
    },
    (searchResultDetail) => {
      $$payload.out.push(`<section data-testid="variable-info" class="flex flex-col w-3/4 p-4"><h3 class="text-primary-500">Variable Information</h3> <div class="w-full flex flex-row justify-between">`);
      if (searchResultDetail.display) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<div><span class="font-bold">Name:</span> ${escape_html(searchResultDetail.display)}</div>`);
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]--> `);
      if (searchResultDetail.name) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<div><span class="font-bold mb-1">Accession:</span> ${escape_html(searchResultDetail.name)}</div>`);
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]--> `);
      if (searchResultDetail.type) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<div><span class="font-bold mb-1">Type:</span> ${escape_html(searchResultDetail.type)}</div>`);
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]--></div> `);
      if (searchResultDetail.description) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<div><span class="font-bold">Description:</span> ${escape_html(searchResultDetail.description)}</div>`);
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]--></section> `);
      if (searchResultDetail.table) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<section data-testid="dataset-info" class="flex flex-col w-3/4 p-4"><h3 class="text-primary-500">Dataset Information</h3> <div class="w-full flex flex-row justify-between">`);
        if (searchResultDetail.table.display) {
          $$payload.out.push("<!--[-->");
          $$payload.out.push(`<div><span class="font-bold mb-1">Name:</span> ${escape_html(searchResultDetail.table.display)}</div>`);
        } else {
          $$payload.out.push("<!--[!-->");
        }
        $$payload.out.push(`<!--]--> `);
        if (searchResultDetail.table.name) {
          $$payload.out.push("<!--[-->");
          $$payload.out.push(`<div><span class="font-bold">Accession:</span> ${escape_html(searchResultDetail.table.name)}</div>`);
        } else {
          $$payload.out.push("<!--[!-->");
        }
        $$payload.out.push(`<!--]--></div> `);
        if (searchResultDetail.table.description) {
          $$payload.out.push("<!--[-->");
          $$payload.out.push(`<div><span class="font-bold">Description:</span> ${escape_html(searchResultDetail.table.description)}</div>`);
        } else {
          $$payload.out.push("<!--[!-->");
        }
        $$payload.out.push(`<!--]--></section>`);
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]--> `);
      if (searchResultDetail.study) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<section data-testid="study-info" class="flex flex-col w-3/4 p-4"><h3 class="text-primary-500">Study Information</h3> <div class="w-full flex flex-col">`);
        if (searchResultDetail.study.fullName || searchResultDetail.study.display || searchResultDetail.study.studyAcronym || searchResultDetail?.studyAcronym) {
          $$payload.out.push("<!--[-->");
          $$payload.out.push(`<div><span class="font-bold mb-1">Study Name:</span> ${escape_html(searchResultDetail.study.fullName || searchResultDetail.study.display || searchResultDetail.study.studyAcronym || searchResultDetail?.studyAcronym)}</div>`);
        } else {
          $$payload.out.push("<!--[!-->");
        }
        $$payload.out.push(`<!--]--> `);
        if (searchResultDetail.study.ref) {
          $$payload.out.push("<!--[-->");
          $$payload.out.push(`<div><span class="font-bold">Study Accession:</span> ${escape_html(searchResultDetail.study.ref)}</div>`);
        } else {
          $$payload.out.push("<!--[!-->");
        }
        $$payload.out.push(`<!--]--></div></section>`);
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]-->`);
    }
  );
  $$payload.out.push(`<!--]--></div></div>`);
  pop();
}
function RadioTreeNode_1($$payload, $$props) {
  push();
  const { node, index, isRoot = false, disabled = false } = $$props;
  $$payload.out.push(`<details class="tree-item"${attr("data-testid", `tree-item:${stringify(node.name)}-${stringify(node.value)}`)}${attr("aria-disabled", node.disabled || disabled)} open><summary class="tree-item-summary list-none [&amp;::-webkit-details-marker]:hidden flex items-center cursor-pointer rounded-container p-0 hover:preset-tonal-primary space-x-1 w-full mr-2" role="treeitem"${attr("aria-selected", node.selected)}${attr("aria-expanded", true)}>`);
  if (!isRoot) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<i class="fa-solid fa-angle-left fa-xl -rotate-45 self-center"${attr_style(`margin-left: ${stringify((index + 1) * 9)}px;`)}></i>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> <input${attr("id", `radio:${stringify(node.name)}`)}${attr("data-testid", `radio:${stringify(node.name)}`)}${attr_class(`radio tree-item-radio self-center ${stringify(isRoot ? "ml-[28px]" : "")}`)} type="radio" name="tree-radio"${attr("value", node.value)}${attr("disabled", node.disabled || disabled, true)}${attr("checked", node.selected, true)}/> <label${attr("for", `${stringify(node.isLeaf ? "radio:" : "tree-item-btn:")}${stringify(node.name)}`)} class="w-full">${escape_html(node.name)}</label></summary> <div class="tree-item-children ml-4"${attr("data-testid", `tree-item-children:${stringify(node.name)}`)} role="group">`);
  if (!node.isLeaf) {
    $$payload.out.push("<!--[-->");
    const each_array = ensure_array_like(node.children);
    $$payload.out.push(`<!--[-->`);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let child = each_array[$$index];
      RadioTreeNode_1($$payload, { node: child, index: index + 1, disabled });
    }
    $$payload.out.push(`<!--]-->`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div></details>`);
  pop();
}
function RadioTree($$payload, $$props) {
  push();
  let {
    nodes = [],
    fullWidth = false,
    onselect = () => {
    },
    disableTree = false
  } = $$props;
  class RadioNode {
    name = "";
    value = "";
    selected = false;
    disabled = disableTree;
    children = [];
    constructor(name, value, children = [], selected = false, disabled = false) {
      this.name = name;
      this.value = value;
      this.children = children;
      this.selected = selected || this.isLeaf;
      this.disabled = disabled;
    }
    get isLeaf() {
      return this.children.length === 0;
    }
    select() {
      if (this.disabled) return;
      treeNodes.forEach((rootNode) => {
        const unselectNode = (node) => {
          if (node !== this) {
            node.selected = false;
            node.children.forEach(unselectNode);
          }
        };
        unselectNode(rootNode);
      });
      this.selected = true;
      onselect(this.value);
    }
  }
  function mapNodeToTree(node) {
    const { name, value, selected } = node;
    let children = [];
    if (node.children.length > 0) {
      children = node.children.map(mapNodeToTree);
    }
    return new RadioNode(name, value, children, selected);
  }
  let treeNodes = nodes.map(mapNodeToTree);
  const each_array = ensure_array_like(treeNodes);
  $$payload.out.push(`<div${attr_class(clsx(fullWidth ? "w-full" : ""))}><!--[-->`);
  for (let index = 0, $$length = each_array.length; index < $$length; index++) {
    let treeNode = each_array[index];
    RadioTreeNode_1($$payload, {
      node: treeNode,
      index,
      disabled: disableTree,
      isRoot: index === 0
    });
  }
  $$payload.out.push(`<!--]--></div>`);
  pop();
}
function HierarchyComponent($$payload, $$props) {
  push();
  let { data = {}, onclose = () => {
  } } = $$props;
  let modalOpen = false;
  let disableAddFilter = !data?.allowFiltering && page.url.pathname.includes("/discover");
  let conceptNodes = data.conceptPath.split("\\").reduce(
    (acc, node, index, array) => {
      if (index === 0 && node === "") return acc;
      if (index === array.length - 1 && node === "") return acc;
      return [...acc, node];
    },
    []
  );
  let treeNode = createHierarchy();
  function createHierarchy() {
    if (!conceptNodes.length) return null;
    let currentNode = null;
    for (let i = conceptNodes.length - 1; i >= 0; i--) {
      const nodeName = conceptNodes[i];
      currentNode = {
        name: nodeName,
        value: `\\${conceptNodes.slice(0, i + 1).join("\\")}\\`,
        children: currentNode ? [currentNode] : [],
        open: true,
        selected: false
      };
    }
    return currentNode;
  }
  data.conceptPath;
  let $$settled = true;
  let $$inner_payload;
  function $$render_inner($$payload2) {
    Modal_1($$payload2, {
      "data-testid": "hierarchy-component-error-modal",
      title: "Data tree selection too large",
      closeable: true,
      width: "w-1/2",
      get open() {
        return modalOpen;
      },
      set open($$value) {
        modalOpen = $$value;
        $$settled = false;
      },
      children: ($$payload3) => {
        $$payload3.out.push(`<div data-testid="hierarchy-component-error-modal-content"><p class="m-0">The level of the data tree you selected exceeds 9,500 variables. This was not added as a
      filter to your query. Please make a selection lower in the data tree and try again.</p> <div class="flex justify-center mt-4"><button class="btn preset-filled-primary-500">Okay</button></div></div>`);
      },
      $$slots: { default: true }
    });
    $$payload2.out.push(`<!----> <div data-testid="hierarchy-component" class="flex flex-row justify-between bg-surface-100 p-4 rounded-container"><div class="flex flex-col gap-2">`);
    if (disableAddFilter) {
      $$payload2.out.push("<!--[-->");
      ErrorAlert($$payload2, {
        color: "warning",
        children: ($$payload3) => {
          $$payload3.out.push(`<p class="m-0">Filtering is not available for this variable</p>`);
        }
      });
    } else {
      $$payload2.out.push("<!--[!-->");
    }
    $$payload2.out.push(`<!--]--> `);
    if (treeNode) {
      $$payload2.out.push("<!--[-->");
      RadioTree($$payload2, {
        fullWidth: true,
        nodes: [treeNode],
        disableTree: disableAddFilter,
        onselect: (value) => value
      });
    } else {
      $$payload2.out.push("<!--[!-->");
    }
    $$payload2.out.push(`<!--]--></div> <button class="btn btn-icon preset-filled-primary-500 m-1" data-testid="add-filter"${attr("aria-label", "Add Filter")}${attr("disabled", disableAddFilter, true)}>`);
    {
      $$payload2.out.push("<!--[!-->");
      if (disableAddFilter) {
        $$payload2.out.push("<!--[-->");
        $$payload2.out.push(`<i class="fas fa-warning"></i> <span class="sr-only">Filtering is not available for this variable</span>`);
      } else {
        $$payload2.out.push("<!--[!-->");
        $$payload2.out.push(`<i class="fas fa-plus"></i>`);
      }
      $$payload2.out.push(`<!--]-->`);
    }
    $$payload2.out.push(`<!--]--></button></div>`);
  }
  do {
    $$settled = true;
    $$inner_payload = copy_payload($$payload);
    $$render_inner($$inner_payload);
  } while (!$$settled);
  assign_payload($$payload, $$inner_payload);
  pop();
}
const components = {
  filter: () => AddFilter,
  info: () => ResultInfoComponent,
  hierarchy: () => HierarchyComponent
};
const activeTable = writable("");
const activeRow = writable("");
const activeComponent = writable(components.info());
function Row($$payload, $$props) {
  push();
  var $$store_subs;
  let {
    cellOverides = {},
    columns = [],
    index = -2,
    row = {},
    tableName = "",
    isClickable = false,
    expandable = false
  } = $$props;
  let active = store_get($$store_subs ??= {}, "$activeTable", activeTable) === tableName && (store_get($$store_subs ??= {}, "$activeRow", activeRow) === row?.conceptPath || store_get($$store_subs ??= {}, "$activeRow", activeRow) === row.dataset_id);
  const each_array = ensure_array_like(columns);
  $$payload.out.push(`<tr${attr("id", `row-${stringify(index.toString())}`)}${attr_class(clsx(isClickable ? "cursor-pointer" : ""))}${attr("tabindex", isClickable ? 0 : -1)}><!--[-->`);
  for (let colIndex = 0, $$length = each_array.length; colIndex < $$length; colIndex++) {
    let column = each_array[colIndex];
    $$payload.out.push(`<td${attr("id", `row-${stringify(index.toString())}-col-${stringify(colIndex.toString())}`)}${attr_class(clsx(column?.class?.includes("text-center") ? "text-center" : ""))}>`);
    if (cellOverides[column.dataElement]) {
      $$payload.out.push("<!--[-->");
      const SvelteComponent = cellOverides[column.dataElement];
      $$payload.out.push(`<!---->`);
      SvelteComponent($$payload, {
        data: { tableName, index, row, cell: row[column.dataElement] }
      });
      $$payload.out.push(`<!---->`);
    } else {
      $$payload.out.push("<!--[!-->");
      $$payload.out.push(`${escape_html(row[column.dataElement] ? row[column.dataElement] : "")}`);
    }
    $$payload.out.push(`<!--]--></td>`);
  }
  $$payload.out.push(`<!--]--></tr> `);
  if (expandable && active && !!store_get($$store_subs ??= {}, "$activeRow", activeRow)) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<tr${attr("id", `active-row-${stringify(index.toString())}`)} class="expandable-row"><td${attr("colspan", columns.length)}><div>`);
    if (store_get($$store_subs ??= {}, "$activeComponent", activeComponent)) {
      $$payload.out.push("<!--[-->");
      const SvelteComponent = store_get($$store_subs ??= {}, "$activeComponent", activeComponent);
      $$payload.out.push(`<!---->`);
      SvelteComponent($$payload, { data: row });
      $$payload.out.push(`<!---->`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--></div></td></tr>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]-->`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
function Filter($$payload, $$props) {
  push();
  let { handler, filterBy, class: className = "" } = $$props;
  const filter = handler.createFilter(filterBy);
  $$payload.out.push(`<th${attr_class(clsx(className))}><input type="text" class="input text-sm w-full" placeholder="Filter"${attr("value", filter.value)}/></th>`);
  pop();
}
function Sort($$payload, $$props) {
  push();
  let { handler, orderBy, class: className = "", children } = $$props;
  const sort = handler.createSort(orderBy);
  $$payload.out.push(`<th${attr_class(`cursor-pointer select-none align-bottom ${stringify(className)}`, void 0, { "active": sort.isActive })}>`);
  children?.($$payload);
  $$payload.out.push(`<!----> `);
  if (sort.isActive) {
    $$payload.out.push("<!--[-->");
    if (sort.direction === "asc") {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<i class="fa-solid fa-sort-up"></i>`);
    } else {
      $$payload.out.push("<!--[!-->");
      $$payload.out.push(`<i class="fa-solid fa-sort-down"></i>`);
    }
    $$payload.out.push(`<!--]-->`);
  } else {
    $$payload.out.push("<!--[!-->");
    $$payload.out.push(`<i class="fa-solid fa-sort"></i>`);
  }
  $$payload.out.push(`<!--]--></th>`);
  pop();
}
function Rows($$payload, $$props) {
  push();
  let {
    handler,
    options = [5, 10, 20, 50],
    class: className = ""
  } = $$props;
  const each_array = ensure_array_like(options);
  $$payload.out.push(`<aside${attr_class(clsx(className))}><label class="flex place-items-center">Show <select id="row-count-select" class="ml-2 rounded-xl" aria-label="Rows per page">`);
  $$payload.select_value = handler.rowsPerPage;
  $$payload.out.push(`<!--[-->`);
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let option = each_array[$$index];
    $$payload.out.push(`<option${attr("value", option)}${maybe_selected($$payload, option)}>${escape_html(option)}</option>`);
  }
  $$payload.out.push(`<!--]-->`);
  $$payload.select_value = void 0;
  $$payload.out.push(`</select></label></aside>`);
  pop();
}
function Count($$payload, $$props) {
  push();
  let { handler } = $$props;
  let { start, end, total } = handler.rowCount;
  $$payload.out.push(`<aside class="text-sm leading-8 mr-6">`);
  if (total > 0) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<b>${escape_html(start)}</b> - <b>${escape_html(end)}</b> / <b>${escape_html(total)}</b>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></aside>`);
  pop();
}
function Pagination($$payload, $$props) {
  push();
  let { handler } = $$props;
  $$payload.out.push(`<section class="pagination flex gap-0" aria-label="pagination">`);
  if (handler.pagesWithEllipsis !== void 0 || handler.pages !== void 0) {
    $$payload.out.push("<!--[-->");
    const each_array = ensure_array_like(handler.pagesWithEllipsis);
    $$payload.out.push(`<button type="button" aria-label="Previous" title="Previous"${attr("disabled", handler.currentPage === 1, true)}><i class="fa-solid fa-arrow-left"></i></button> <!--[-->`);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let page2 = each_array[$$index];
      $$payload.out.push(`<button type="button"${attr("aria-label", page2 ? "Page " + page2 : "Ellipses")}${attr("title", page2 ? "Page " + page2 : "Ellipses")}${attr("disabled", page2 === null, true)}${attr("aria-current", handler.currentPage === page2 ? "page" : false)}${attr_class("", void 0, { "active": handler.currentPage === page2 })}>${escape_html(page2 ?? "...")}</button>`);
    }
    $$payload.out.push(`<!--]--> <button type="button" aria-label="Next" title="Next"${attr("disabled", handler.currentPage === handler.pages.length, true)}><i class="fa-solid fa-arrow-right"></i></button>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></section>`);
  pop();
}
function Search($$payload, $$props) {
  push();
  let { handler } = $$props;
  const search = handler.createSearch();
  $$payload.out.push(`<input class="input text-sm sm:w-64 w-36" type="search" placeholder="Search..."${attr("value", search.value)}/>`);
  pop();
}
function RemoteTable($$payload, $$props) {
  push();
  let {
    tableName,
    handler,
    isLoading = false,
    searchable = false,
    title = "",
    fullWidth = false,
    options = [5, 10, 20, 50, 100],
    columns = [],
    cellOverides = {},
    tableAuto = true,
    stickyHeader = false,
    showPagination = true,
    class: className = "",
    isClickable = false,
    expandable = false,
    rowClickHandler = () => {
    },
    tableActions
  } = $$props;
  const each_array = ensure_array_like(columns);
  $$payload.out.push(`<div class="table-wrap space-y-1">`);
  if (title || searchable || tableActions) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<header${attr_class(`flex items-center ${stringify(title || tableActions ? "justify-between" : "justify-end")} gap-4`)}>`);
    if (title) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<div class="flex-auto"><h2 class="my-2">${escape_html(title)}</h2></div>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--> `);
    tableActions?.($$payload);
    $$payload.out.push(`<!----> `);
    if (searchable) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<div class="flex-none">`);
      Search($$payload, { handler });
      $$payload.out.push(`<!----></div>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--></header>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> <table${attr("id", `${stringify(tableName)}-table`)}${attr("data-testid", `${stringify(tableName)}-table`)}${attr_class(`table table-${stringify(tableAuto ? "auto" : "fixed")} ${stringify(className)}`, "svelte-buj8sd", { "w-max": fullWidth, "clickable": isClickable })}><thead class="svelte-buj8sd"><tr${attr_class("", void 0, { "sticky-header": stickyHeader })}><!--[-->`);
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let column = each_array[$$index];
    if (column.sort) {
      $$payload.out.push("<!--[-->");
      Sort($$payload, {
        handler,
        orderBy: column.dataElement,
        class: column.class,
        children: ($$payload2) => {
          $$payload2.out.push(`<!---->${escape_html(column.label)}`);
        }
      });
    } else {
      $$payload.out.push("<!--[!-->");
      if (column.filter) {
        $$payload.out.push("<!--[-->");
        Filter($$payload, { handler, class: column.class, filterBy: column.dataElement });
      } else {
        $$payload.out.push("<!--[!-->");
        $$payload.out.push(`<th${attr_class(clsx(column.class), "svelte-buj8sd")}>${escape_html(column.label)}</th>`);
      }
      $$payload.out.push(`<!--]-->`);
    }
    $$payload.out.push(`<!--]-->`);
  }
  $$payload.out.push(`<!--]--></tr></thead><tbody>`);
  if (isLoading) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<tr><td${attr("colspan", columns.length)} class="text-center py-8"><div class="flex justify-center items-center">`);
    Loading($$payload, { ring: true, size: "small", color: "primary" });
    $$payload.out.push(`<!----></div></td></tr>`);
  } else {
    $$payload.out.push("<!--[!-->");
    if (handler.rows.length > 0) {
      $$payload.out.push("<!--[-->");
      const each_array_1 = ensure_array_like(handler.rows);
      $$payload.out.push(`<!--[-->`);
      for (let i = 0, $$length = each_array_1.length; i < $$length; i++) {
        let row = each_array_1[i];
        Row($$payload, {
          tableName,
          cellOverides,
          columns,
          index: i,
          row,
          isClickable,
          expandable
        });
      }
      $$payload.out.push(`<!--]-->`);
    } else {
      $$payload.out.push("<!--[!-->");
      $$payload.out.push(`<tr><td${attr("colspan", columns.length)}>No entries found.</td></tr>`);
    }
    $$payload.out.push(`<!--]-->`);
  }
  $$payload.out.push(`<!--]--></tbody></table> `);
  if (showPagination) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<footer class="flex justify-between mt-1">`);
    Count($$payload, { handler });
    $$payload.out.push(`<!----> <div class="flex justify-end gap-4">`);
    Rows($$payload, { handler, options });
    $$payload.out.push(`<!----> `);
    Pagination($$payload, { handler });
    $$payload.out.push(`<!----></div></footer>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div>`);
  bind_props($$props, { isLoading });
  pop();
}

export { RemoteTable as R };
//# sourceMappingURL=RemoteTable-fo4XXOhh.js.map
