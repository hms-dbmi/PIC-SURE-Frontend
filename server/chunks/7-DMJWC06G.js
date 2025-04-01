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
const component = async () => component_cache ??= (await import('./_page.svelte-Do8Mun1x.js')).default;
const server_id = "src/routes/(authentication)/login/+page.server.ts";
const imports = ["_app/immutable/nodes/7.D2NWSX2h.js","_app/immutable/chunks/CseAM1pm.js","_app/immutable/chunks/CndaLTDj.js","_app/immutable/chunks/CUD_i9MT.js","_app/immutable/chunks/Ba1MNdbe.js","_app/immutable/chunks/LJvazNn0.js","_app/immutable/chunks/zOfZnRfh.js","_app/immutable/chunks/O5fhu9cQ.js","_app/immutable/chunks/C1FmrZbK.js","_app/immutable/chunks/WtKcDEMi.js","_app/immutable/chunks/7Z_PpGCg.js","_app/immutable/chunks/NhmsAo-M.js","_app/immutable/chunks/C8tRaeKn.js","_app/immutable/chunks/BkA5Czcl.js","_app/immutable/chunks/CEpVNBhg.js","_app/immutable/chunks/BfIktod6.js"];
const stylesheets = ["_app/immutable/assets/7.Bnomq1Aq.css","_app/immutable/assets/Pagination.CSdchOBD.css","_app/immutable/assets/ProgressBar.DVz1FANQ.css","_app/immutable/assets/Logo.DVIg6BDV.css"];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=7-DMJWC06G.js.map
