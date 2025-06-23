import { x as push, R as ensure_array_like, M as attr_class, K as escape_html, N as attr, P as stringify, O as clsx, Y as bind_props, z as pop, T as store_get, W as unsubscribe_stores, _ as await_block, $ as attr_style } from './index-BKfiikQf.js';
import { b as getConceptDetails } from './Dictionary-DkgC0mju.js';
import { w as writable } from './exports-CKriv3vT.js';
import { A as AddFilter } from './AddFilter-BMouBxmg.js';
import { L as Loading } from './Loading-DKkczq09.js';
import './toaster-DzAsAKEJ.js';
import './Filter-4LYIgLGB.js';
import './index-BB9JrA1L.js';

function ResultInfoComponent($$payload, $$props) {
  push();
  let { data = {} } = $$props;
  let detailPromise = getConceptDetails(data.conceptPath, data.dataset);
  $$payload.out += `<div class="card bg-surface-100 min-h-60 p-4"><div class="card-body">`;
  await_block(
    $$payload,
    detailPromise,
    () => {
      Loading($$payload, { ring: true, size: "medium" });
    },
    (searchResultDetail) => {
      $$payload.out += `<section data-testid="variable-info" class="flex flex-col w-3/4 p-4"><h3 class="text-primary-500">Variable Information</h3> <div class="w-full flex flex-row justify-between">`;
      if (searchResultDetail.display) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<div><span class="font-bold">Name:</span> ${escape_html(searchResultDetail.display)}</div>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--> `;
      if (searchResultDetail.name) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<div><span class="font-bold mb-1">Accession:</span> ${escape_html(searchResultDetail.name)}</div>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--> `;
      if (searchResultDetail.type) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<div><span class="font-bold mb-1">Type:</span> ${escape_html(searchResultDetail.type)}</div>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--></div> `;
      if (searchResultDetail.description) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<div><span class="font-bold">Description:</span> ${escape_html(searchResultDetail.description)}</div>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--></section> `;
      if (searchResultDetail.table) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<section data-testid="dataset-info" class="flex flex-col w-3/4 p-4"><h3 class="text-primary-500">Dataset Information</h3> <div class="w-full flex flex-row justify-between">`;
        if (searchResultDetail.table.display) {
          $$payload.out += "<!--[-->";
          $$payload.out += `<div><span class="font-bold mb-1">Name:</span> ${escape_html(searchResultDetail.table.display)}</div>`;
        } else {
          $$payload.out += "<!--[!-->";
        }
        $$payload.out += `<!--]--> `;
        if (searchResultDetail.table.name) {
          $$payload.out += "<!--[-->";
          $$payload.out += `<div><span class="font-bold">Accession:</span> ${escape_html(searchResultDetail.table.name)}</div>`;
        } else {
          $$payload.out += "<!--[!-->";
        }
        $$payload.out += `<!--]--></div> `;
        if (searchResultDetail.table.description) {
          $$payload.out += "<!--[-->";
          $$payload.out += `<div><span class="font-bold">Description:</span> ${escape_html(searchResultDetail.table.description)}</div>`;
        } else {
          $$payload.out += "<!--[!-->";
        }
        $$payload.out += `<!--]--></section>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--> `;
      if (searchResultDetail.study) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<section data-testid="study-info" class="flex flex-col w-3/4 p-4"><h3 class="text-primary-500">Study Information</h3> <div class="w-full flex flex-col">`;
        if (searchResultDetail.study.fullName || searchResultDetail.study.display || searchResultDetail.study.studyAcronym || searchResultDetail?.studyAcronym) {
          $$payload.out += "<!--[-->";
          $$payload.out += `<div><span class="font-bold mb-1">Study Name:</span> ${escape_html(searchResultDetail.study.fullName || searchResultDetail.study.display || searchResultDetail.study.studyAcronym || searchResultDetail?.studyAcronym)}</div>`;
        } else {
          $$payload.out += "<!--[!-->";
        }
        $$payload.out += `<!--]--> `;
        if (searchResultDetail.study.ref) {
          $$payload.out += "<!--[-->";
          $$payload.out += `<div><span class="font-bold">Study Accession:</span> ${escape_html(searchResultDetail.study.ref)}</div>`;
        } else {
          $$payload.out += "<!--[!-->";
        }
        $$payload.out += `<!--]--></div></section>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]-->`;
    }
  );
  $$payload.out += `<!--]--></div></div>`;
  pop();
}
function RadioTreeNode_1($$payload, $$props) {
  push();
  const { node, index, isRoot = false } = $$props;
  $$payload.out += `<details class="tree-item"${attr("data-testid", `tree-item:${stringify(node.name)}-${stringify(node.value)}`)}${attr("aria-disabled", node.disabled)} open><summary class="tree-item-summary list-none [&amp;::-webkit-details-marker]:hidden flex items-center cursor-pointer rounded-container p-0 hover:preset-tonal-primary space-x-1 w-full mr-2" role="treeitem"${attr("aria-selected", node.selected)}${attr("aria-expanded", true)}>`;
  if (!isRoot) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<i class="fa-solid fa-angle-left fa-xl -rotate-45 self-center"${attr_style(`margin-left: ${stringify((index + 1) * 9)}px;`)}></i>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <input${attr("id", `radio:${stringify(node.name)}`)}${attr("data-testid", `radio:${stringify(node.name)}`)}${attr_class(`radio tree-item-radio self-center ${stringify(isRoot ? "ml-[28px]" : "")}`)} type="radio" name="tree-radio"${attr("value", node.value)}${attr("checked", node.selected, true)}/> <label${attr("for", `${stringify(node.isLeaf ? "radio:" : "tree-item-btn:")}${stringify(node.name)}`)} class="w-full">${escape_html(node.name)}</label></summary> <div class="tree-item-children ml-4"${attr("data-testid", `tree-item-children:${stringify(node.name)}`)} role="group">`;
  if (!node.isLeaf) {
    $$payload.out += "<!--[-->";
    const each_array = ensure_array_like(node.children);
    $$payload.out += `<!--[-->`;
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let child = each_array[$$index];
      RadioTreeNode_1($$payload, { node: child, index: index + 1 });
    }
    $$payload.out += `<!--]-->`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div></details>`;
  pop();
}
function RadioTree($$payload, $$props) {
  push();
  let {
    nodes = [],
    onselect = () => {
    },
    fullWidth = false
  } = $$props;
  class RadioNode {
    name = "";
    value = "";
    selected = false;
    disabled = false;
    children = [];
    constructor(name, value, children = [], selected = false) {
      this.name = name;
      this.value = value;
      this.children = children;
      this.selected = selected || this.isLeaf;
    }
    get isLeaf() {
      return this.children.length === 0;
    }
    select() {
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
      console.log("selected", this.value);
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
  $$payload.out += `<div${attr_class(clsx(fullWidth ? "w-full" : ""))}><!--[-->`;
  for (let index = 0, $$length = each_array.length; index < $$length; index++) {
    let treeNode = each_array[index];
    RadioTreeNode_1($$payload, { node: treeNode, index, isRoot: index === 0 });
  }
  $$payload.out += `<!--]--></div>`;
  pop();
}
function HierarchyComponent($$payload, $$props) {
  push();
  let { data = {}, onclose = () => {
  } } = $$props;
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
  $$payload.out += `<div data-testid="hierarchy-component" class="flex flex-row bg-surface-100 p-4 rounded-container">`;
  if (treeNode) {
    $$payload.out += "<!--[-->";
    RadioTree($$payload, {
      fullWidth: true,
      nodes: [treeNode],
      onselect: (value) => value
    });
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <button class="btn btn-icon preset-filled-primary-500 m-1" data-testid="add-filter" aria-label="Add Filter"><i class="fas fa-plus"></i></button></div>`;
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
  $$payload.out += `<tr${attr("id", `row-${stringify(index.toString())}`)}${attr_class(clsx(isClickable ? "cursor-pointer" : ""))}${attr("tabindex", isClickable ? 0 : -1)}><!--[-->`;
  for (let colIndex = 0, $$length = each_array.length; colIndex < $$length; colIndex++) {
    let column = each_array[colIndex];
    $$payload.out += `<td${attr("id", `row-${stringify(index.toString())}-col-${stringify(colIndex.toString())}`)}${attr_class(clsx(column?.class?.includes("text-center") ? "text-center" : ""))}>`;
    if (cellOverides[column.dataElement]) {
      $$payload.out += "<!--[-->";
      const SvelteComponent = cellOverides[column.dataElement];
      $$payload.out += `<!---->`;
      SvelteComponent($$payload, {
        data: {
          tableName,
          index,
          row,
          cell: row[column.dataElement]
        }
      });
      $$payload.out += `<!---->`;
    } else {
      $$payload.out += "<!--[!-->";
      $$payload.out += `${escape_html(row[column.dataElement] ? row[column.dataElement] : "")}`;
    }
    $$payload.out += `<!--]--></td>`;
  }
  $$payload.out += `<!--]--></tr> `;
  if (expandable && active && !!store_get($$store_subs ??= {}, "$activeRow", activeRow)) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<tr${attr("id", `active-row-${stringify(index.toString())}`)} class="expandable-row"><td${attr("colspan", columns.length)}><div>`;
    if (store_get($$store_subs ??= {}, "$activeComponent", activeComponent)) {
      $$payload.out += "<!--[-->";
      const SvelteComponent = store_get($$store_subs ??= {}, "$activeComponent", activeComponent);
      $$payload.out += `<!---->`;
      SvelteComponent($$payload, { data: row });
      $$payload.out += `<!---->`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></div></td></tr>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]-->`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
function Filter($$payload, $$props) {
  push();
  let { handler, filterBy, class: className = "" } = $$props;
  const filter = handler.createFilter(filterBy);
  $$payload.out += `<th${attr_class(clsx(className))}><input type="text" class="input text-sm w-full" placeholder="Filter"${attr("value", filter.value)}/></th>`;
  pop();
}
function Sort($$payload, $$props) {
  push();
  let {
    handler,
    orderBy,
    class: className = "",
    children
  } = $$props;
  const sort = handler.createSort(orderBy);
  $$payload.out += `<th${attr_class(`cursor-pointer select-none align-bottom ${stringify(className)}`, void 0, { "active": sort.isActive })}>`;
  children?.($$payload);
  $$payload.out += `<!----> `;
  if (sort.isActive) {
    $$payload.out += "<!--[-->";
    if (sort.direction === "asc") {
      $$payload.out += "<!--[-->";
      $$payload.out += `<i class="fa-solid fa-sort-up"></i>`;
    } else {
      $$payload.out += "<!--[!-->";
      $$payload.out += `<i class="fa-solid fa-sort-down"></i>`;
    }
    $$payload.out += `<!--]-->`;
  } else {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<i class="fa-solid fa-sort"></i>`;
  }
  $$payload.out += `<!--]--></th>`;
  pop();
}
function Rows($$payload, $$props) {
  push();
  let {
    options = [5, 10, 20, 50],
    class: className = ""
  } = $$props;
  const each_array = ensure_array_like(options);
  $$payload.out += `<aside${attr_class(clsx(className))}><label class="flex place-items-center">Show <select id="row-count-select" class="select ml-2 rounded-xl" aria-label="Rows per page"><!--[-->`;
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let option = each_array[$$index];
    $$payload.out += `<option${attr("value", option)}>${escape_html(option)}</option>`;
  }
  $$payload.out += `<!--]--></select></label></aside>`;
  pop();
}
function Count($$payload, $$props) {
  push();
  let { handler } = $$props;
  let { start, end, total } = handler.rowCount;
  $$payload.out += `<aside class="text-sm leading-8 mr-6">`;
  if (total > 0) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<b>${escape_html(start)}</b> - <b>${escape_html(end)}</b> / <b>${escape_html(total)}</b>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></aside>`;
  pop();
}
function Pagination($$payload, $$props) {
  push();
  let { handler } = $$props;
  $$payload.out += `<section class="pagination flex gap-0" aria-label="pagination">`;
  if (handler.pagesWithEllipsis !== void 0 || handler.pages !== void 0) {
    $$payload.out += "<!--[-->";
    const each_array = ensure_array_like(handler.pagesWithEllipsis);
    $$payload.out += `<button type="button" aria-label="Previous" title="Previous"${attr("disabled", handler.currentPage === 1, true)}><i class="fa-solid fa-arrow-left"></i></button> <!--[-->`;
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let page = each_array[$$index];
      $$payload.out += `<button type="button"${attr("aria-label", page ? "Page " + page : "Ellipses")}${attr("title", page ? "Page " + page : "Ellipses")}${attr("disabled", page === null, true)}${attr("aria-current", handler.currentPage === page ? "page" : false)}${attr_class("", void 0, { "active": handler.currentPage === page })}>${escape_html(page ?? "...")}</button>`;
    }
    $$payload.out += `<!--]--> <button type="button" aria-label="Next" title="Next"${attr("disabled", handler.currentPage === handler.pages.length, true)}><i class="fa-solid fa-arrow-right"></i></button>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></section>`;
  pop();
}
function Search($$payload, $$props) {
  push();
  let { handler } = $$props;
  const search = handler.createSearch();
  $$payload.out += `<input class="input text-sm sm:w-64 w-36" type="search" placeholder="Search..."${attr("value", search.value)}/>`;
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
  $$payload.out += `<div class="table-wrap space-y-1">`;
  if (title || searchable || tableActions) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<header${attr_class(`flex items-center ${stringify(title || tableActions ? "justify-between" : "justify-end")} gap-4`)}>`;
    if (title) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<div class="flex-auto"><h2 class="my-2">${escape_html(title)}</h2></div>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--> `;
    tableActions?.($$payload);
    $$payload.out += `<!----> `;
    if (searchable) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<div class="flex-none">`;
      Search($$payload, { handler });
      $$payload.out += `<!----></div>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></header>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <table${attr("id", `${stringify(tableName)}-table`)}${attr("data-testid", `${stringify(tableName)}-table`)}${attr_class(`table table-${stringify(tableAuto ? "auto" : "fixed")} ${stringify(className)}`, "svelte-rudmja", { "w-max": fullWidth, "clickable": isClickable })}><thead class="svelte-rudmja"><tr${attr_class("", void 0, { "sticky-header": stickyHeader })}><!--[-->`;
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let column = each_array[$$index];
    if (column.sort) {
      $$payload.out += "<!--[-->";
      Sort($$payload, {
        handler,
        orderBy: column.dataElement,
        class: column.class,
        children: ($$payload2) => {
          $$payload2.out += `<!---->${escape_html(column.label)}`;
        }
      });
    } else if (column.filter) {
      $$payload.out += "<!--[1-->";
      Filter($$payload, {
        handler,
        class: column.class,
        filterBy: column.dataElement
      });
    } else {
      $$payload.out += "<!--[!-->";
      $$payload.out += `<th${attr_class(clsx(column.class), "svelte-rudmja")}>${escape_html(column.label)}</th>`;
    }
    $$payload.out += `<!--]-->`;
  }
  $$payload.out += `<!--]--></tr></thead><tbody>`;
  if (isLoading) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<tr><td${attr("colspan", columns.length)} class="text-center py-8"><div class="flex justify-center items-center">`;
    Loading($$payload, {});
    $$payload.out += `<!----></div></td></tr>`;
  } else if (handler.rows.length > 0) {
    $$payload.out += "<!--[1-->";
    const each_array_1 = ensure_array_like(handler.rows);
    $$payload.out += `<!--[-->`;
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
    $$payload.out += `<!--]-->`;
  } else {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<tr><td${attr("colspan", columns.length)}>No entries found.</td></tr>`;
  }
  $$payload.out += `<!--]--></tbody></table> `;
  if (showPagination) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<footer class="flex justify-between mt-1">`;
    Count($$payload, { handler });
    $$payload.out += `<!----> <div class="flex justify-end gap-4">`;
    Rows($$payload, { options });
    $$payload.out += `<!----> `;
    Pagination($$payload, { handler });
    $$payload.out += `<!----></div></footer>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div>`;
  bind_props($$props, { isLoading });
  pop();
}

export { RemoteTable as R };
//# sourceMappingURL=RemoteTable-DsZbuyUA.js.map
