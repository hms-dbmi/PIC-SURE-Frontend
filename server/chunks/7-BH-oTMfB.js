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
const component = async () => component_cache ??= (await import('./_page.svelte-E6AZ9AWl.js')).default;
const server_id = "src/routes/(authentication)/login/+page.server.ts";
const imports = ["_app/immutable/nodes/7.BRGAHtcd.js","_app/immutable/chunks/scheduler.bui7uCNy.js","_app/immutable/chunks/await_block.DenEio6G.js","_app/immutable/chunks/index.Divvo4fc.js","_app/immutable/chunks/each.Ct-HShz-.js","_app/immutable/chunks/stores.CGSu9-ky.js","_app/immutable/chunks/entry.D9nKiiu7.js","_app/immutable/chunks/AuthProviderRegistry.C01toUd8.js","_app/immutable/chunks/preload-helper.C1FmrZbK.js","_app/immutable/chunks/Search.C3zC3RHZ.js","_app/immutable/chunks/dictionary.81xI9LLS.js","_app/immutable/chunks/ProgressBar.svelte_svelte_type_style_lang.B7SkmbeT.js","_app/immutable/chunks/index.D4B8xqkz.js","_app/immutable/chunks/ProgressRadial.CtNAsR5Q.js","_app/immutable/chunks/Logo.BzMTzviT.js"];
const stylesheets = ["_app/immutable/assets/7.BI3lgiz3.css","_app/immutable/assets/ProgressBar.BNOpJ5it.css","_app/immutable/assets/Logo.CJ2CJIMx.css"];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=7-BH-oTMfB.js.map
