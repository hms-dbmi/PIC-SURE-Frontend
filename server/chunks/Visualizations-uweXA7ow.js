import { a as subscribe } from './lifecycle-DtuISP6h.js';
import { c as create_ssr_component, v as validate_component, b as each, e as escape, a as add_attribute } from './ssr-BRJpAXVH.js';
import { g as getToastStore } from './stores2-Cy1ftf_v.js';
import './ProgressBar.svelte_svelte_type_style_lang-3a6XZCfa.js';
import { P as ProgressRadial } from './ProgressRadial-STSdW-aK.js';
import './configuration-DBHGr3VN.js';
import './index-CvuFLVuQ.js';
import './User-fDnXlPjS.js';
import { p as page } from './stores4-C3NPX6l0.js';
import './Filter-DGDHgVxd.js';

const PlotlyPlot = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { index } = $$props;
  let { data } = $$props;
  let { meta } = $$props;
  let { layout } = $$props;
  let { newPlot } = $$props;
  const screenReaderText = meta.isCategorical ? "Column chart showing the visualization of " : "Histogram showing the visualization of ";
  let plotContainer;
  if ($$props.index === void 0 && $$bindings.index && index !== void 0) $$bindings.index(index);
  if ($$props.data === void 0 && $$bindings.data && data !== void 0) $$bindings.data(data);
  if ($$props.meta === void 0 && $$bindings.meta && meta !== void 0) $$bindings.meta(meta);
  if ($$props.layout === void 0 && $$bindings.layout && layout !== void 0) $$bindings.layout(layout);
  if ($$props.newPlot === void 0 && $$bindings.newPlot && newPlot !== void 0) $$bindings.newPlot(newPlot);
  return `<div id="${"plot-" + escape(index, true)}"${add_attribute("aria-label", screenReaderText + meta.unformatedTitle, 0)}${add_attribute("title", "Visualization of " + meta.unformatedTitle, 0)}${add_attribute("this", plotContainer, 0)}></div>`;
});
const Visualizations = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let loading;
  let $page, $$unsubscribe_page;
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  getToastStore();
  let plotValues = [];
  let newPlot;
  $page.url.pathname.includes("/discover");
  loading = true;
  $$unsubscribe_page();
  return `<p class="mb-8 text-center" data-svelte-h="svelte-1qfu76z">All visualizations display the distributions of each variable filter for the specified cohort.</p> <div id="visualizations" class="flex flex-row flex-wrap gap-6 items-center justify-center">${loading ? `${validate_component(ProgressRadial, "ProgressRadial").$$render($$result, {}, {}, {})}` : `${plotValues.length ? `${each(plotValues, ({ data, layout, meta }, index) => {
    return `${validate_component(PlotlyPlot, "PlotlyPlot").$$render($$result, { index, data, layout, meta, newPlot }, {}, {})}`;
  })}` : `<div data-svelte-h="svelte-1qaygid">No Visualizations Available</div>`}`}</div>`;
});

export { Visualizations as V };
//# sourceMappingURL=Visualizations-uweXA7ow.js.map
