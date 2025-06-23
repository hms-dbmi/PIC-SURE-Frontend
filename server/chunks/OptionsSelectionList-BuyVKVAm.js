import { x as push, R as ensure_array_like, N as attr, K as escape_html, P as stringify, Y as bind_props, z as pop } from './index-BKfiikQf.js';
import { L as Loading } from './Loading-DKkczq09.js';

function OptionsSelectionList($$payload, $$props) {
  push();
  let searchInput = "";
  let {
    unselectedOptions = [],
    selectedOptions = [],
    selectedOptionEndLocation = 20,
    currentlyLoading = false,
    showClearAll = true,
    showSelectAll = true,
    allOptionsLoaded = false,
    allOptions = void 0,
    onscroll = () => {
    }
  } = $$props;
  function getID(option) {
    return option.replaceAll(" ", "-").toLowerCase();
  }
  let infiniteScroll = allOptions === void 0;
  let totalAvailableOptions = infiniteScroll ? Infinity : (allOptions?.length || 0) - selectedOptions.length;
  infiniteScroll ? allOptionsLoaded : unselectedOptions.length >= totalAvailableOptions;
  let displayedSelectedOptions = selectedOptions.slice(0, selectedOptionEndLocation);
  const each_array = ensure_array_like(unselectedOptions);
  const each_array_1 = ensure_array_like(displayedSelectedOptions);
  $$payload.out += `<div data-testid="optional-selection-list" class="flex w-full"><div class="flex flex-1 flex-col h-full p-3 m-1 card bg-surface-100 rounded-xl"><header class="flex pb-1"><input class="input text-sm" type="search" name="search"${attr("value", searchInput)} placeholder="Search..."/> `;
  if (showSelectAll) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<button id="select-all" class="btn preset-outlined-surface-500 hover:preset-filled-primary-500 ml-2 text-sm"${attr("disabled", unselectedOptions.length === 0, true)}>Select All</button>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></header> <section class="card-body"><div id="options-container" class="overflow-scroll scrollbar-color h-25vh svelte-klmedf"><!--[-->`;
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let option = each_array[$$index];
    $$payload.out += `<label${attr("id", `option-${stringify(getID(option))}`)} class="p-1 m-1 block cursor-pointer hover:preset-tonal-surface hover:rounded-md" role="listitem"><input type="checkbox"${attr("value", option)} class="mr-1 float-left"/> ${escape_html(option)}</label>`;
  }
  $$payload.out += `<!--]--> `;
  if (currentlyLoading) {
    $$payload.out += "<!--[-->";
    Loading($$payload, { ring: true, size: "small" });
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div></section></div> <div class="flex flex-1 flex-col h-full p-3 m-1 card bg-surface-100 rounded-xl"><header class="flex justify-between pb-1"><div class="py-2">Selected:</div> `;
  if (showClearAll) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<button id="clear" class="btn preset-outlined-surface-500 hover:preset-filled-primary-500 ml-2 text-sm"${attr("disabled", selectedOptions.length === 0, true)}>Clear</button>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></header> <section class="card-body"><div id="selected-options-container" class="overflow-scroll scrollbar-color h-25vh svelte-klmedf"><!--[-->`;
  for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
    let option = each_array_1[$$index_1];
    $$payload.out += `<label${attr("id", `option-${stringify(getID(option))}`)} class="p-1 m-1 block hover:preset-tonal-surface hover:rounded-md cursor-pointer" role="listitem"><input type="checkbox" class="mr-1"${attr("value", option)} checked/> ${escape_html(option)}</label>`;
  }
  $$payload.out += `<!--]--> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div></section></div></div>`;
  bind_props($$props, {
    unselectedOptions,
    selectedOptions,
    selectedOptionEndLocation,
    currentlyLoading
  });
  pop();
}

export { OptionsSelectionList as O };
//# sourceMappingURL=OptionsSelectionList-BuyVKVAm.js.map
