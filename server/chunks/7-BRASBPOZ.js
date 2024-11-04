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
const component = async () => component_cache ??= (await import('./_page.svelte-B967DhUC.js')).default;
const server_id = "src/routes/(authentication)/login/+page.server.ts";
const imports = ["_app/immutable/nodes/7.CNoGO58B.js","_app/immutable/chunks/scheduler.bui7uCNy.js","_app/immutable/chunks/await_block.B6WJ5gpV.js","_app/immutable/chunks/index.CNwEczq-.js","_app/immutable/chunks/each.VHlBgARd.js","_app/immutable/chunks/stores.BKrgnEYe.js","_app/immutable/chunks/entry.A9MTiJM-.js","_app/immutable/chunks/AuthProviderRegistry.D60XWJk7.js","_app/immutable/chunks/preload-helper.C1FmrZbK.js","_app/immutable/chunks/Search.B0ImN9T8.js","_app/immutable/chunks/dictionary.PMLfPCVn.js","_app/immutable/chunks/stores.SG0YUSz5.js","_app/immutable/chunks/ProgressBar.svelte_svelte_type_style_lang.BKgxDQCH.js","_app/immutable/chunks/index.D4B8xqkz.js","_app/immutable/chunks/ProgressRadial.CbTPnjvT.js","_app/immutable/chunks/Logo.kd9vxhiu.js"];
const stylesheets = ["_app/immutable/assets/7.Bnomq1Aq.css","_app/immutable/assets/ProgressBar.DVz1FANQ.css","_app/immutable/assets/Logo.DVIg6BDV.css"];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=7-BRASBPOZ.js.map
