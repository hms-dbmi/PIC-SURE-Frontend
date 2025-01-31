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
const component = async () => component_cache ??= (await import('./_page.svelte-BJD3HsHU.js')).default;
const server_id = "src/routes/(authentication)/login/+page.server.ts";
const imports = ["_app/immutable/nodes/7.wONR3SZ2.js","_app/immutable/chunks/ms4W0FFX.js","_app/immutable/chunks/DwhXHaxl.js","_app/immutable/chunks/Dic8leaQ.js","_app/immutable/chunks/CGEKtPRW.js","_app/immutable/chunks/DJNTpv-S.js","_app/immutable/chunks/DbCUu2ok.js","_app/immutable/chunks/DOLMvtmf.js","_app/immutable/chunks/C1FmrZbK.js","_app/immutable/chunks/DgwQTn4B.js","_app/immutable/chunks/DTdbEHrg.js","_app/immutable/chunks/Chejunr_.js","_app/immutable/chunks/DXYyDbgV.js","_app/immutable/chunks/Bc1452Xg.js","_app/immutable/chunks/C-_8pOTT.js","_app/immutable/chunks/CgVvlcVD.js"];
const stylesheets = ["_app/immutable/assets/7.Bnomq1Aq.css","_app/immutable/assets/ProgressBar.DVz1FANQ.css","_app/immutable/assets/Logo.DVIg6BDV.css"];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=7-CuqGANAg.js.map
