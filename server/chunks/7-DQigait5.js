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
const component = async () => component_cache ??= (await import('./_page.svelte-CN5ZvUWy.js')).default;
const server_id = "src/routes/(authentication)/login/+page.server.ts";
const imports = ["_app/immutable/nodes/7.D2mfubcY.js","_app/immutable/chunks/scheduler.bui7uCNy.js","_app/immutable/chunks/await_block.B6WJ5gpV.js","_app/immutable/chunks/index.CNwEczq-.js","_app/immutable/chunks/each.VHlBgARd.js","_app/immutable/chunks/stores.WcJ0rjcA.js","_app/immutable/chunks/entry.BzyMyMCS.js","_app/immutable/chunks/AuthProviderRegistry.CoVZEDvP.js","_app/immutable/chunks/preload-helper.C1FmrZbK.js","_app/immutable/chunks/Search.B59ZX9QM.js","_app/immutable/chunks/dictionary.CWXs9J8o.js","_app/immutable/chunks/stores.EYwnRdwT.js","_app/immutable/chunks/ProgressBar.svelte_svelte_type_style_lang.DAEU1KBT.js","_app/immutable/chunks/index.D4B8xqkz.js","_app/immutable/chunks/ProgressRadial.CbTPnjvT.js","_app/immutable/chunks/Logo.DwZyQt99.js"];
const stylesheets = ["_app/immutable/assets/7.Bnomq1Aq.css","_app/immutable/assets/ProgressBar.DVz1FANQ.css","_app/immutable/assets/Logo.DVIg6BDV.css"];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=7-DQigait5.js.map
