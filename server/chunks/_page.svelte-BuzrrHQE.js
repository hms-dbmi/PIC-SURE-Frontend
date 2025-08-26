import { x as push, T as store_get, a1 as head, W as unsubscribe_stores, z as pop, K as escape_html, N as attr, M as attr_class, P as stringify, R as ensure_array_like, U as copy_payload, V as assign_payload, _ as store_set, a0 as derived } from './index-C5NonOVO.js';
import { b as branding } from './configuration-CSskKBur.js';
import './client2-CLhyDddE.js';
import { p as page } from './index3-D0mgFMjB.js';
import { C as Content } from './Content-DHBbMVB_.js';
import { C as CardButton } from './CardButton-mV7OQcpn.js';
import { w as writable } from './exports-Cnt0TmSD.js';
import './index2-CvuFLVuQ.js';
import { Q as get, R as Picsure, av as resources, t as toaster } from './User-ByrNDeqq.js';
import './client-BWx-wafP.js';
import { g as getFiltersByType } from './Filter-BUwQwcV6.js';
import './Export-CTQ_v_3l.js';
import { H as HelpInfoPopup } from './HelpInfoPopup-CBAhAJrD.js';
import { s as selectedGenes, c as clearGeneFilters, v as variantData, a as selectedConsequence, b as selectedFrequency, d as consequences, p as populateFromGeneFilter, e as addConsquence, r as removeConsequence } from './GeneFilter-B5irLK_t.js';
import { O as OptionsSelectionList } from './OptionsSelectionList-Dlogw0gs.js';
import 'uuid';
import './Popover-D0sAJhG1.js';
import './Loading-Drx6gnkR.js';

var Option = /* @__PURE__ */ ((Option2) => {
  Option2["None"] = "none";
  Option2["Genomic"] = "genomic";
  Option2["SNP"] = "snp";
  return Option2;
})(Option || {});
const GenotypeMap = {
  "0/1": "Heterozygous",
  "1/1": "Homozygous",
  "1/1,0/1": "Heterozygous or Homozygous",
  "0/1,1/1": "Heterozygous or Homozygous"
  // '0/0': 'Excluded', add back once HPDS accepts it
};
const selectedSNPs = writable([]);
function populateFromSNPFilter(filter) {
  selectedSNPs.set(filter.snpValues);
}
function clearSnpFilters() {
  selectedSNPs.set([]);
}
function FilterType($$payload, $$props) {
  push();
  const {
    active = Option.None,
    class: className = "",
    onselect = () => {
    }
  } = $$props;
  $$payload.out += `<div${attr_class(`flex flex-row justify-center justify-items-center gap-16 ${stringify(className ?? "")}`)}>`;
  {
    $$payload.out += "<!--[-->";
    CardButton($$payload, {
      "data-testid": "gene-variant-option",
      title: "Variants by gene name",
      subtitle: "Ex: Rare BRCA1 variants with high severity",
      size: "other",
      class: "w-1/4 h-20 min-h-20",
      active: active === Option.Genomic,
      onclick: () => onselect(Option.Genomic)
    });
  }
  $$payload.out += `<!--]--> `;
  {
    $$payload.out += "<!--[-->";
    CardButton($$payload, {
      "data-testid": "snp-option",
      title: "Specific Variants",
      subtitle: "Ex: chr5,148481541,T,A",
      size: "other",
      class: "w-1/4 h-20 min-h-20",
      active: active === Option.SNP,
      onclick: () => onselect(Option.SNP)
    });
  }
  $$payload.out += `<!--]--> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div>`;
  pop();
}
function Panel($$payload, $$props) {
  push();
  const {
    title = "",
    subtitle = "",
    required = false,
    "data-testid": testid = "",
    class: className = "",
    action,
    help,
    children
  } = $$props;
  $$payload.out += `<div${attr_class(`flex flex-col ${stringify(className)}`)}${attr("data-testid", testid || title.replaceAll(" ", "-").toLowerCase())}><div class="relative rounded-t-2xl bg-primary-300-700 p-4 items-center flex">`;
  if (required) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<span class="absolute top-0 left-1 p-1 text-error-600-400 text-xs">* Required</span>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <div class="flex-auto text-center"><div class="font-bold">${escape_html(title)}</div> `;
  if (subtitle) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div>${escape_html(subtitle)}</div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div> `;
  if (action) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<span class="flex-none ml-1">`;
    action($$payload);
    $$payload.out += `<!----></span>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  if (help) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<span class="flex-none ml-1">`;
    help($$payload);
    $$payload.out += `<!----></span>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div> <div class="h-full p-2 border rounded-b-2xl border-surface-300-700">`;
  children?.($$payload);
  $$payload.out += `<!----></div></div>`;
  pop();
}
function Search($$payload, $$props) {
  push();
  const {
    search = "",
    disabled = false
  } = $$props;
  const genomeBuild = branding.genomic?.defaultGenomeBuild || "GRCh38";
  const validSnpPattern = /^\w+,\d+,(A|T|C|G)+,(A|T|C|G)+$/;
  let searching = false;
  let searchStringElement = search;
  let validSNPString = validSnpPattern.test(searchStringElement);
  $$payload.out += `<p class="text-center">Enter the following information into the search bar using genome build ${escape_html(genomeBuild)}: chromosome,
  position, reference allele, variant allele.</p> <p class="text-center">If you have the rsID of the variant, you can use the <a href="https://www.ncbi.nlm.nih.gov/snp/" target="_blank" rel="noopener noreferrer" class="anchor">dbSNP database</a> to find the genomic coordinates.</p> <p class="text-center font-bold my-6"><em class="font-bold">Example:</em> chr5,148481541,T,A</p> <div class="flex gap-2 mx-auto my-8 w-1/2"><input type="search" class="input" placeholder="chromosome (chr#), position, reference allele, variant allele" data-testid="snp-search-box"${attr("disabled", disabled, true)}${attr("value", searchStringElement)}/> <button type="button" data-testid="snp-search-btn" class="btn btn-sm preset-filled-primary-500 text-lg disabled:opacity-75"${attr("disabled", disabled || !validSNPString || searching, true)}>Search `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></button></div> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]-->`;
  pop();
}
function Summary$1($$payload, $$props) {
  push();
  var $$store_subs;
  const each_array = ensure_array_like(store_get($$store_subs ??= {}, "$selectedSNPs", selectedSNPs));
  $$payload.out += `<div class="flex items-center justify-center">`;
  if (store_get($$store_subs ??= {}, "$selectedSNPs", selectedSNPs).length === 0) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<p>No filters added.</p>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <!--[-->`;
  for (let index = 0, $$length = each_array.length; index < $$length; index++) {
    let snp = each_array[index];
    if (index !== 0) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<div class="font-bold flex items-center justify-center p-6">AND</div>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--> <div class="border rounded-sm border-surface-300-700 p-3 flex gap-4"><div class="flex-auto"><div class="text-surface-700-300 font-bold">${escape_html(snp.search)}:</div> <div class="text-surface-600-400">${escape_html(GenotypeMap[snp.constraint])}</div></div> <div class="flex-none text-right"><button type="button"${attr("data-testid", `snp-edit-btn-${snp.search}`)} title="Edit" aria-label="Edit" class="btn-icon-color"><i class="fa-solid fa-pen-to-square"></i></button> <button type="button"${attr("data-testid", `snp-delete-btn-${snp.search}`)} title="Delete" aria-label="Delete" class="btn-icon-color"><i class="fa-solid fa-trash"></i></button></div></div>`;
  }
  $$payload.out += `<!--]--></div>`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
function SNPSearch($$payload, $$props) {
  push();
  var $$store_subs;
  let { class: className = "" } = $$props;
  const defaultSnp = { search: "" };
  let snp = defaultSnp;
  $$payload.out += `<div id="snp-search"${attr_class(`grid grid-cols-1 gap-3 ${stringify(className || "")}`)}>`;
  Panel($$payload, {
    title: "Search for Genomic Variants",
    children: ($$payload2) => {
      Search($$payload2, {
        disabled: false,
        search: snp.search
      });
      $$payload2.out += `<!----> `;
      {
        $$payload2.out += "<!--[!-->";
      }
      $$payload2.out += `<!--]-->`;
    }
  });
  $$payload.out += `<!----> `;
  {
    let action = function($$payload2) {
      $$payload2.out += `<button class="btn btn-xs preset-outlined-surface-500 hover:preset-tonal-primary border border-primary-500"${attr("disabled", store_get($$store_subs ??= {}, "$selectedSNPs", selectedSNPs).length === 0, true)}>Clear</button>`;
    };
    Panel($$payload, {
      title: "Summary of Selected Filters",
      action,
      children: ($$payload2) => {
        Summary$1($$payload2);
      }
    });
  }
  $$payload.out += `<!----></div>`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
function Genes($$payload, $$props) {
  push();
  var $$store_subs;
  let allGenes = [];
  let unselectedGenes = store_get($$store_subs ??= {}, "$selectedGenes", selectedGenes).length === 0 ? allGenes : allGenes.filter((gene) => !store_get($$store_subs ??= {}, "$selectedGenes", selectedGenes).includes(gene));
  let lastFilter = "";
  let pageSize = 20;
  let currentPage = 0;
  let totalPages = 1;
  let loading = false;
  let allOptionsLoaded = false;
  async function getGeneValues(search = "") {
    const newSearch = lastFilter !== search;
    if (!newSearch && (currentPage >= totalPages || allOptionsLoaded)) return;
    loading = true;
    try {
      const response = await get(
        `${Picsure.Search}/${store_get($$store_subs ??= {}, "$resources", resources).search}/values/?` + new URLSearchParams({
          genomicConceptPath: "Gene_with_variant",
          query: search,
          page: (newSearch ? 1 : currentPage + 1).toString(),
          size: pageSize.toString()
        }),
        { "content-type": "application/json" }
      );
      if (response?.error) {
        throw response.error;
      }
      const newGenes = response.results;
      allGenes = newSearch ? newGenes : [...allGenes, ...newGenes];
      totalPages = Math.ceil(response.total / pageSize);
      currentPage = response.page;
      lastFilter = search;
      allOptionsLoaded = newGenes.length < pageSize;
    } catch (error) {
      console.error(error);
      toaster.error({
        title: "An error occurred while loading genes list."
      });
    } finally {
      loading = false;
    }
  }
  let $$settled = true;
  let $$inner_payload;
  function $$render_inner($$payload2) {
    $$payload2.out += `<div class="flex gap-4 mb-2">`;
    OptionsSelectionList($$payload2, {
      showSelectAll: false,
      showClearAll: false,
      allOptionsLoaded,
      onscroll: getGeneValues,
      get unselectedOptions() {
        return unselectedGenes;
      },
      set unselectedOptions($$value) {
        unselectedGenes = $$value;
        $$settled = false;
      },
      get selectedOptions() {
        return store_get($$store_subs ??= {}, "$selectedGenes", selectedGenes);
      },
      set selectedOptions($$value) {
        store_set(selectedGenes, $$value);
        $$settled = false;
      },
      get currentlyLoading() {
        return loading;
      },
      set currentlyLoading($$value) {
        loading = $$value;
        $$settled = false;
      }
    });
    $$payload2.out += `<!----></div>`;
  }
  do {
    $$settled = true;
    $$inner_payload = copy_payload($$payload);
    $$render_inner($$inner_payload);
  } while (!$$settled);
  assign_payload($$payload, $$inner_payload);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
function Frequency($$payload) {
  var $$store_subs;
  $$payload.out += `<label class="cursor-pointer block hover:preset-tonal-surface hover:rounded-md"><input${attr("checked", store_get($$store_subs ??= {}, "$selectedFrequency", selectedFrequency).includes("Rare"), true)} id="Rare" type="checkbox" value="Rare"/> Rare</label> <label class="cursor-pointer block hover:preset-tonal-surface hover:rounded-md"><input${attr("checked", store_get($$store_subs ??= {}, "$selectedFrequency", selectedFrequency).includes("Common"), true)} id="Common" type="checkbox" value="Common"/> Common</label> <label class="cursor-pointer block hover:preset-tonal-surface hover:rounded-md"><input${attr("checked", store_get($$store_subs ??= {}, "$selectedFrequency", selectedFrequency).includes("Novel"), true)} id="Novel" type="checkbox" value="Novel"/> Novel</label>`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
}
function TreeNode_1($$payload, $$props) {
  push();
  const { node } = $$props;
  $$payload.out += `<details class="tree-item"${attr("data-testid", `tree-item:${stringify(node.name)}-${stringify(node.value)}`)}${attr("aria-disabled", node.disabled)}${attr("open", node.open, true)}><summary class="tree-item-summary list-none [&amp;::-webkit-details-marker]:hidden flex items-center cursor-pointer space-x-4 rounded-container p-0 hover:preset-tonal-primary w-full" role="treeitem"${attr("aria-selected", node.allSelected)}${attr("aria-expanded", node.open)}><button${attr("id", `tree-item-btn:${stringify(node.name)}-${stringify(node.value)}`)}${attr("data-testid", `tree-item-btn:${stringify(node.name)}-${stringify(node.value)}`)}${attr("title", !node.isLeaf ? `${node.open ? "Close" : "Open"} node` : void 0)}${attr("name", node.name)} type="button" class="m-1 ml-2"${attr("tabindex", node.isLeaf ? -1 : 0)}>`;
  if (!node.isLeaf) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<i${attr_class(`fa-solid fa-angle-${stringify(node.open ? "up" : "down")}`)}></i>`;
  } else {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<i class="fa-solid fa-minus"></i>`;
  }
  $$payload.out += `<!--]--></button> <input${attr("id", `checkbox:${stringify(node.name)}-${stringify(node.value)}`)}${attr("data-testid", `checkbox:${stringify(node.name)}-${stringify(node.value)}`)} class="checkbox tree-item-checkbox mr-1" type="checkbox"${attr("name", node.name)}${attr("value", node.value)}${attr("checked", node.allSelected, true)}${attr("indeterminate", node.indeterminant, true)}/> <label${attr("for", `${stringify(node.isLeaf ? "checkbox:" : "tree-item-btn:")}${stringify(node.name)}-${stringify(node.value)}`)} class="w-full">${escape_html(node.value)}</label></summary> <div class="tree-item-children ml-4"${attr("data-testid", `tree-item-children:${stringify(node.name)}`)} role="group">`;
  if (!node.isLeaf && node.open) {
    $$payload.out += "<!--[-->";
    const each_array = ensure_array_like(node.children);
    $$payload.out += `<!--[-->`;
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let child = each_array[$$index];
      TreeNode_1($$payload, { node: child });
    }
    $$payload.out += `<!--]-->`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div></details>`;
  pop();
}
function Tree($$payload, $$props) {
  push();
  let {
    nodes = [],
    onselect = () => {
    },
    onunselect = () => {
    },
    fullWidth = false
  } = $$props;
  class TreeNode {
    name = "";
    value = "";
    open = false;
    selected = false;
    disabled = false;
    children = [];
    constructor(name, value, children = [], open = false, selected = false) {
      this.name = name;
      this.value = value;
      this.children = children;
      this.open = open;
      this.selected = selected;
    }
    #isLeaf = derived(() => this.children.length === 0);
    get isLeaf() {
      return this.#isLeaf();
    }
    set isLeaf($$value) {
      return this.#isLeaf($$value);
    }
    #someSelected = derived(() => {
      if (this.isLeaf) return this.selected;
      return this.children.some((child) => child.someSelected);
    });
    get someSelected() {
      return this.#someSelected();
    }
    set someSelected($$value) {
      return this.#someSelected($$value);
    }
    #allSelected = derived(() => {
      if (this.isLeaf) return this.selected;
      return this.children.every((child) => child.allSelected);
    });
    get allSelected() {
      return this.#allSelected();
    }
    set allSelected($$value) {
      return this.#allSelected($$value);
    }
    #noneSelected = derived(() => {
      if (this.isLeaf) return !this.selected;
      return !this.someSelected;
    });
    get noneSelected() {
      return this.#noneSelected();
    }
    set noneSelected($$value) {
      return this.#noneSelected($$value);
    }
    #indeterminant = derived(() => {
      if (this.isLeaf) return false;
      return this.someSelected && !this.allSelected;
    });
    get indeterminant() {
      return this.#indeterminant();
    }
    set indeterminant($$value) {
      return this.#indeterminant($$value);
    }
    select() {
      if (!this.isLeaf) {
        this.children.forEach((child) => child.select());
        this.open = true;
      } else {
        this.selected = true;
        onselect(this.value);
      }
    }
    unselect() {
      if (!this.isLeaf) {
        this.children.forEach((child) => child.unselect());
      } else {
        this.selected = false;
        onunselect(this.value);
      }
    }
    toggleSelected() {
      if (this.allSelected) {
        this.unselect();
      } else {
        this.select();
      }
    }
    toggleOpen() {
      if (this.isLeaf) return;
      this.open = !this.open;
    }
  }
  function mapNodeToTree(node) {
    const { name, value, open, selected } = node;
    let children = [];
    let shouldOpen = open;
    if (node.children.length > 0) {
      children = node.children.map(mapNodeToTree);
      shouldOpen = children.some((child) => child.someSelected);
    }
    return new TreeNode(name, value, children, shouldOpen, selected);
  }
  let treeNodes = nodes.map(mapNodeToTree);
  const each_array = ensure_array_like(treeNodes);
  $$payload.out += `<div${attr_class(`overflow-auto h-[350.75px] ${stringify(fullWidth ? "w-full" : "")}`)}><!--[-->`;
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let treeNode = each_array[$$index];
    TreeNode_1($$payload, { node: treeNode });
  }
  $$payload.out += `<!--]--></div>`;
  pop();
}
function Consequence($$payload, $$props) {
  push();
  var $$store_subs;
  let nodes = variantData.map(({ key, children }) => ({
    name: "severity",
    value: key,
    children: children.map((child) => ({
      name: key,
      value: child,
      children: [],
      open: false,
      selected: store_get($$store_subs ??= {}, "$selectedConsequence", selectedConsequence).includes(child)
    })),
    open: false,
    selected: false
  }));
  Tree($$payload, {
    nodes,
    onselect: addConsquence,
    onunselect: removeConsequence
  });
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
function Summary($$payload, $$props) {
  push();
  var $$store_subs;
  const each_array = ensure_array_like(store_get($$store_subs ??= {}, "$selectedGenes", selectedGenes));
  const each_array_1 = ensure_array_like(store_get($$store_subs ??= {}, "$consequences", consequences));
  const each_array_2 = ensure_array_like(store_get($$store_subs ??= {}, "$selectedFrequency", selectedFrequency));
  $$payload.out += `<div class="overflow-auto flex"><div class="border rounded-sm border-surface-500 flex flex-col items-center justify-center w-3/15 p-2 svelte-13v7sph"><span class="font-bold">Geneomic Region:</span> <div id="selected-variant" class="text-center break-words"><!--[-->`;
  for (let index = 0, $$length = each_array.length; index < $$length; index++) {
    let gene = each_array[index];
    if (index !== 0) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<span class="font-bold mx-1 text-primary-500">OR</span>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--> ${escape_html(gene)}`;
  }
  $$payload.out += `<!--]--> `;
  if (store_get($$store_subs ??= {}, "$selectedGenes", selectedGenes).length === 0) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<span class="italic">None</span>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div></div> <div class="font-bold flex items-center justify-center w-1/15 svelte-13v7sph">AND</div> <div class="border rounded-sm border-surface-500 flex flex-col items-center justify-center w-3/15 p-2 svelte-13v7sph"><span class="font-bold">Calculated Consequence:</span> <div id="selected-consequence" class="text-center break-words"><!--[-->`;
  for (let index = 0, $$length = each_array_1.length; index < $$length; index++) {
    let cons = each_array_1[index];
    if (index !== 0) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<span class="font-bold mx-1 text-primary-500">OR</span>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--> ${escape_html(cons)}`;
  }
  $$payload.out += `<!--]--> `;
  if (store_get($$store_subs ??= {}, "$consequences", consequences).length === 0) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<span class="italic">None</span>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div></div> <div class="font-bold flex items-center justify-center w-1/15 svelte-13v7sph">AND</div> <div class="border rounded-sm border-surface-500 flex flex-col items-center justify-center w-3/15 p-2 svelte-13v7sph"><span class="font-bold">Variant Frequency:</span> <div id="selected-frequency" class="text-center break-words"><!--[-->`;
  for (let index = 0, $$length = each_array_2.length; index < $$length; index++) {
    let freq = each_array_2[index];
    if (index !== 0) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<span class="font-bold mx-1 text-primary-500">OR</span>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--> ${escape_html(freq)}`;
  }
  $$payload.out += `<!--]--> `;
  if (store_get($$store_subs ??= {}, "$selectedFrequency", selectedFrequency).length === 0) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<span class="italic">None</span>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div></div></div>`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
function GeneSearch($$payload, $$props) {
  push();
  let { $$slots, $$events, ...props } = $$props;
  const helpText = branding?.help?.popups?.genomicFilter;
  $$payload.out += `<div id="gene-search"${attr_class(`grid grid-cols-3 gap-3 ${stringify(props.class || "")}`)}>`;
  {
    let action = function($$payload2) {
      $$payload2.out += `<button data-testid="clear-selected-genes-btn" class="btn btn-xs preset-outlined-surface-500 hover:preset-tonal-primary border border-primary-500">Clear</button>`;
    };
    Panel($$payload, {
      title: "Search for Gene with Variant",
      subtitle: "Use the official gene symbol.",
      required: true,
      action,
      children: ($$payload2) => {
        Genes($$payload2);
      }
    });
  }
  $$payload.out += `<!----> `;
  {
    let help = function($$payload2) {
      HelpInfoPopup($$payload2, {
        id: "cons-help-popup",
        text: helpText.consequence
      });
    };
    Panel($$payload, {
      title: "Select Calculated Consequence",
      subtitle: "The calculated consequence is based on VEP annotation.",
      help,
      children: ($$payload2) => {
        Consequence($$payload2);
      }
    });
  }
  $$payload.out += `<!----> `;
  {
    let help = function($$payload2) {
      HelpInfoPopup($$payload2, {
        id: "freq-help-popup",
        text: helpText.frequency
      });
    };
    Panel($$payload, {
      title: "Select Variant Frequency",
      help,
      children: ($$payload2) => {
        Frequency($$payload2);
      }
    });
  }
  $$payload.out += `<!----> `;
  {
    let action = function($$payload2) {
      $$payload2.out += `<button data-testid="clear-gene-filters-btn" class="btn btn-xs preset-outlined-surface-500 hover:preset-tonal-primary border border-primary-500">Clear</button>`;
    };
    Panel($$payload, {
      title: "Summary of Selected Filters",
      class: "col-span-3",
      action,
      children: ($$payload2) => {
        Summary($$payload2);
      }
    });
  }
  $$payload.out += `<!----></div>`;
  pop();
}
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  let edit = page.url.searchParams.get("edit") || "";
  let selectedOption = (() => {
    return ["snp", "genomic"].includes(edit) ? edit : Option.None;
  })();
  function clearFilters() {
    clearGeneFilters();
    clearSnpFilters();
  }
  function populateExistingFilters() {
    if (selectedOption === Option.Genomic) {
      const filters = getFiltersByType("genomic");
      filters.length === 1 && populateFromGeneFilter(filters[0]);
    } else if (selectedOption === Option.SNP) {
      const filters = getFiltersByType("snp");
      filters.length === 1 && populateFromSNPFilter(filters[0]);
    }
  }
  function onSelectFilterType(option) {
    selectedOption = option;
    populateExistingFilters();
  }
  let canComplete = selectedOption === Option.Genomic && store_get($$store_subs ??= {}, "$selectedGenes", selectedGenes).length > 0 || selectedOption === Option.SNP && store_get($$store_subs ??= {}, "$selectedSNPs", selectedSNPs).length > 0;
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>${escape_html(branding.applicationName)} | Gemonic Filter</title>`;
  });
  Content($$payload, {
    full: true,
    title: "Genomic Filtering",
    backUrl: "/explorer",
    backAction: clearFilters,
    backTitle: "Back to Explore",
    transition: true,
    children: ($$payload2) => {
      {
        $$payload2.out += "<!--[-->";
        FilterType($$payload2, {
          class: "my-4",
          onselect: onSelectFilterType,
          active: selectedOption
        });
      }
      $$payload2.out += `<!--]--> `;
      if (selectedOption !== Option.None) {
        $$payload2.out += "<!--[-->";
        if (selectedOption === Option.Genomic) {
          $$payload2.out += "<!--[-->";
          GeneSearch($$payload2, { class: "mb-0 mt-6" });
        } else {
          $$payload2.out += "<!--[!-->";
          SNPSearch($$payload2, { class: "mt-6" });
        }
        $$payload2.out += `<!--]--> `;
        if (edit) {
          $$payload2.out += "<!--[-->";
          $$payload2.out += `<div class="flex justify-end my-4"><button data-testid="save-filter-btn" type="button" class="btn btn-sm preset-filled-primary-500 text-lg disabled:opacity-75"${attr("disabled", !canComplete, true)}>Save Filter <i class="fa-solid fa-plus ml-3"></i></button></div>`;
        } else {
          $$payload2.out += "<!--[!-->";
          $$payload2.out += `<div class="flex justify-end my-4" data-testid="filter-options-container"><button data-testid="add-filter-btn" type="button" class="btn btn-sm preset-filled-primary-500 text-lg disabled:opacity-75"${attr("title", canComplete ? "Add Filter" : selectedOption === Option.Genomic ? "A gene is required" : "A SNP is required")}${attr("disabled", !canComplete, true)}>Add Filter <i class="fa-solid fa-plus ml-3"></i></button></div>`;
        }
        $$payload2.out += `<!--]-->`;
      } else {
        $$payload2.out += "<!--[!-->";
      }
      $$payload2.out += `<!--]-->`;
    }
  });
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}

export { _page as default };
//# sourceMappingURL=_page.svelte-BuzrrHQE.js.map
