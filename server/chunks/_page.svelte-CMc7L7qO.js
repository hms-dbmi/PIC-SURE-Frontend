import { a as subscribe } from './lifecycle-DtuISP6h.js';
import { c as create_ssr_component, v as validate_component } from './ssr-BRJpAXVH.js';
import { s as state, E as ExportStepper } from './ExportStepper-BbkBmoa3.js';
import { f as filters } from './Filter-DQ4J7bUR.js';
import { E as ExportStore } from './Export-Bnz6Pnjy.js';
import { C as Content } from './Content-DMwoUi6K.js';
import { a as getQueryRequest } from './QueryBuilder-LFC29XqS.js';
import './configuration-JjhNHhnG.js';
import './index-CvuFLVuQ.js';
import './User-DpPjP5W7.js';
import './index2-BVONNh3m.js';
import './client-BR749xJD.js';
import './exports-kR70XCWV.js';
import './stores4-C3NPX6l0.js';
import './AngleButton-C6YzBYNH.js';
import './Table-BKmcVPFT.js';
import './Row-DZ3u2TX9.js';
import './UserToken-C1wwCOoa.js';
import './stores-CeRLSJyW.js';
import './stores2-Cy1ftf_v.js';
import './ProgressBar.svelte_svelte_type_style_lang-3a6XZCfa.js';
import './ProgressRadial-STSdW-aK.js';
import './CopyButton-BtLZ49Iw.js';
import './codeBlocks-D7Bb9quT.js';
import './CardButton-BunBsA3_.js';

const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $filters, $$unsubscribe_filters;
  let $exports, $$unsubscribe_exports;
  let $state, $$unsubscribe_state;
  $$unsubscribe_filters = subscribe(filters, (value) => $filters = value);
  $$unsubscribe_state = subscribe(state, (value) => $state = value);
  let { exports } = ExportStore;
  $$unsubscribe_exports = subscribe(exports, (value) => $exports = value);
  let queryRequest = getQueryRequest(true);
  let exportRows = $exports.map((exp) => {
    return {
      ref: exp,
      selected: true,
      variableId: exp.conceptPath,
      variableName: exp.display || exp.searchResult?.display,
      description: exp.searchResult?.description,
      type: exp.searchResult?.type
    };
  });
  let filterRows = $filters.map((filter) => {
    return {
      ref: filter,
      selected: true,
      variableId: filter.id,
      variableName: filter.searchResult?.display || filter.variableName,
      description: filter.searchResult?.description,
      type: filter.searchResult?.type
    };
  });
  state.set({ current: 0, total: 0 });
  $$unsubscribe_filters();
  $$unsubscribe_exports();
  $$unsubscribe_state();
  return `${validate_component(Content, "Content").$$render(
    $$result,
    {
      backUrl: "/explorer",
      backTitle: "Back to Explore",
      backAction: () => {
        $state.current = 0;
      },
      title: "Export Data for Research Analysis"
    },
    {},
    {
      default: () => {
        return `${$exports.length > 0 || $filters.length > 0 ? `<section class="flex justify-center items-center w-full h-full mt-8">${validate_component(ExportStepper, "ExportStepper").$$render(
          $$result,
          {
            query: queryRequest,
            rows: [...filterRows, ...exportRows]
          },
          {},
          {}
        )}</section>` : `<div class="flex flex-col items-center justify-center m-8"><p data-svelte-h="svelte-1xd42eg">No filters or exports have been created.</p> <div class="flex gap-4"><button class="btn variant-filled-primary m-4" data-svelte-h="svelte-1yq884x">Learn How</button></div></div>`}`;
      }
    }
  )}`;
});

export { Page as default };
//# sourceMappingURL=_page.svelte-CMc7L7qO.js.map
