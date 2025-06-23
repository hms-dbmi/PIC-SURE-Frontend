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
const component = async () => component_cache ??= (await import('./_page.svelte-CEdqMPHz.js')).default;
const server_id = "src/routes/(authentication)/login/+page.server.ts";
const imports = ["_app/immutable/nodes/8.B0qwvKfb.js","_app/immutable/chunks/DKNWTM-D.js","_app/immutable/chunks/KPVYLOSR.js","_app/immutable/chunks/DpyMT7OB.js","_app/immutable/chunks/NtGCh5xy.js","_app/immutable/chunks/DXJ436YI.js","_app/immutable/chunks/CDCmQmr-.js","_app/immutable/chunks/B5lqQSsR.js","_app/immutable/chunks/Be_LeCLl.js","_app/immutable/chunks/nsQMHjqs.js","_app/immutable/chunks/BwVKHEJU.js","_app/immutable/chunks/B2Bg6RTa.js","_app/immutable/chunks/DjiALQWk.js","_app/immutable/chunks/DNfOBMJV.js","_app/immutable/chunks/BD7x6Jnt.js","_app/immutable/chunks/CWjZNTTC.js","_app/immutable/chunks/DCY6c1ra.js","_app/immutable/chunks/Bu63eCiy.js","_app/immutable/chunks/CfrH0FQi.js","_app/immutable/chunks/CmhHF9t-.js","_app/immutable/chunks/C1FmrZbK.js","_app/immutable/chunks/BPGq02fb.js","_app/immutable/chunks/DTPmYdw_.js","_app/immutable/chunks/P3bGLiu7.js","_app/immutable/chunks/kg2g7Go4.js","_app/immutable/chunks/BW_ShK1N.js","_app/immutable/chunks/CMFSw6mp.js"];
const stylesheets = ["_app/immutable/assets/Tooltip.DXh0bXFJ.css","_app/immutable/assets/Dictionary.C_-Gj36F.css","_app/immutable/assets/8.CB9hl8xZ.css"];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=8--rEB5VaX.js.map
