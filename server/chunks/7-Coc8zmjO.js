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
const component = async () => component_cache ??= (await import('./_page.svelte-C0AWl42h.js')).default;
const server_id = "src/routes/(authentication)/login/+page.server.ts";
const imports = ["_app/immutable/nodes/7.zrvdry6S.js","_app/immutable/chunks/CseAM1pm.js","_app/immutable/chunks/CndaLTDj.js","_app/immutable/chunks/CUD_i9MT.js","_app/immutable/chunks/Ba1MNdbe.js","_app/immutable/chunks/BC5FmEPb.js","_app/immutable/chunks/Dx2jxSvH.js","_app/immutable/chunks/04IsIQkc.js","_app/immutable/chunks/C1FmrZbK.js","_app/immutable/chunks/BGP52hsX.js","_app/immutable/chunks/CEWVEGNE.js","_app/immutable/chunks/xidBtgCA.js","_app/immutable/chunks/Cd9QPAjN.js","_app/immutable/chunks/BkA5Czcl.js","_app/immutable/chunks/CEpVNBhg.js","_app/immutable/chunks/h6t_GN0-.js"];
const stylesheets = ["_app/immutable/assets/7.Bnomq1Aq.css","_app/immutable/assets/Pagination.CSdchOBD.css","_app/immutable/assets/ProgressBar.DVz1FANQ.css","_app/immutable/assets/Logo.DVIg6BDV.css"];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=7-Coc8zmjO.js.map
