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
const component = async () => component_cache ??= (await import('./_page.svelte-ZGBJgfEY.js')).default;
const server_id = "src/routes/(authentication)/login/+page.server.ts";
const imports = ["_app/immutable/nodes/7.DaB3WAao.js","_app/immutable/chunks/CJ6ziB5E.js","_app/immutable/chunks/B1UO4OkM.js","_app/immutable/chunks/CVe-HNkC.js","_app/immutable/chunks/B9MtYE6U.js","_app/immutable/chunks/Bx_3jGoJ.js","_app/immutable/chunks/D9QhBFw8.js","_app/immutable/chunks/YtjTsSiW.js","_app/immutable/chunks/C1FmrZbK.js","_app/immutable/chunks/qLd7hq4-.js","_app/immutable/chunks/b6utF9I1.js","_app/immutable/chunks/DlmMpHpA.js","_app/immutable/chunks/DXVbyi0u.js","_app/immutable/chunks/DZ_zdl5z.js","_app/immutable/chunks/jzPdkqxf.js","_app/immutable/chunks/CnXVwVwa.js"];
const stylesheets = ["_app/immutable/assets/7.Bnomq1Aq.css","_app/immutable/assets/Pagination.CSdchOBD.css","_app/immutable/assets/ProgressBar.DVz1FANQ.css","_app/immutable/assets/Logo.DVIg6BDV.css"];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=7-Rangt11n.js.map
