import { x as push, U as copy_payload, V as assign_payload, z as pop, K as escape_html, N as attr } from './index-C5NonOVO.js';
import { t as toaster } from './User-ByrNDeqq.js';
import './Filter-BUwQwcV6.js';
import './Dictionary-10axK71X.js';
import { L as Loading } from './Loading-Drx6gnkR.js';
import { O as OptionsSelectionList } from './OptionsSelectionList-Dlogw0gs.js';

function AddFilter($$payload, $$props) {
  push();
  let {
    data = {},
    existingFilter,
    onclose = () => {
    }
  } = $$props;
  let max = "";
  let min = "";
  let minFormValue = "";
  let maxFormValue = "";
  let pageSize = 20;
  let unselectedOptions = [];
  let selectedOptions = [];
  let startLocation = pageSize;
  let lastSearchTerm = "";
  let loading = false;
  function getNextValues(search = "") {
    const totalOptions = data?.values?.length || 0;
    if (totalOptions === 0) return;
    loading = true;
    try {
      let allOptions = data?.values || [];
      if (search !== lastSearchTerm || !lastSearchTerm.includes(search)) {
        startLocation = 0;
        unselectedOptions = [];
        lastSearchTerm = search;
      }
      let filteredOptions = allOptions.filter((option) => !selectedOptions.includes(option) && (!search || option.toLowerCase().includes(search.toLowerCase())));
      const endLocation = Math.min(startLocation + pageSize, filteredOptions.length);
      const nextOptions = filteredOptions.slice(startLocation, endLocation);
      unselectedOptions = [...unselectedOptions, ...nextOptions];
      startLocation = endLocation;
    } catch (error) {
      console.error(error);
      toaster.error({
        title: "An error occurred while loading more options. Please try again later."
      });
    }
    loading = false;
  }
  let valuesSelected = selectedOptions.map((option) => option);
  let $$settled = true;
  let $$inner_payload;
  function $$render_inner($$payload2) {
    $$payload2.out += `<div>`;
    if (!!data) {
      $$payload2.out += "<!--[-->";
      $$payload2.out += `<div class="variable-info">`;
      {
        $$payload2.out += "<!--[!-->";
      }
      $$payload2.out += `<!--]--> `;
      {
        $$payload2.out += "<!--[!-->";
      }
      $$payload2.out += `<!--]--> `;
      {
        $$payload2.out += "<!--[!-->";
      }
      $$payload2.out += `<!--]--></div>`;
    } else {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--> <div class="flex justify-between" data-testid="filter-component">`;
    if (!data) {
      $$payload2.out += "<!--[-->";
      Loading($$payload2, { ring: true, size: "medium" });
    } else {
      $$payload2.out += "<!--[!-->";
      if (data?.type === "Categorical") {
        $$payload2.out += "<!--[-->";
        $$payload2.out += `<div data-testid="categoical-filter" class="w-full">`;
        OptionsSelectionList($$payload2, {
          allOptions: data?.values,
          onscroll: getNextValues,
          get unselectedOptions() {
            return unselectedOptions;
          },
          set unselectedOptions($$value) {
            unselectedOptions = $$value;
            $$settled = false;
          },
          get selectedOptions() {
            return selectedOptions;
          },
          set selectedOptions($$value) {
            selectedOptions = $$value;
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
      } else if (data?.type === "Continuous") {
        $$payload2.out += "<!--[1-->";
        $$payload2.out += `<div class="card bg-surface-100 p-3 m-1 w-full"><section class="card-body flex grow gap-4" data-testid="numerical-filter"><label class="flex-auto flex-col"><span>Min: ${escape_html(min)}</span> <input id="min" data-testid="min-input" type="text" placeholder="Enter value or leave blank for variable min" class="input"${attr("value", minFormValue)}/></label> <label class="flex-auto flex-col"><span>Max: ${escape_html(max)}</span> <input id="max" data-testid="max-input" type="text" placeholder="Enter value or leave blank for variable max" class="input"${attr("value", maxFormValue)}/></label></section></div>`;
      } else {
        $$payload2.out += "<!--[!-->";
      }
      $$payload2.out += `<!--]--> <button class="btn btn-icon preset-filled-primary-500 m-1 svelte-1kbvhvw" data-testid="add-filter" aria-label="Add Filter"${attr("disabled", data.type === "Categorical" && valuesSelected.length === 0, true)}><i class="fas fa-plus"></i></button>`;
    }
    $$payload2.out += `<!--]--></div></div>`;
  }
  do {
    $$settled = true;
    $$inner_payload = copy_payload($$payload);
    $$render_inner($$inner_payload);
  } while (!$$settled);
  assign_payload($$payload, $$inner_payload);
  pop();
}

export { AddFilter as A };
//# sourceMappingURL=AddFilter-BbVq5aRW.js.map
