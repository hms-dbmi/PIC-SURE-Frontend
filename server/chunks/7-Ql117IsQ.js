import { g as getAllProviderData } from './AuthProviderRegistry-DQ6xXw8B.js';

const load = async () => {
  let providers = getAllProviderData();
  const altProviders = [];
  providers = providers.reduce((mainProviders, current) => {
    if (current.alt) {
      altProviders.push(current);
    } else {
      mainProviders.push(current);
    }
    return mainProviders;
  }, []);
  return {
    providers,
    altProviders
  };
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 7;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-eQ73WQzf.js')).default;
const server_id = "src/routes/(authentication)/login/+page.server.ts";
const imports = ["_app/immutable/nodes/7.CqcKTkFn.js","_app/immutable/chunks/scheduler.bui7uCNy.js","_app/immutable/chunks/await_block.B6WJ5gpV.js","_app/immutable/chunks/index.CNwEczq-.js","_app/immutable/chunks/each.VHlBgARd.js","_app/immutable/chunks/stores.CPF93CS5.js","_app/immutable/chunks/entry.Df3FuYeh.js","_app/immutable/chunks/AuthProviderRegistry.D6oO6deA.js","_app/immutable/chunks/preload-helper.C1FmrZbK.js","_app/immutable/chunks/Search.Crp1oBrK.js","_app/immutable/chunks/dictionary._AigakH0.js","_app/immutable/chunks/stores.BxqKnRZD.js","_app/immutable/chunks/ProgressBar.svelte_svelte_type_style_lang.BuMCQOqK.js","_app/immutable/chunks/index.D4B8xqkz.js","_app/immutable/chunks/ProgressRadial.CbTPnjvT.js","_app/immutable/chunks/Logo.DD2bkWSZ.js"];
const stylesheets = ["_app/immutable/assets/7.BI3lgiz3.css","_app/immutable/assets/ProgressBar.BNOpJ5it.css","_app/immutable/assets/Logo.CJ2CJIMx.css"];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=7-Ql117IsQ.js.map
