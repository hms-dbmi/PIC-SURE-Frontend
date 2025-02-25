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
const component = async () => component_cache ??= (await import('./_page.svelte--P15E9dl.js')).default;
const server_id = "src/routes/(authentication)/login/+page.server.ts";
const imports = ["_app/immutable/nodes/7.ANOMRFvK.js","_app/immutable/chunks/DfqJWsAP.js","_app/immutable/chunks/Cn0d3STq.js","_app/immutable/chunks/B9sU1H0B.js","_app/immutable/chunks/CnUKkpeB.js","_app/immutable/chunks/C4m20sN0.js","_app/immutable/chunks/DA0IzwqI.js","_app/immutable/chunks/CbBVQZqd.js","_app/immutable/chunks/C1FmrZbK.js","_app/immutable/chunks/ByE-VvVj.js","_app/immutable/chunks/CWplMVgD.js","_app/immutable/chunks/D4yaORjf.js","_app/immutable/chunks/8fc_wYz-.js","_app/immutable/chunks/BuTMWYot.js","_app/immutable/chunks/hZi8C6Ly.js","_app/immutable/chunks/KMJqctWi.js"];
const stylesheets = ["_app/immutable/assets/7.Bnomq1Aq.css","_app/immutable/assets/ProgressBar.DVz1FANQ.css","_app/immutable/assets/Logo.DVIg6BDV.css"];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=7-B-_jV3H4.js.map
