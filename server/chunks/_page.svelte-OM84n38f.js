import { a as subscribe, k as createEventDispatcher, s as setContext, m as compute_slots, f as getContext } from './lifecycle-DtuISP6h.js';
import { c as create_ssr_component, e as escape, v as validate_component, a as add_attribute, b as each } from './ssr-BRJpAXVH.js';
import { b as branding } from './configuration-DBHGr3VN.js';
import './client-BR749xJD.js';
import { p as page } from './stores4-C3NPX6l0.js';
import { C as Content } from './Content-DMwoUi6K.js';
import { C as CardButton } from './CardButton-BunBsA3_.js';
import { w as writable } from './index2-BVONNh3m.js';
import './index-CvuFLVuQ.js';
import './User-fDnXlPjS.js';
import './Filter-DGDHgVxd.js';
import './ProgressBar.svelte_svelte_type_style_lang-3a6XZCfa.js';
import { g as getToastStore } from './stores2-Cy1ftf_v.js';
import { s as selectedGenes, c as clearGeneFilters, a as selectedFrequency, b as selectedConsequence, v as variantData, d as consequences } from './GeneFilter-DYiuK3q5.js';
import { P as ProgressRadial } from './ProgressRadial-STSdW-aK.js';
import './exports-kR70XCWV.js';
import './AngleButton-C6YzBYNH.js';

/* empty css                                                                          */
const TreeView = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let classesBase;
  let { selection = false } = $$props;
  let { multiple = false } = $$props;
  let { width = "w-full" } = $$props;
  let { spacing = "space-y-1" } = $$props;
  let { open = false } = $$props;
  let { disabled = false } = $$props;
  let { padding = "py-4 px-4" } = $$props;
  let { indent = "ml-4" } = $$props;
  let { hover = "hover:variant-soft" } = $$props;
  let { rounded = "rounded-container-token" } = $$props;
  let { caretOpen = "rotate-180" } = $$props;
  let { caretClosed = "" } = $$props;
  let { hyphenOpacity = "opacity-10" } = $$props;
  let { regionSummary = "" } = $$props;
  let { regionSymbol = "" } = $$props;
  let { regionChildren = "" } = $$props;
  let { labelledby = "" } = $$props;
  function expandAll() {
    const detailsElements = tree.querySelectorAll("details.tree-item");
    detailsElements.forEach((details) => {
      if (!details.open) {
        const summary = details.querySelector("summary.tree-item-summary");
        if (summary) summary.click();
      }
    });
  }
  function collapseAll() {
    const detailsElements = tree.querySelectorAll("details.tree-item");
    detailsElements.forEach((details) => {
      if (details.open) {
        const summary = details.querySelector("summary.tree-item-summary");
        if (summary) summary.click();
      }
    });
  }
  setContext("open", open);
  setContext("selection", selection);
  setContext("multiple", multiple);
  setContext("disabled", disabled);
  setContext("padding", padding);
  setContext("indent", indent);
  setContext("hover", hover);
  setContext("rounded", rounded);
  setContext("caretOpen", caretOpen);
  setContext("caretClosed", caretClosed);
  setContext("hyphenOpacity", hyphenOpacity);
  setContext("regionSummary", regionSummary);
  setContext("regionSymbol", regionSymbol);
  setContext("regionChildren", regionChildren);
  let tree;
  if ($$props.selection === void 0 && $$bindings.selection && selection !== void 0) $$bindings.selection(selection);
  if ($$props.multiple === void 0 && $$bindings.multiple && multiple !== void 0) $$bindings.multiple(multiple);
  if ($$props.width === void 0 && $$bindings.width && width !== void 0) $$bindings.width(width);
  if ($$props.spacing === void 0 && $$bindings.spacing && spacing !== void 0) $$bindings.spacing(spacing);
  if ($$props.open === void 0 && $$bindings.open && open !== void 0) $$bindings.open(open);
  if ($$props.disabled === void 0 && $$bindings.disabled && disabled !== void 0) $$bindings.disabled(disabled);
  if ($$props.padding === void 0 && $$bindings.padding && padding !== void 0) $$bindings.padding(padding);
  if ($$props.indent === void 0 && $$bindings.indent && indent !== void 0) $$bindings.indent(indent);
  if ($$props.hover === void 0 && $$bindings.hover && hover !== void 0) $$bindings.hover(hover);
  if ($$props.rounded === void 0 && $$bindings.rounded && rounded !== void 0) $$bindings.rounded(rounded);
  if ($$props.caretOpen === void 0 && $$bindings.caretOpen && caretOpen !== void 0) $$bindings.caretOpen(caretOpen);
  if ($$props.caretClosed === void 0 && $$bindings.caretClosed && caretClosed !== void 0) $$bindings.caretClosed(caretClosed);
  if ($$props.hyphenOpacity === void 0 && $$bindings.hyphenOpacity && hyphenOpacity !== void 0) $$bindings.hyphenOpacity(hyphenOpacity);
  if ($$props.regionSummary === void 0 && $$bindings.regionSummary && regionSummary !== void 0) $$bindings.regionSummary(regionSummary);
  if ($$props.regionSymbol === void 0 && $$bindings.regionSymbol && regionSymbol !== void 0) $$bindings.regionSymbol(regionSymbol);
  if ($$props.regionChildren === void 0 && $$bindings.regionChildren && regionChildren !== void 0) $$bindings.regionChildren(regionChildren);
  if ($$props.labelledby === void 0 && $$bindings.labelledby && labelledby !== void 0) $$bindings.labelledby(labelledby);
  if ($$props.expandAll === void 0 && $$bindings.expandAll && expandAll !== void 0) $$bindings.expandAll(expandAll);
  if ($$props.collapseAll === void 0 && $$bindings.collapseAll && collapseAll !== void 0) $$bindings.collapseAll(collapseAll);
  classesBase = `${width} ${spacing} ${$$props.class ?? ""}`;
  return `<div class="${"tree " + escape(classesBase, true)}" data-testid="tree" role="tree"${add_attribute("aria-multiselectable", multiple, 0)}${add_attribute("aria-label", labelledby, 0)}${add_attribute("aria-disabled", disabled, 0)}${add_attribute("this", tree, 0)}>${slots.default ? slots.default({}) : ``}</div>`;
});
const cBase = "";
const cSummary = "list-none [&::-webkit-details-marker]:hidden flex items-center cursor-pointer";
const cSymbol = "fill-current w-3 text-center transition-transform duration-[200ms]";
const cChildren = "";
const cDisabled = "opacity-50 !cursor-not-allowed";
const TreeViewItem = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let classesCaretState;
  let classesDisabled;
  let classesBase;
  let classesSummary;
  let classesSymbol;
  let classesCaret;
  let classesHyphen;
  let classesChildren;
  let $$slots = compute_slots(slots);
  let { group = void 0 } = $$props;
  let { name = void 0 } = $$props;
  let { value = void 0 } = $$props;
  let { checked = false } = $$props;
  let { children = [] } = $$props;
  let { spacing = "space-x-4" } = $$props;
  let { open = getContext("open") } = $$props;
  let { selection = getContext("selection") } = $$props;
  let { multiple = getContext("multiple") } = $$props;
  let { disabled = getContext("disabled") } = $$props;
  let { indeterminate = false } = $$props;
  let { padding = getContext("padding") } = $$props;
  let { indent = getContext("indent") } = $$props;
  let { hover = getContext("hover") } = $$props;
  let { rounded = getContext("rounded") } = $$props;
  let { caretOpen = getContext("caretOpen") } = $$props;
  let { caretClosed = getContext("caretClosed") } = $$props;
  let { hyphenOpacity = getContext("hyphenOpacity") } = $$props;
  let { regionSummary = getContext("regionSummary") } = $$props;
  let { regionSymbol = getContext("regionSymbol") } = $$props;
  let { regionChildren = getContext("regionChildren") } = $$props;
  let { hideLead = false } = $$props;
  let { hideChildren = false } = $$props;
  let treeItem;
  let childrenDiv;
  function updateCheckbox(group2, indeterminate2) {
    if (!Array.isArray(group2)) return;
    checked = group2.indexOf(value) >= 0;
    dispatch("groupChange", { checked, indeterminate: indeterminate2 });
    dispatch("childChange");
  }
  function updateGroup(checked2, indeterminate2) {
    if (!Array.isArray(group)) return;
    const index = group.indexOf(value);
    if (checked2) {
      if (index < 0) {
        group.push(value);
        group = group;
      }
    } else {
      if (index >= 0) {
        group.splice(index, 1);
        group = group;
      }
    }
    if (!indeterminate2) {
      onParentChange();
    }
  }
  function updateRadio(group2) {
    checked = group2 === value;
    dispatch("groupChange", { checked, indeterminate: false });
    if (group2) dispatch("childChange");
  }
  function updateRadioGroup(checked2) {
    if (checked2 && group !== value) group = value;
    else if (!checked2 && group === value) group = "";
  }
  function onChildValueChange() {
    if (multiple) {
      if (!Array.isArray(group)) return;
      const childrenValues = children.map((c) => c.value);
      const childrenGroup = children[0].group;
      const index = group.indexOf(value);
      if (children.some((c) => c.indeterminate)) {
        indeterminate = true;
        if (index >= 0) {
          group.splice(index, 1);
          group = group;
        }
      } else if (childrenValues.every((c) => Array.isArray(childrenGroup) && childrenGroup.includes(c))) {
        indeterminate = false;
        if (index < 0) {
          group.push(value);
          group = group;
        }
      } else if (childrenValues.some((c) => Array.isArray(childrenGroup) && childrenGroup.includes(c))) {
        indeterminate = true;
        if (index >= 0) {
          group.splice(index, 1);
          group = group;
        }
      } else {
        indeterminate = false;
        if (index >= 0) {
          group.splice(index, 1);
          group = group;
        }
      }
    } else {
      if (group !== value && children.some((c) => c.checked)) {
        group = value;
      } else if (group === value && !children.some((c) => c.checked)) {
        group = "";
      }
    }
    dispatch("childChange");
  }
  function onParentChange() {
    if (!multiple || !children || children.length === 0) return;
    if (!Array.isArray(group)) return;
    const index = group.indexOf(value);
    const checkChild = (child) => {
      if (!child || !Array.isArray(child.group)) return;
      child.indeterminate = false;
      if (child.group.indexOf(child.value) < 0) {
        child.group.push(child.value);
        child.group = child.group;
      }
    };
    const uncheckChild = (child) => {
      if (!child || !Array.isArray(child.group)) return;
      child.indeterminate = false;
      const childIndex = child.group.indexOf(child.value);
      if (childIndex >= 0) {
        child.group.splice(childIndex, 1);
        child.group = child.group;
      }
    };
    children.forEach((child) => {
      if (!child) return;
      index >= 0 ? checkChild(child) : uncheckChild(child);
      child.onParentChange();
    });
  }
  const dispatch = createEventDispatcher();
  if ($$props.group === void 0 && $$bindings.group && group !== void 0) $$bindings.group(group);
  if ($$props.name === void 0 && $$bindings.name && name !== void 0) $$bindings.name(name);
  if ($$props.value === void 0 && $$bindings.value && value !== void 0) $$bindings.value(value);
  if ($$props.checked === void 0 && $$bindings.checked && checked !== void 0) $$bindings.checked(checked);
  if ($$props.children === void 0 && $$bindings.children && children !== void 0) $$bindings.children(children);
  if ($$props.spacing === void 0 && $$bindings.spacing && spacing !== void 0) $$bindings.spacing(spacing);
  if ($$props.open === void 0 && $$bindings.open && open !== void 0) $$bindings.open(open);
  if ($$props.selection === void 0 && $$bindings.selection && selection !== void 0) $$bindings.selection(selection);
  if ($$props.multiple === void 0 && $$bindings.multiple && multiple !== void 0) $$bindings.multiple(multiple);
  if ($$props.disabled === void 0 && $$bindings.disabled && disabled !== void 0) $$bindings.disabled(disabled);
  if ($$props.indeterminate === void 0 && $$bindings.indeterminate && indeterminate !== void 0) $$bindings.indeterminate(indeterminate);
  if ($$props.padding === void 0 && $$bindings.padding && padding !== void 0) $$bindings.padding(padding);
  if ($$props.indent === void 0 && $$bindings.indent && indent !== void 0) $$bindings.indent(indent);
  if ($$props.hover === void 0 && $$bindings.hover && hover !== void 0) $$bindings.hover(hover);
  if ($$props.rounded === void 0 && $$bindings.rounded && rounded !== void 0) $$bindings.rounded(rounded);
  if ($$props.caretOpen === void 0 && $$bindings.caretOpen && caretOpen !== void 0) $$bindings.caretOpen(caretOpen);
  if ($$props.caretClosed === void 0 && $$bindings.caretClosed && caretClosed !== void 0) $$bindings.caretClosed(caretClosed);
  if ($$props.hyphenOpacity === void 0 && $$bindings.hyphenOpacity && hyphenOpacity !== void 0) $$bindings.hyphenOpacity(hyphenOpacity);
  if ($$props.regionSummary === void 0 && $$bindings.regionSummary && regionSummary !== void 0) $$bindings.regionSummary(regionSummary);
  if ($$props.regionSymbol === void 0 && $$bindings.regionSymbol && regionSymbol !== void 0) $$bindings.regionSymbol(regionSymbol);
  if ($$props.regionChildren === void 0 && $$bindings.regionChildren && regionChildren !== void 0) $$bindings.regionChildren(regionChildren);
  if ($$props.hideLead === void 0 && $$bindings.hideLead && hideLead !== void 0) $$bindings.hideLead(hideLead);
  if ($$props.hideChildren === void 0 && $$bindings.hideChildren && hideChildren !== void 0) $$bindings.hideChildren(hideChildren);
  if ($$props.onParentChange === void 0 && $$bindings.onParentChange && onParentChange !== void 0) $$bindings.onParentChange(onParentChange);
  {
    if (multiple) updateCheckbox(group, indeterminate);
  }
  {
    if (multiple) updateGroup(checked, indeterminate);
  }
  {
    if (!multiple) updateRadio(group);
  }
  {
    if (!multiple) updateRadioGroup(checked);
  }
  {
    if (!multiple && group !== void 0) {
      if (group !== value) {
        children.forEach((child) => {
          if (child) child.group = "";
        });
      }
    }
  }
  {
    dispatch("toggle", { open });
  }
  {
    children.forEach((child) => {
      if (child) child.$on("childChange", onChildValueChange);
    });
  }
  classesCaretState = open && $$slots.children && !hideChildren ? caretOpen : caretClosed;
  classesDisabled = disabled ? cDisabled : "";
  classesBase = `${cBase} ${$$props.class ?? ""}`;
  classesSummary = `${cSummary} ${classesDisabled} ${spacing} ${rounded} ${padding} ${hover} ${regionSummary}`;
  classesCaret = `${classesCaretState}`;
  classesSymbol = `${cSymbol} ${classesCaret} ${regionSymbol}`;
  classesHyphen = `${hyphenOpacity}`;
  classesChildren = `${cChildren} ${indent} ${regionChildren}`;
  return `   <details class="${"tree-item " + escape(classesBase, true)}" data-testid="tree-item"${add_attribute("aria-disabled", disabled, 0)}${add_attribute("this", treeItem, 0)}${add_attribute("open", open, 1)}><summary class="${"tree-item-summary " + escape(classesSummary, true)}" role="treeitem"${add_attribute("aria-selected", selection ? checked : void 0, 0)}${add_attribute("aria-expanded", $$slots.children ? open : void 0, 0)}> <div class="${"tree-summary-symbol " + escape(classesSymbol, true)}">${$$slots.children && !hideChildren ? ` <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M201.4 374.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 306.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z"></path></svg>` : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="${"w-3 " + escape(classesHyphen, true)}"><path d="M432 256c0 17.7-14.3 32-32 32L48 288c-17.7 0-32-14.3-32-32s14.3-32 32-32l352 0c17.7 0 32 14.3 32 32z"></path></svg>`}</div>  ${selection && name && group !== void 0 ? `${multiple ? `<input class="checkbox tree-item-checkbox" type="checkbox"${add_attribute("name", name, 0)}${add_attribute("value", value, 0)}${add_attribute("checked", checked, 1)}${add_attribute("indeterminate", indeterminate, 0)}>` : `<input class="radio tree-item-radio" type="radio"${add_attribute("name", name, 0)}${add_attribute("value", value, 0)}${value === group ? add_attribute("checked", true, 1) : ""}>`}` : ``}  ${$$slots.lead && !hideLead ? `<div class="tree-item-lead">${slots.lead ? slots.lead({}) : ``}</div>` : ``}  <div class="tree-item-content">${slots.default ? slots.default({}) : ``}</div></summary> <div class="${"tree-item-children " + escape(classesChildren, true)}" role="group"${add_attribute("this", childrenDiv, 0)}>${slots.children ? slots.children({}) : ``}</div></details>`;
});
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
  "0/1,1/1": "Heterozygous or Homozygous",
  "0/0": "Excluded"
};
const selectedSNPs = writable([]);
function clearSnpFilters() {
  selectedSNPs.set([]);
}
const css$1 = {
  code: ".scrollbar-color.svelte-c314iq{scrollbar-color:rgba(var(--color-surface-300)) rgb(var(--color-surface-100))}.h-25vh.svelte-c314iq{height:25vh}",
  map: '{"version":3,"file":"OptionsSelectionList.svelte","sources":["OptionsSelectionList.svelte"],"sourcesContent":["<script lang=\\"ts\\">import { createEventDispatcher } from \\"svelte\\";\\nimport { ProgressRadial } from \\"@skeletonlabs/skeleton\\";\\nlet searchInput = \\"\\";\\nexport let unselectedOptions = [];\\nexport let selectedOptions = [];\\nexport let selectedOptionEndLocation = 20;\\nexport let currentlyLoading = false;\\nexport let showClearAll = true;\\nexport let showSelectAll = true;\\nexport let allOptionsLoaded = false;\\nexport let allOptions = void 0;\\nlet currentlyLoadingSelected = false;\\nlet unselectedOptionsContainer;\\nlet selectedOptionsContainer;\\nlet allSelectedOptionsLoaded = false;\\nconst dispatch = createEventDispatcher();\\n$: infiniteScroll = allOptions === void 0;\\n$: totalAvailableOptions = infiniteScroll ? Infinity : (allOptions?.length || 0) - selectedOptions.length;\\n$: allUnselectedOptionsLoaded = infiniteScroll ? allOptionsLoaded : unselectedOptions.length >= totalAvailableOptions;\\n$: allSelectedOptionsLoaded = infiniteScroll ? allSelectedOptionsLoaded : displayedSelectedOptions.length >= selectedOptions.length;\\n$: displayedSelectedOptions = selectedOptions.slice(0, selectedOptionEndLocation);\\nfunction shouldLoadMore(element, allLoaded) {\\n  const scrollTop = element.scrollTop;\\n  const containerHeight = element.clientHeight;\\n  const contentHeight = element.scrollHeight;\\n  const scrollBuffer = 30;\\n  return !allLoaded && contentHeight - (scrollTop + containerHeight) <= scrollBuffer;\\n}\\nfunction handleScroll() {\\n  if (!unselectedOptionsContainer)\\n    return;\\n  if (!currentlyLoading && shouldLoadMore(unselectedOptionsContainer, allUnselectedOptionsLoaded)) {\\n    dispatch(\\"scroll\\", { search: searchInput });\\n  }\\n}\\nfunction loadMoreSelectedOptions() {\\n  if (!selectedOptionsContainer)\\n    return;\\n  currentlyLoadingSelected = true;\\n  if (shouldLoadMore(selectedOptionsContainer, allSelectedOptionsLoaded)) {\\n    selectedOptionEndLocation = selectedOptionEndLocation + 20;\\n  }\\n  currentlyLoadingSelected = false;\\n}\\nfunction onSearch() {\\n  dispatch(\\"scroll\\", { search: searchInput });\\n  unselectedOptionsContainer.scrollTop = 0;\\n}\\nfunction onSelect(option) {\\n  unselectedOptions = unselectedOptions.filter((o) => o !== option);\\n  selectedOptions = [...selectedOptions, option].sort();\\n}\\nfunction onUnselect(option) {\\n  selectedOptions = selectedOptions.filter((o) => o !== option);\\n  unselectedOptions = [option, ...unselectedOptions];\\n}\\nfunction clearSelectedOptions() {\\n  unselectedOptions = [...unselectedOptions, ...selectedOptions].sort();\\n  selectedOptions = [];\\n  selectedOptionEndLocation = 20;\\n}\\nfunction selectAllOptions() {\\n  if (allOptions && allOptions?.length !== 0) {\\n    selectedOptions = allOptions;\\n    unselectedOptions = [];\\n    selectedOptionEndLocation = 20;\\n  } else {\\n    selectedOptions = [...selectedOptions, ...unselectedOptions];\\n    unselectedOptions = [];\\n    selectedOptionEndLocation = 20;\\n  }\\n}\\nfunction getID(option) {\\n  return option.replaceAll(\\" \\", \\"-\\").toLowerCase();\\n}\\n<\/script>\\n\\n<div data-testid=\\"optional-selection-list\\" class=\\"flex w-full\\">\\n  <div class=\\"flex flex-1 flex-col h-full p-3 m-1 card\\">\\n    <header class=\\"flex pb-1\\">\\n      <input\\n        class=\\"input text-sm\\"\\n        type=\\"search\\"\\n        name=\\"search\\"\\n        bind:value={searchInput}\\n        on:input={onSearch}\\n        placeholder=\\"Search...\\"\\n      />\\n      {#if showSelectAll}\\n        <button\\n          id=\\"select-all\\"\\n          class=\\"btn variant-ringed-surface hover:variant-filled-primary ml-2 text-sm\\"\\n          disabled={unselectedOptions.length === 0}\\n          on:click={selectAllOptions}>Select All</button\\n        >\\n      {/if}\\n    </header>\\n    <section class=\\"card-body\\">\\n      <div\\n        id=\\"options-container\\"\\n        bind:this={unselectedOptionsContainer}\\n        class=\\"overflow-scroll scrollbar-color h-25vh\\"\\n        on:scroll={handleScroll}\\n      >\\n        {#each unselectedOptions as option}\\n          <label\\n            id=\\"option-{getID(option)}\\"\\n            class=\\"p-1 m-1 cursor-pointer hover:variant-soft-surface hover:rounded-md\\"\\n            role=\\"listitem\\"\\n          >\\n            <input\\n              type=\\"checkbox\\"\\n              value={option}\\n              class=\\"mr-1 float-left\\"\\n              on:click|preventDefault={() => onSelect(option)}\\n            />\\n            {option}\\n          </label>\\n        {/each}\\n        {#if currentlyLoading}\\n          <div class=\\"flex justify-center\\">\\n            <ProgressRadial width=\\"w-5\\" meter=\\"stroke-primary-500\\" track=\\"stroke-primary-500/30\\" />\\n          </div>\\n        {/if}\\n      </div>\\n    </section>\\n  </div>\\n  <div class=\\"flex flex-1 flex-col h-full p-3 m-1 card\\">\\n    <header class=\\"flex justify-between pb-1\\">\\n      <div class=\\"py-2\\">Selected:</div>\\n      {#if showClearAll}\\n        <button\\n          id=\\"clear\\"\\n          class=\\"btn variant-ringed-surface hover:variant-filled-primary ml-2 text-sm\\"\\n          on:click={clearSelectedOptions}\\n          disabled={selectedOptions.length === 0}>Clear</button\\n        >\\n      {/if}\\n    </header>\\n    <section class=\\"card-body\\">\\n      <div\\n        id=\\"selected-options-container\\"\\n        bind:this={selectedOptionsContainer}\\n        class=\\"overflow-scroll scrollbar-color h-25vh\\"\\n        on:scroll={loadMoreSelectedOptions}\\n      >\\n        {#each displayedSelectedOptions as option (option)}\\n          <label\\n            id=\\"option-{getID(option)}\\"\\n            class=\\"p-1 m-1 hover:variant-soft-surface hover:rounded-md cursor-pointer\\"\\n            role=\\"listitem\\"\\n          >\\n            <input\\n              type=\\"checkbox\\"\\n              class=\\"mr-1\\"\\n              value={option}\\n              on:click|preventDefault={() => onUnselect(option)}\\n              checked\\n            />\\n            {option}\\n          </label>\\n        {/each}\\n        {#if currentlyLoadingSelected}\\n          <div class=\\"flex justify-center\\">\\n            <ProgressRadial width=\\"w-5\\" meter=\\"stroke-primary-500\\" track=\\"stroke-primary-500/30\\" />\\n          </div>\\n        {/if}\\n      </div>\\n    </section>\\n  </div>\\n</div>\\n\\n<style>\\n  .scrollbar-color {\\n    scrollbar-color: rgba(var(--color-surface-300)) rgb(var(--color-surface-100));\\n  }\\n  .h-25vh {\\n    height: 25vh;\\n  }</style>\\n"],"names":[],"mappings":"AA6KE,8BAAiB,CACf,eAAe,CAAE,KAAK,IAAI,mBAAmB,CAAC,CAAC,CAAC,IAAI,IAAI,mBAAmB,CAAC,CAC9E,CACA,qBAAQ,CACN,MAAM,CAAE,IACV"}'
};
function getID(option) {
  return option.replaceAll(" ", "-").toLowerCase();
}
const OptionsSelectionList = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let infiniteScroll;
  let totalAvailableOptions;
  let displayedSelectedOptions;
  let searchInput = "";
  let { unselectedOptions = [] } = $$props;
  let { selectedOptions = [] } = $$props;
  let { selectedOptionEndLocation = 20 } = $$props;
  let { currentlyLoading = false } = $$props;
  let { showClearAll = true } = $$props;
  let { showSelectAll = true } = $$props;
  let { allOptionsLoaded = false } = $$props;
  let { allOptions = void 0 } = $$props;
  let unselectedOptionsContainer;
  let selectedOptionsContainer;
  let allSelectedOptionsLoaded = false;
  createEventDispatcher();
  if ($$props.unselectedOptions === void 0 && $$bindings.unselectedOptions && unselectedOptions !== void 0) $$bindings.unselectedOptions(unselectedOptions);
  if ($$props.selectedOptions === void 0 && $$bindings.selectedOptions && selectedOptions !== void 0) $$bindings.selectedOptions(selectedOptions);
  if ($$props.selectedOptionEndLocation === void 0 && $$bindings.selectedOptionEndLocation && selectedOptionEndLocation !== void 0) $$bindings.selectedOptionEndLocation(selectedOptionEndLocation);
  if ($$props.currentlyLoading === void 0 && $$bindings.currentlyLoading && currentlyLoading !== void 0) $$bindings.currentlyLoading(currentlyLoading);
  if ($$props.showClearAll === void 0 && $$bindings.showClearAll && showClearAll !== void 0) $$bindings.showClearAll(showClearAll);
  if ($$props.showSelectAll === void 0 && $$bindings.showSelectAll && showSelectAll !== void 0) $$bindings.showSelectAll(showSelectAll);
  if ($$props.allOptionsLoaded === void 0 && $$bindings.allOptionsLoaded && allOptionsLoaded !== void 0) $$bindings.allOptionsLoaded(allOptionsLoaded);
  if ($$props.allOptions === void 0 && $$bindings.allOptions && allOptions !== void 0) $$bindings.allOptions(allOptions);
  $$result.css.add(css$1);
  infiniteScroll = allOptions === void 0;
  totalAvailableOptions = infiniteScroll ? Infinity : (allOptions?.length || 0) - selectedOptions.length;
  infiniteScroll ? allOptionsLoaded : unselectedOptions.length >= totalAvailableOptions;
  displayedSelectedOptions = selectedOptions.slice(0, selectedOptionEndLocation);
  allSelectedOptionsLoaded = infiniteScroll ? allSelectedOptionsLoaded : displayedSelectedOptions.length >= selectedOptions.length;
  return `<div data-testid="optional-selection-list" class="flex w-full"><div class="flex flex-1 flex-col h-full p-3 m-1 card"><header class="flex pb-1"><input class="input text-sm" type="search" name="search" placeholder="Search..."${add_attribute("value", searchInput, 0)}> ${showSelectAll ? `<button id="select-all" class="btn variant-ringed-surface hover:variant-filled-primary ml-2 text-sm" ${unselectedOptions.length === 0 ? "disabled" : ""}>Select All</button>` : ``}</header> <section class="card-body"><div id="options-container" class="overflow-scroll scrollbar-color h-25vh svelte-c314iq"${add_attribute("this", unselectedOptionsContainer, 0)}>${each(unselectedOptions, (option) => {
    return `<label id="${"option-" + escape(getID(option), true)}" class="p-1 m-1 cursor-pointer hover:variant-soft-surface hover:rounded-md" role="listitem"><input type="checkbox"${add_attribute("value", option, 0)} class="mr-1 float-left"> ${escape(option)} </label>`;
  })} ${currentlyLoading ? `<div class="flex justify-center">${validate_component(ProgressRadial, "ProgressRadial").$$render(
    $$result,
    {
      width: "w-5",
      meter: "stroke-primary-500",
      track: "stroke-primary-500/30"
    },
    {},
    {}
  )}</div>` : ``}</div></section></div> <div class="flex flex-1 flex-col h-full p-3 m-1 card"><header class="flex justify-between pb-1"><div class="py-2" data-svelte-h="svelte-1eal34y">Selected:</div> ${showClearAll ? `<button id="clear" class="btn variant-ringed-surface hover:variant-filled-primary ml-2 text-sm" ${selectedOptions.length === 0 ? "disabled" : ""}>Clear</button>` : ``}</header> <section class="card-body"><div id="selected-options-container" class="overflow-scroll scrollbar-color h-25vh svelte-c314iq"${add_attribute("this", selectedOptionsContainer, 0)}>${each(displayedSelectedOptions, (option) => {
    return `<label id="${"option-" + escape(getID(option), true)}" class="p-1 m-1 hover:variant-soft-surface hover:rounded-md cursor-pointer" role="listitem"><input type="checkbox" class="mr-1"${add_attribute("value", option, 0)} checked> ${escape(option)} </label>`;
  })} ${``}</div></section></div> </div>`;
});
const FilterType = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { active = Option.None } = $$props;
  createEventDispatcher();
  if ($$props.active === void 0 && $$bindings.active && active !== void 0) $$bindings.active(active);
  return `<div class="${"flex flex-row justify-center justify-items-center gap-16 " + escape($$props.class ?? "", true)}">${`${validate_component(CardButton, "CardButton").$$render(
    $$result,
    {
      "data-testid": "gene-variant-option",
      title: "Variants by gene name",
      subtitle: "Ex: Rare BRCA1 variants with high severity",
      size: "other",
      class: "w-1/4 h-20 min-h-20 variant-ringed-primary",
      active: active === Option.Genomic
    },
    {},
    {}
  )}`} ${`${validate_component(CardButton, "CardButton").$$render(
    $$result,
    {
      "data-testid": "snp-option",
      title: "Specific SNPs",
      subtitle: "Ex: chr17,35269878,G,A",
      size: "other",
      class: "w-1/4 h-20 min-h-20 variant-ringed-primary",
      active: active === Option.SNP
    },
    {},
    {}
  )}`} ${``}</div>`;
});
const Panel = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$slots = compute_slots(slots);
  let { title = "" } = $$props;
  let { subtitle = "" } = $$props;
  let { required = false } = $$props;
  if ($$props.title === void 0 && $$bindings.title && title !== void 0) $$bindings.title(title);
  if ($$props.subtitle === void 0 && $$bindings.subtitle && subtitle !== void 0) $$bindings.subtitle(subtitle);
  if ($$props.required === void 0 && $$bindings.required && required !== void 0) $$bindings.required(required);
  return `<div class="${"flex flex-col " + escape($$props.class ?? "", true)}"${add_attribute("data-testid", $$props["data-testid"] || title.replaceAll(" ", "-").toLowerCase(), 0)}><div class="relative rounded-t-2xl bg-primary-300-600-token p-4 items-center flex">${required ? `<span class="absolute top-0 left-1 p-1 text-error-500-400-token text-xs" data-svelte-h="svelte-2u3ew">* Required</span>` : ``} <div class="flex-auto text-center"><div class="font-bold">${escape(title)}</div> ${subtitle ? `<div>${escape(subtitle)}</div>` : ``}</div> ${$$slots.action ? `<span class="flex-none ml-1">${slots.action ? slots.action({}) : ``}</span>` : ``} ${$$slots.help ? `<span class="flex-none ml-1">${slots.help ? slots.help({}) : ``}</span>` : ``}</div> <div class="h-full p-2 border rounded-b-2xl border-surface-300-600-token">${slots.default ? slots.default({}) : ``}</div></div>`;
});
const Search = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { search = "" } = $$props;
  createEventDispatcher();
  let searchElement;
  let warn = false;
  let searching = false;
  function removeInvalid() {
    searchElement.classList.remove("required");
    searchElement.setCustomValidity("");
    warn = false;
  }
  if ($$props.search === void 0 && $$bindings.search && search !== void 0) $$bindings.search(search);
  search && removeInvalid();
  return `<p class="text-center" data-svelte-h="svelte-19jq20d">Enter the following information into the search bar: chromosome, position, reference allele,
  variant allele.</p> <p class="text-center font-bold my-6" data-svelte-h="svelte-vyzn1w"><em class="font-bold">Example:</em> chr17,35269878,G,A</p> <div class="flex gap-2 mx-auto my-8 w-1/2"><input type="search" class="input" placeholder="chromosome (chr#), position, reference allele, variant allele" data-testid="snp-search-box" ${$$props.disabled ? "disabled" : ""}${add_attribute("this", searchElement, 0)}${add_attribute("value", search, 0)}> <button type="button" data-testid="snp-search-btn" class="btn btn-sm variant-filled-primary text-lg disabled:opacity-75" ${$$props.disabled || !search || searching ? "disabled" : ""}>Search
    ${``}</button></div> ${warn ? `<aside class="alert variant-ghost-error" data-svelte-h="svelte-ml29wj"><div class="alert-message"><p>We couldn&#39;t find any results for your search term. Please check to ensure the information
        you have entered is correct or try a different search.</p></div></aside>` : ``}`;
});
const Summary$1 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $selectedSNPs, $$unsubscribe_selectedSNPs;
  $$unsubscribe_selectedSNPs = subscribe(selectedSNPs, (value) => $selectedSNPs = value);
  createEventDispatcher();
  $$unsubscribe_selectedSNPs();
  return `<div class="flex items-center justify-center">${$selectedSNPs.length === 0 ? `<p data-svelte-h="svelte-1lbie5c">No filters added.</p>` : ``} ${each($selectedSNPs, (snp, index) => {
    return `${index !== 0 ? `<div class="font-bold flex items-center justify-center p-6" data-svelte-h="svelte-12rqbx7">AND</div>` : ``} <div class="border rounded border-surface-300-600-token p-3 flex gap-4"><div class="flex-auto"><div class="text-surface-600-300-token font-bold">${escape(snp.search)}:</div> <div class="text-surface-500-400-token">${escape(GenotypeMap[snp.constraint])}</div></div> <div class="flex-none text-right"><button type="button"${add_attribute("data-testid", `snp-edit-btn-${snp.search}`, 0)} title="Edit" aria-label="Edit" class="btn-icon-color"><i class="fa-solid fa-pen-to-square"></i></button> <button type="button"${add_attribute("data-testid", `snp-delete-btn-${snp.search}`, 0)} title="Delete" aria-label="Delete" class="btn-icon-color"><i class="fa-solid fa-trash"></i> </button></div> </div>`;
  })}</div>`;
});
const SNPSearch = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $selectedSNPs, $$unsubscribe_selectedSNPs;
  $$unsubscribe_selectedSNPs = subscribe(selectedSNPs, (value) => $selectedSNPs = value);
  let snp = { search: "", constraint: "" };
  $$unsubscribe_selectedSNPs();
  return `<div id="snp-search" class="${"grid grid-col-1 gap-3 " + escape($$props.class || "", true)}">${validate_component(Panel, "Panel").$$render(
    $$result,
    {
      title: "Search for Genomic Variants using rsIDs"
    },
    {},
    {
      default: () => {
        return `${validate_component(Search, "Search").$$render($$result, { disabled: snp.search, search: snp.search }, {}, {})} ${``}`;
      }
    }
  )} ${validate_component(Panel, "Panel").$$render($$result, { title: "Summary of Selected Filters" }, {}, {
    action: () => {
      return `<button class="btn btn-xs variant-ringed-surface hover:variant-ghost-primary" ${$selectedSNPs.length === 0 ? "disabled" : ""}>Clear</button> `;
    },
    default: () => {
      return `${validate_component(Summary$1, "Summary").$$render($$result, {}, {}, {})}`;
    }
  })}</div>`;
});
const HelpInfoPopup = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { text = "" } = $$props;
  let { id = "" } = $$props;
  if ($$props.text === void 0 && $$bindings.text && text !== void 0) $$bindings.text(text);
  if ($$props.id === void 0 && $$bindings.id && id !== void 0) $$bindings.id(id);
  return `${text ? `<div${add_attribute("data-testid", id, 0)}><i class="fa-solid fa-circle-question text-primary-700-200-token hover:text-secondary-700-200-token cursor-pointer"></i> <div data-testid="${escape(id, true) + "-content"}" class="rounded p-4 max-w-md shadow-2xl variant-filled-surface text-on-primary"${add_attribute("data-popup", id, 0)}>${escape(text)} <div class="arrow variant-filled-surface"></div></div></div>` : ``}`;
});
const Genes = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let unselectedGenes;
  let $selectedGenes, $$unsubscribe_selectedGenes;
  $$unsubscribe_selectedGenes = subscribe(selectedGenes, (value) => $selectedGenes = value);
  getToastStore();
  let allGenes = [];
  let loading = false;
  let allOptionsLoaded = false;
  let $$settled;
  let $$rendered;
  let previous_head = $$result.head;
  do {
    $$settled = true;
    $$result.head = previous_head;
    unselectedGenes = $selectedGenes.length === 0 ? allGenes : allGenes.filter((gene) => !$selectedGenes.includes(gene));
    $$rendered = `<div class="flex gap-4 mb-2">${validate_component(OptionsSelectionList, "OptionsSelectionList").$$render(
      $$result,
      {
        showSelectAll: false,
        showClearAll: false,
        allOptionsLoaded,
        unselectedOptions: unselectedGenes,
        selectedOptions: $selectedGenes,
        currentlyLoading: loading
      },
      {
        unselectedOptions: ($$value) => {
          unselectedGenes = $$value;
          $$settled = false;
        },
        selectedOptions: ($$value) => {
          $selectedGenes = $$value;
          $$settled = false;
        },
        currentlyLoading: ($$value) => {
          loading = $$value;
          $$settled = false;
        }
      },
      {}
    )}</div>`;
  } while (!$$settled);
  $$unsubscribe_selectedGenes();
  return $$rendered;
});
const Frequency = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $selectedFrequency, $$unsubscribe_selectedFrequency;
  $$unsubscribe_selectedFrequency = subscribe(selectedFrequency, (value) => $selectedFrequency = value);
  $$unsubscribe_selectedFrequency();
  return `<label class="cursor-pointer hover:variant-soft-surface hover:rounded-md"><input id="Rare" type="checkbox" value="Rare"${~$selectedFrequency.indexOf("Rare") ? add_attribute("checked", true, 1) : ""}>
  Rare</label> <label class="cursor-pointer hover:variant-soft-surface hover:rounded-md"><input id="Common" type="checkbox" value="Common"${~$selectedFrequency.indexOf("Common") ? add_attribute("checked", true, 1) : ""}>
  Common</label> <label class="cursor-pointer hover:variant-soft-surface hover:rounded-md"><input id="Novel" type="checkbox" value="Novel"${~$selectedFrequency.indexOf("Novel") ? add_attribute("checked", true, 1) : ""}>
  Novel</label>`;
});
const Consequence = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $selectedConsequence, $$unsubscribe_selectedConsequence;
  $$unsubscribe_selectedConsequence = subscribe(selectedConsequence, (value) => $selectedConsequence = value);
  let severityChildren = variantData.map(() => []);
  const intersection = (A, B) => A.some((a) => B.includes(a));
  let $$settled;
  let $$rendered;
  let previous_head = $$result.head;
  do {
    $$settled = true;
    $$result.head = previous_head;
    $$rendered = `<div class="overflow-auto h-[350.75px]">${validate_component(TreeView, "TreeView").$$render(
      $$result,
      {
        selection: true,
        multiple: true,
        open: true,
        padding: "py-0 px-0",
        spacing: "space-y-0"
      },
      {},
      {
        default: () => {
          return `${each(variantData, (severity, sIndex) => {
            return `${validate_component(TreeViewItem, "TreeViewItem").$$render(
              $$result,
              {
                name: "severity",
                value: severity.key,
                children: severityChildren[sIndex],
                open: intersection($selectedConsequence, severity.children),
                group: $selectedConsequence
              },
              {
                group: ($$value) => {
                  $selectedConsequence = $$value;
                  $$settled = false;
                }
              },
              {
                children: () => {
                  return `${each(severity.children, (child, cIndex) => {
                    return `${validate_component(TreeViewItem, "TreeViewItem").$$render(
                      $$result,
                      {
                        name: severity.key,
                        value: child,
                        this: severityChildren[sIndex][cIndex],
                        group: $selectedConsequence
                      },
                      {
                        this: ($$value) => {
                          severityChildren[sIndex][cIndex] = $$value;
                          $$settled = false;
                        },
                        group: ($$value) => {
                          $selectedConsequence = $$value;
                          $$settled = false;
                        }
                      },
                      {
                        default: () => {
                          return `<p>${escape(child)}</p> `;
                        }
                      }
                    )}`;
                  })} `;
                },
                default: () => {
                  return `<p>${escape(severity.key)}</p> `;
                }
              }
            )}`;
          })}`;
        }
      }
    )}</div>`;
  } while (!$$settled);
  $$unsubscribe_selectedConsequence();
  return $$rendered;
});
const css = {
  code: ".w-1\\/15.svelte-cbe8k1{width:6.666%}.w-3\\/15.svelte-cbe8k1{width:28.888%}",
  map: '{"version":3,"file":"Summary.svelte","sources":["Summary.svelte"],"sourcesContent":["<script lang=\\"ts\\">import { selectedGenes, selectedFrequency, consequences } from \\"$lib/stores/GeneFilter\\";\\n<\/script>\\n\\n<div class=\\"overflow-auto flex\\">\\n  <div\\n    class=\\"border rounded border-surface-400-500-token flex flex-col items-center justify-center w-3/15 p-2\\"\\n  >\\n    <span class=\\"font-bold\\">Geneomic Region: </span>\\n    <div id=\\"selected-variant\\" class=\\"text-center break-words\\">\\n      {#each $selectedGenes as gene, index}\\n        {#if index !== 0}\\n          <span class=\\"font-bold mx-1 text-primary-400-500-token\\">OR</span>\\n        {/if}\\n        {gene}\\n      {/each}\\n      {#if $selectedGenes.length === 0}\\n        <span class=\\"italic\\">None</span>\\n      {/if}\\n    </div>\\n  </div>\\n  <div class=\\"font-bold flex items-center justify-center w-1/15\\">AND</div>\\n  <div\\n    class=\\"border rounded border-surface-400-500-token flex flex-col items-center justify-center w-3/15 p-2\\"\\n  >\\n    <span class=\\"font-bold\\">Calculated Consequence:</span>\\n    <div id=\\"selected-consequence\\" class=\\"text-center break-words\\">\\n      {#each $consequences as cons, index}\\n        {#if index !== 0}\\n          <span class=\\"font-bold mx-1 text-primary-400-500-token\\">OR</span>\\n        {/if}\\n        {cons}\\n      {/each}\\n      {#if $consequences.length === 0}\\n        <span class=\\"italic\\">None</span>\\n      {/if}\\n    </div>\\n  </div>\\n  <div class=\\"font-bold flex items-center justify-center w-1/15\\">AND</div>\\n  <div\\n    class=\\"border rounded border-surface-400-500-token flex flex-col items-center justify-center w-3/15 p-2\\"\\n  >\\n    <span class=\\"font-bold\\">Variant Frequency: </span>\\n    <div id=\\"selected-frequency\\" class=\\"text-center break-words\\">\\n      {#each $selectedFrequency as freq, index}\\n        {#if index !== 0}\\n          <span class=\\"font-bold mx-1 text-primary-400-500-token\\">OR</span>\\n        {/if}\\n        {freq}\\n      {/each}\\n      {#if $selectedFrequency.length === 0}\\n        <span class=\\"italic\\">None</span>\\n      {/if}\\n    </div>\\n  </div>\\n</div>\\n\\n<style>\\n  .w-1\\\\/15 {\\n    width: 6.666%;\\n  }\\n  .w-3\\\\/15 {\\n    width: 28.888%;\\n  }</style>\\n"],"names":[],"mappings":"AAyDE,sBAAS,CACP,KAAK,CAAE,MACT,CACA,sBAAS,CACP,KAAK,CAAE,OACT"}'
};
const Summary = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $selectedGenes, $$unsubscribe_selectedGenes;
  let $consequences, $$unsubscribe_consequences;
  let $selectedFrequency, $$unsubscribe_selectedFrequency;
  $$unsubscribe_selectedGenes = subscribe(selectedGenes, (value) => $selectedGenes = value);
  $$unsubscribe_consequences = subscribe(consequences, (value) => $consequences = value);
  $$unsubscribe_selectedFrequency = subscribe(selectedFrequency, (value) => $selectedFrequency = value);
  $$result.css.add(css);
  $$unsubscribe_selectedGenes();
  $$unsubscribe_consequences();
  $$unsubscribe_selectedFrequency();
  return `<div class="overflow-auto flex"><div class="border rounded border-surface-400-500-token flex flex-col items-center justify-center w-3/15 p-2 svelte-cbe8k1"><span class="font-bold" data-svelte-h="svelte-ngs1xp">Geneomic Region:</span> <div id="selected-variant" class="text-center break-words">${each($selectedGenes, (gene, index) => {
    return `${index !== 0 ? `<span class="font-bold mx-1 text-primary-400-500-token" data-svelte-h="svelte-1k5kk2t">OR</span>` : ``} ${escape(gene)}`;
  })} ${$selectedGenes.length === 0 ? `<span class="italic" data-svelte-h="svelte-6sqynn">None</span>` : ``}</div></div> <div class="font-bold flex items-center justify-center w-1/15 svelte-cbe8k1" data-svelte-h="svelte-190meq">AND</div> <div class="border rounded border-surface-400-500-token flex flex-col items-center justify-center w-3/15 p-2 svelte-cbe8k1"><span class="font-bold" data-svelte-h="svelte-hsq10h">Calculated Consequence:</span> <div id="selected-consequence" class="text-center break-words">${each($consequences, (cons, index) => {
    return `${index !== 0 ? `<span class="font-bold mx-1 text-primary-400-500-token" data-svelte-h="svelte-1k5kk2t">OR</span>` : ``} ${escape(cons)}`;
  })} ${$consequences.length === 0 ? `<span class="italic" data-svelte-h="svelte-6sqynn">None</span>` : ``}</div></div> <div class="font-bold flex items-center justify-center w-1/15 svelte-cbe8k1" data-svelte-h="svelte-190meq">AND</div> <div class="border rounded border-surface-400-500-token flex flex-col items-center justify-center w-3/15 p-2 svelte-cbe8k1"><span class="font-bold" data-svelte-h="svelte-la4jtx">Variant Frequency:</span> <div id="selected-frequency" class="text-center break-words">${each($selectedFrequency, (freq, index) => {
    return `${index !== 0 ? `<span class="font-bold mx-1 text-primary-400-500-token" data-svelte-h="svelte-1k5kk2t">OR</span>` : ``} ${escape(freq)}`;
  })} ${$selectedFrequency.length === 0 ? `<span class="italic" data-svelte-h="svelte-6sqynn">None</span>` : ``}</div></div> </div>`;
});
const GeneSearch = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const helpText = branding?.help?.popups?.genomicFilter;
  return `<div id="gene-search" class="${"grid grid-col-3 gap-3 " + escape($$props.class || "", true)}">${validate_component(Panel, "Panel").$$render(
    $$result,
    {
      title: "Search for Gene with Variant",
      subtitle: "Use the official gene symbol.",
      required: true
    },
    {},
    {
      action: () => {
        return `<button data-testid="clear-selected-genes-btn" class="btn btn-xs variant-ringed-surface hover:variant-ghost-primary" data-svelte-h="svelte-kh8y4l">Clear</button> `;
      },
      default: () => {
        return `${validate_component(Genes, "Genes").$$render($$result, {}, {}, {})}`;
      }
    }
  )} ${validate_component(Panel, "Panel").$$render(
    $$result,
    {
      title: "Select Calculated Consequence",
      subtitle: "The calculated consequence is based on VEP annotation."
    },
    {},
    {
      help: () => {
        return `${validate_component(HelpInfoPopup, "HelpInfoPopup").$$render(
          $$result,
          {
            id: "cons-help-popup",
            text: helpText.consequence
          },
          {},
          {}
        )} `;
      },
      default: () => {
        return `${validate_component(Consequence, "Consequence").$$render($$result, {}, {}, {})}`;
      }
    }
  )} ${validate_component(Panel, "Panel").$$render($$result, { title: "Select Variant Frequency" }, {}, {
    help: () => {
      return `${validate_component(HelpInfoPopup, "HelpInfoPopup").$$render(
        $$result,
        {
          id: "freq-help-popup",
          text: helpText.frequency
        },
        {},
        {}
      )} `;
    },
    default: () => {
      return `${validate_component(Frequency, "Frequency").$$render($$result, {}, {}, {})}`;
    }
  })} ${validate_component(Panel, "Panel").$$render(
    $$result,
    {
      title: "Summary of Selected Filters",
      class: "col-span-3"
    },
    {},
    {
      action: () => {
        return `<button data-testid="clear-gene-filters-btn" class="btn btn-xs variant-ringed-surface hover:variant-ghost-primary" data-svelte-h="svelte-175o5c1">Clear</button> `;
      },
      default: () => {
        return `${validate_component(Summary, "Summary").$$render($$result, {}, {}, {})}`;
      }
    }
  )}</div>`;
});
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let canComplete;
  let $selectedSNPs, $$unsubscribe_selectedSNPs;
  let $selectedGenes, $$unsubscribe_selectedGenes;
  let $page, $$unsubscribe_page;
  $$unsubscribe_selectedSNPs = subscribe(selectedSNPs, (value) => $selectedSNPs = value);
  $$unsubscribe_selectedGenes = subscribe(selectedGenes, (value) => $selectedGenes = value);
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  let edit = $page.url.searchParams.get("edit") || "";
  let selectedOption = (() => {
    return ["snp", "genomic"].includes(edit) ? edit : Option.None;
  })();
  function clearFilters() {
    clearGeneFilters();
    clearSnpFilters();
  }
  canComplete = selectedOption === Option.Genomic && $selectedGenes.length > 0 || selectedOption === Option.SNP && $selectedSNPs.length > 0;
  $$unsubscribe_selectedSNPs();
  $$unsubscribe_selectedGenes();
  $$unsubscribe_page();
  return `${$$result.head += `<!-- HEAD_svelte-xe0801_START -->${$$result.title = `<title>${escape(branding.applicationName)} | Gemonic Filter</title>`, ""}<!-- HEAD_svelte-xe0801_END -->`, ""} ${validate_component(Content, "Content").$$render(
    $$result,
    {
      full: true,
      title: "Genomic Filtering",
      backUrl: "/explorer",
      backAction: clearFilters,
      backTitle: "Back to Explore",
      transition: true
    },
    {},
    {
      default: () => {
        return `${`${validate_component(FilterType, "FilterType").$$render($$result, { class: "my-4", active: selectedOption }, {}, {})}`} ${selectedOption !== Option.None ? `${selectedOption === Option.Genomic ? `${validate_component(GeneSearch, "GeneSearch").$$render($$result, { class: "mb-0 mt-6" }, {}, {})}` : `${validate_component(SNPSearch, "SnpSearch").$$render($$result, { class: "mt-6" }, {}, {})}`} ${edit ? `<div class="flex justify-end my-4"><button data-testid="save-filter-btn" type="button" class="btn btn-sm variant-filled-primary text-lg disabled:opacity-75" ${!canComplete ? "disabled" : ""}>Save Filter <i class="fa-solid fa-plus ml-3"></i></button></div>` : `<div class="flex justify-end my-4" data-testid="filter-options-container"><button data-testid="add-filter-btn" type="button" class="btn btn-sm variant-filled-primary text-lg disabled:opacity-75"${add_attribute(
          "title",
          canComplete ? "Add Filter" : selectedOption === Option.Genomic ? "A gene is required" : "A SNP is required",
          0
        )} ${!canComplete ? "disabled" : ""}>Add Filter <i class="fa-solid fa-plus ml-3"></i></button></div>`}` : ``}`;
      }
    }
  )}`;
});

export { Page as default };
//# sourceMappingURL=_page.svelte-OM84n38f.js.map
