import { c as create_ssr_component, e as escape, v as validate_component, b as each, a as add_attribute } from './ssr-Di-o4HBA.js';
import { b as branding, a as resources } from './configuration-CHJZnZTS.js';
import { g as goto } from './client-TAfaRk9z.js';
import { S as Searchbox } from './Searchbox-CdmC2p1u.js';
import { m as is_promise, n as noop } from './lifecycle-GVhEEkqU.js';
import { p as post } from './User-BlJO9WgU.js';
import './ProgressBar.svelte_svelte_type_style_lang-D52eF_WP.js';
import { P as ProgressRadial } from './ProgressRadial-B9eVk9uU.js';
import { g as getBlankQueryRequest } from './QueryBuilder-ujQ1zYH9.js';
import { g as getStudiesCount, a as getConceptCount } from './dictionary-CsH6mXzx.js';
import './exports-CTha0ECg.js';
import './index2-CV6P_ZFI.js';
import './index-CvuFLVuQ.js';
import './stores3-DsZ2QG0u.js';
import './Filter-DOu7lnJO.js';

const css = {
  code: ".stats.svelte-1crd580{font-size:1rem;padding:1rem}.stats.svelte-1crd580{background-color:rgb(var(--color-surface-300))}",
  map: `{"version":3,"file":"Stats.svelte","sources":["Stats.svelte"],"sourcesContent":["<script lang=\\"ts\\">import * as api from \\"$lib/api\\";\\nimport { ProgressRadial } from \\"@skeletonlabs/skeleton\\";\\nimport { branding, resources } from \\"$lib/configuration\\";\\nimport { browser } from \\"$app/environment\\";\\nimport { getBlankQueryRequest } from \\"$lib/QueryBuilder\\";\\nimport { getStudiesCount, getConceptCount } from \\"$lib/services/dictionary\\";\\nconst ERROR_VALUE = \\"-\\";\\nconst isUserLoggedIn = () => {\\n  if (browser) {\\n    return !!localStorage.getItem(\\"token\\");\\n  }\\n  return false;\\n};\\nconst apiMap = {\\n  \\"Data Sources\\": () => getStudiesCount(!isUserLoggedIn()).then((response) => {\\n    if (response) {\\n      return response.toLocaleString();\\n    }\\n    hasError = true;\\n    return ERROR_VALUE;\\n  }),\\n  Participants: () => api.post(\\"picsure/query/sync\\", getBlankQueryRequest(isUserLoggedIn(), isUserLoggedIn() ? resources.hpds : resources.openHPDS)).then((response) => {\\n    if (response) {\\n      return response.toLocaleString();\\n    }\\n    hasError = true;\\n    return ERROR_VALUE;\\n  }),\\n  Variables: () => getConceptCount(!isUserLoggedIn()).then((response) => {\\n    if (response) {\\n      return response.toLocaleString();\\n    }\\n    hasError = true;\\n    return ERROR_VALUE;\\n  })\\n};\\nasync function getOrApi(key) {\\n  return apiMap[key]();\\n}\\nlet width = branding?.landing?.stats.length;\\nlet hasError = false;\\nlet statMap = /* @__PURE__ */ new Map();\\nbranding?.landing?.stats?.forEach((stat) => {\\n  statMap.set(stat, getOrApi(stat));\\n});\\nlet promises = statMap.values();\\nPromise.allSettled(Array.from(promises)).then((results) => {\\n  results.forEach((result) => {\\n    if (result.status === \\"rejected\\") {\\n      hasError = true;\\n    }\\n  });\\n});\\n<\/script>\\n\\n<section class=\\"stats flex flex-col items-center w-full mt-auto p-4\\">\\n  <h2 class=\\"m-4\\">Data Summary</h2>\\n  <div class=\\"flex flex-wrap justify-evenlyp-4 my-4 gap-y-9 w-1/2\\">\\n    {#each Array.from(statMap) as [key, value] (key)}\\n      <div\\n        class=\\"flex flex-col w-1/{width} p-4 [&:not(:last-child)]:border-r border-surface-400-500-token\\"\\n      >\\n        <div data-testid=\\"value-{key}\\" class=\\"flex flex-col justify-center items-center text-2xl\\">\\n          {#await value}\\n            <ProgressRadial\\n              width=\\"w-10\\"\\n              meter=\\"stroke-surface-50 dark:stroke-surface-900\\"\\n              track=\\"stroke-secondary-500/30\\"\\n              value={undefined}\\n            />\\n          {:then statValue}\\n            <strong class=\\"p-1 mb-3\\">{statValue}</strong>\\n          {:catch}\\n            <i class=\\"fa-solid fa-circle-exclamation p-1 mb-4 mt-1\\"></i>\\n          {/await}\\n        </div>\\n        <p>{key}</p>\\n      </div>\\n    {/each}\\n  </div>\\n  <div class=\\"w-2/4 p-8\\">\\n    {@html isUserLoggedIn() ? branding?.landing?.authExplanation : branding?.landing?.explanation}\\n  </div>\\n  {#if hasError}\\n    <div\\n      id=\\"landing-errors\\"\\n      class=\\"alert variant-filled-error text-error-50-900-token 200-700-token w-3/4 px-4 mb-6 mt-2\\"\\n    >\\n      <div><i class=\\"fa-solid fa-circle-exclamation text-4xl\\"></i></div>\\n      <div class=\\"alert-message\\">\\n        <p>We're having trouble fetching some data points right now. Please try again later.</p>\\n      </div>\\n    </div>\\n  {/if}\\n</section>\\n\\n<style lang=\\"postcss\\">\\n  .stats {\\n    font-size: 1rem;\\n    padding: 1rem;\\n  }\\n  .dark .stats {\\n    background-color: rgb(var(--color-surface-600));\\n}\\n  .stats {\\n    background-color: rgb(var(--color-surface-300));\\n}\\n  .dark .stats {\\n    background-color: rgb(var(--color-surface-600));\\n}\\n  .stats a {\\n    text-decoration: underline;\\n  }</style>\\n"],"names":[],"mappings":"AAiGE,qBAAO,CACL,SAAS,CAAE,IAAI,CACf,OAAO,CAAE,IACX,CAIA,qBAAO,CACL,gBAAgB,CAAE,IAAI,IAAI,mBAAmB,CAAC,CAClD"}`
};
const ERROR_VALUE = "-";
const Stats = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const isUserLoggedIn = () => {
    return false;
  };
  const apiMap = {
    "Data Sources": () => getStudiesCount(!isUserLoggedIn()).then((response) => {
      if (response) {
        return response.toLocaleString();
      }
      hasError = true;
      return ERROR_VALUE;
    }),
    Participants: () => post("picsure/query/sync", getBlankQueryRequest(isUserLoggedIn(), resources.openHPDS)).then((response) => {
      if (response) {
        return response.toLocaleString();
      }
      hasError = true;
      return ERROR_VALUE;
    }),
    Variables: () => getConceptCount(!isUserLoggedIn()).then((response) => {
      if (response) {
        return response.toLocaleString();
      }
      hasError = true;
      return ERROR_VALUE;
    })
  };
  async function getOrApi(key) {
    return apiMap[key]();
  }
  let width = branding?.landing?.stats.length;
  let hasError = false;
  let statMap = /* @__PURE__ */ new Map();
  branding?.landing?.stats?.forEach((stat) => {
    statMap.set(stat, getOrApi(stat));
  });
  let promises = statMap.values();
  Promise.allSettled(Array.from(promises)).then((results) => {
    results.forEach((result) => {
      if (result.status === "rejected") {
        hasError = true;
      }
    });
  });
  $$result.css.add(css);
  return `<section class="stats flex flex-col items-center w-full mt-auto p-4 svelte-1crd580"><h2 class="m-4" data-svelte-h="svelte-c8j8ir">Data Summary</h2> <div class="flex flex-wrap justify-evenlyp-4 my-4 gap-y-9 w-1/2">${each(Array.from(statMap), ([key, value]) => {
    return `<div class="${"flex flex-col w-1/" + escape(width, true) + " p-4 [&amp;:not(:last-child)]:border-r border-surface-400-500-token svelte-1crd580"}"><div data-testid="${"value-" + escape(key, true)}" class="flex flex-col justify-center items-center text-2xl">${function(__value) {
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
      return function(statValue) {
        return ` <strong class="p-1 mb-3">${escape(statValue)}</strong> `;
      }(__value);
    }(value)}</div> <p>${escape(key)}</p> </div>`;
  })}</div> <div class="w-2/4 p-8"><!-- HTML_TAG_START -->${branding?.landing?.explanation}<!-- HTML_TAG_END --></div> ${hasError ? `<div id="landing-errors" class="alert variant-filled-error text-error-50-900-token 200-700-token w-3/4 px-4 mb-6 mt-2" data-svelte-h="svelte-5wd9ib"><div><i class="fa-solid fa-circle-exclamation text-4xl"></i></div> <div class="alert-message"><p>We&#39;re having trouble fetching some data points right now. Please try again later.</p></div></div>` : ``} </section>`;
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
      return `<div class="${"flex flex-col items-center w-1/" + escape(branding?.landing?.actions.length, true)}"><div class="text-3xl my-1">${escape(title)}</div> <i class="${"text-[5rem] my-3 text-secondary-500-400-token " + escape(icon, true)}"></i> <div class="subtitle my-3">${escape(description)}</div> <a data-testid="${"landing-action-" + escape(title, true) + "-btn"}"${add_attribute("href", url, 0)} class="btn variant-filled-primary">${escape(btnText)}</a> </div>`;
    })}</section> ${validate_component(Stats, "Stats").$$render($$result, {}, {}, {})}</div>`;
  } while (!$$settled);
  return $$rendered;
});

export { Page as default };
//# sourceMappingURL=_page.svelte-BhT2kEJB.js.map
