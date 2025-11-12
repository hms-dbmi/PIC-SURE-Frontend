import { x as push, V as copy_payload, W as assign_payload, z as pop, M as escape_html, O as attr } from './index-BYsoXH7a.js';
import { t as toaster } from './User-CGCqDR6a.js';
import './Filter-D4fknGLB.js';
import './Dictionary-SO9EnU4C.js';
import { L as Loading } from './Loading-D4A6B7i5.js';
import { O as OptionsSelectionList } from './OptionsSelectionList-B-cROXFf.js';
import './index2-DXnmzf54.js';

function AddFilter($$payload, $$props) {
  push();
  let { data = {}, existingFilter, onclose = () => {
  } } = $$props;
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
    $$payload2.out.push(`<div>`);
    if (!!data) {
      $$payload2.out.push("<!--[-->");
      $$payload2.out.push(`<div class="variable-info">`);
      {
        $$payload2.out.push("<!--[!-->");
      }
      $$payload2.out.push(`<!--]--> `);
      {
        $$payload2.out.push("<!--[!-->");
      }
      $$payload2.out.push(`<!--]--> `);
      {
        $$payload2.out.push("<!--[!-->");
      }
      $$payload2.out.push(`<!--]--></div>`);
    } else {
      $$payload2.out.push("<!--[!-->");
    }
    $$payload2.out.push(`<!--]--> <div class="flex justify-between" data-testid="filter-component">`);
    if (!data) {
      $$payload2.out.push("<!--[-->");
      Loading($$payload2, { ring: true, size: "medium" });
    } else {
      $$payload2.out.push("<!--[!-->");
      if (data?.type === "Categorical") {
        $$payload2.out.push("<!--[-->");
        $$payload2.out.push(`<div data-testid="categoical-filter" class="w-full">`);
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
        $$payload2.out.push(`<!----></div>`);
      } else {
        $$payload2.out.push("<!--[!-->");
        if (data?.type === "Continuous") {
          $$payload2.out.push("<!--[-->");
          $$payload2.out.push(`<div class="card bg-surface-100 p-3 m-1 w-full"><section class="card-body flex grow gap-4" data-testid="numerical-filter"><label class="flex-auto flex-col"><span>Min: ${escape_html(min)}</span> <input id="min" data-testid="min-input" type="text" placeholder="Enter value or leave blank for variable min" class="input"${attr("value", minFormValue)}/></label> <label class="flex-auto flex-col"><span>Max: ${escape_html(max)}</span> <input id="max" data-testid="max-input" type="text" placeholder="Enter value or leave blank for variable max" class="input"${attr("value", maxFormValue)}/></label></section></div>`);
        } else {
          $$payload2.out.push("<!--[!-->");
        }
        $$payload2.out.push(`<!--]-->`);
      }
      $$payload2.out.push(`<!--]--> <button class="btn btn-icon preset-filled-primary-500 m-1 svelte-ioyacr" data-testid="add-filter" aria-label="Add Filter"${attr("disabled", data.type === "Categorical" && valuesSelected.length === 0, true)}><i class="fas fa-plus"></i></button>`);
    }
    $$payload2.out.push(`<!--]--></div></div>`);
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
//# sourceMappingURL=AddFilter-DdRxu9jO.js.map
