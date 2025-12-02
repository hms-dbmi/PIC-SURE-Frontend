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

const index = 9;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-YR96xpHP.js')).default;
const server_id = "src/routes/(authentication)/login/+page.server.ts";
const imports = ["_app/immutable/nodes/9.BXZFTbAr.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/xU7jw7XU.js","_app/immutable/chunks/DhSNEPDw.js","_app/immutable/chunks/DVtHS8ol.js","_app/immutable/chunks/C8tG8t5X.js","_app/immutable/chunks/Jhkhy7E3.js","_app/immutable/chunks/BG76zvuN.js","_app/immutable/chunks/ByI6iVq5.js","_app/immutable/chunks/CJ66PCUx.js","_app/immutable/chunks/BbooiKwf.js","_app/immutable/chunks/CftmxiRQ.js","_app/immutable/chunks/BPde4ukL.js","_app/immutable/chunks/D0iwhpLH.js","_app/immutable/chunks/BZHGrlEE.js","_app/immutable/chunks/BNC-bmXQ.js","_app/immutable/chunks/hUONLBj8.js","_app/immutable/chunks/Bt-Xh7oU.js","_app/immutable/chunks/DgX2KM8m.js","_app/immutable/chunks/DpjY2ypC.js","_app/immutable/chunks/LUVO2xEE.js","_app/immutable/chunks/C1FmrZbK.js","_app/immutable/chunks/COZ3s8UQ.js","_app/immutable/chunks/CD4Ar3Xi.js","_app/immutable/chunks/CzRDLKSN.js","_app/immutable/chunks/nxdkf_Tf.js","_app/immutable/chunks/bwStxD3u.js"];
const stylesheets = ["_app/immutable/assets/User.D5ff5RAM.css","_app/immutable/assets/Dictionary.DGG4D70t.css","_app/immutable/assets/9.CGr4IPog.css"];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=9-B_XwzbhS.js.map
