import { c as create_ssr_component, e as escape, v as validate_component, b as each, a as add_attribute } from './ssr-BRJpAXVH.js';
import { b as branding } from './configuration-DBHGr3VN.js';
import { g as goto } from './client-BR749xJD.js';
import { S as Searchbox } from './Searchbox-Dtb4SqsV.js';
import { a as subscribe, l as is_promise, n as noop } from './lifecycle-DtuISP6h.js';
import { d as derived, w as writable } from './index2-BVONNh3m.js';
import './index-CvuFLVuQ.js';
import './User-fDnXlPjS.js';
import './Filter-DGDHgVxd.js';
import './Dictionary-CUBPqBY_.js';
import './ProgressBar.svelte_svelte_type_style_lang-3a6XZCfa.js';
import { P as ProgressRadial } from './ProgressRadial-STSdW-aK.js';
import './exports-kR70XCWV.js';
import './stores4-C3NPX6l0.js';

const hasError = writable(false);
const statData = writable([]);
const stats = derived(
  statData,
  ($s) => $s.filter((stat) => !stat.auth)
);
const authStats = derived(
  statData,
  ($s) => $s.filter((stat) => stat.auth)
);
const Stat = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let authString;
  let $stats, $$unsubscribe_stats;
  let { stats: stats2 } = $$props;
  $$unsubscribe_stats = subscribe(stats2, (value) => $stats = value);
  let { description } = $$props;
  let { auth = false } = $$props;
  if ($$props.stats === void 0 && $$bindings.stats && stats2 !== void 0) $$bindings.stats(stats2);
  if ($$props.description === void 0 && $$bindings.description && description !== void 0) $$bindings.description(description);
  if ($$props.auth === void 0 && $$bindings.auth && auth !== void 0) $$bindings.auth(auth);
  authString = auth ? "auth" : "open";
  $$unsubscribe_stats();
  return `<div data-testid="${"data-summary-" + escape(authString, true)}" class="w-full flex flex-col items-center"><div class="w-2/4"><!-- HTML_TAG_START -->${description}<!-- HTML_TAG_END --></div> <div class="${"grid grid-cols-" + escape($stats.length, true) + " grid-flow-col justify-center p-4 my-4 gap-y-9 " + escape($stats.length > 4 ? "w-full" : "w-1/2", true)}">${each($stats, (stat) => {
    return `<div class="p-4 [&amp;:not(:last-child)]:border-r border-surface-400-500-token"><div data-testid="${"value-" + escape(authString, true) + "-" + escape(stat.key, true) + "-" + escape(stat.label, true)}" class="flex flex-col justify-center items-center text-2xl">${function(__value) {
      if (is_promise(__value)) {
        __value.then(null, noop);
        return ` ${validate_component(ProgressRadial, "ProgressRadial").$$render(
          $$result,
          {
            width: "w-10",
            meter: "stroke-surface-50 dark:stroke-surface-900",
            track: "stroke-secondary-500/30",
            value: void 0
          },
          {},
          {}
        )} `;
      }
      return function(value) {
        return ` <strong class="p-1 mb-3">${escape(value && value.toLocaleString())}</strong> `;
      }(__value);
    }(stat.value)}</div> <p>${escape(stat.label)}</p> </div>`;
  })}</div></div>`;
});
const Stats = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $authStats, $$unsubscribe_authStats;
  let $stats, $$unsubscribe_stats;
  let $hasError, $$unsubscribe_hasError;
  $$unsubscribe_authStats = subscribe(authStats, (value) => $authStats = value);
  $$unsubscribe_stats = subscribe(stats, (value) => $stats = value);
  $$unsubscribe_hasError = subscribe(hasError, (value) => $hasError = value);
  $$unsubscribe_authStats();
  $$unsubscribe_stats();
  $$unsubscribe_hasError();
  return `<section class="flex flex-col items-center w-full p-4 bg-surface-300-600-token"><h2 class="m-4" data-svelte-h="svelte-c8j8ir">Data Summary</h2> ${$authStats.length > 0 ? `${validate_component(Stat, "Stat").$$render(
    $$result,
    {
      stats: authStats,
      auth: true,
      description: branding?.landing?.authExplanation
    },
    {},
    {}
  )}` : ``} ${$stats.length > 0 ? `${validate_component(Stat, "Stat").$$render(
    $$result,
    {
      stats,
      description: branding?.landing?.explanation
    },
    {},
    {}
  )}` : ``} ${$hasError ? `<div id="landing-errors" class="alert variant-filled-error text-error-50-900-token 200-700-token w-3/4 px-4 mb-6" data-svelte-h="svelte-1tihk69"><div><i class="fa-solid fa-circle-exclamation text-4xl"></i></div> <div class="alert-message"><p>We&#39;re having trouble fetching some data points right now. Please try again later.</p></div></div>` : ``}</section>`;
});
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let searchTerm = "";
  function search() {
    goto();
  }
  const actionsToDisplay = branding?.landing?.actions.filter((action) => {
    {
      return action.isOpen || !action.showIfLoggedIn;
    }
  });
  let $$settled;
  let $$rendered;
  let previous_head = $$result.head;
  do {
    $$settled = true;
    $$result.head = previous_head;
    $$rendered = `${$$result.head += `<!-- HEAD_svelte-1uz9aip_START -->${$$result.title = `<title>${escape(branding.applicationName)}</title>`, ""}<!-- HEAD_svelte-1uz9aip_END -->`, ""} <div id="landing" class="flex flex-wrap flex-col justify-evenly text-center items-center w-full h-full mt-8"><section id="search-section" class="flex flex-col text-center items-center my-4 mt-auto w-2/3">${validate_component(Searchbox, "Searchbox").$$render(
      $$result,
      {
        placeholder: branding?.landing?.searchPlaceholder,
        search,
        searchTerm
      },
      {
        searchTerm: ($$value) => {
          searchTerm = $$value;
          $$settled = false;
        }
      },
      {}
    )}</section> <section id="actions-section" class="flex flex-row justify-evenly items-center w-2/3 mt-auto mb-8">${each(actionsToDisplay, ({ title, description, icon, url, btnText }) => {
      return `<div class="${"flex flex-col items-center w-1/" + escape(actionsToDisplay?.length || 3, true)}"><div class="text-3xl my-1">${escape(title)}</div> <i class="${"text-[5rem] my-3 text-secondary-500-400-token " + escape(icon, true)}"></i> <div class="subtitle my-3">${escape(description)}</div> <a data-testid="${"landing-action-" + escape(title, true) + "-btn"}"${add_attribute("href", url, 0)} class="btn variant-filled-primary">${escape(btnText)}</a> </div>`;
    })}</section> ${validate_component(Stats, "Stats").$$render($$result, {}, {}, {})}</div>`;
  } while (!$$settled);
  return $$rendered;
});

export { Page as default };
//# sourceMappingURL=_page.svelte-BWXKFVdC.js.map
