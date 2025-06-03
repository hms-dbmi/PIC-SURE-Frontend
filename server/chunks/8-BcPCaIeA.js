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

const index = 8;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-BG4COc9S.js')).default;
const server_id = "src/routes/(authentication)/login/+page.server.ts";
const imports = ["_app/immutable/nodes/8.CQxBaHqt.js","_app/immutable/chunks/CDvIr29H.js","_app/immutable/chunks/BJ-g7xSB.js","_app/immutable/chunks/ByE-_V18.js","_app/immutable/chunks/mmDljT_r.js","_app/immutable/chunks/BmKPRyWy.js","_app/immutable/chunks/BMKj-mzl.js","_app/immutable/chunks/BtHeeR-W.js","_app/immutable/chunks/C1FmrZbK.js","_app/immutable/chunks/DCqoOs8S.js","_app/immutable/chunks/CnlG47Jq.js","_app/immutable/chunks/VQmOc05J.js","_app/immutable/chunks/C1zJQccS.js","_app/immutable/chunks/DRE3Lf26.js","_app/immutable/chunks/Bq_4NOFD.js","_app/immutable/chunks/Bh3JMGVJ.js"];
const stylesheets = ["_app/immutable/assets/8.Bnomq1Aq.css","_app/immutable/assets/Pagination.CSdchOBD.css","_app/immutable/assets/ProgressBar.DVz1FANQ.css","_app/immutable/assets/Logo.DVIg6BDV.css"];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=8-BcPCaIeA.js.map
