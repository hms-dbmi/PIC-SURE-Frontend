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
const component = async () => component_cache ??= (await import('./_page.svelte-CFO9pIWA.js')).default;
const server_id = "src/routes/(authentication)/login/+page.server.ts";
const imports = ["_app/immutable/nodes/9.ClEH4m3G.js","_app/immutable/chunks/CtfeAAbw.js","_app/immutable/chunks/B4GrenNm.js","_app/immutable/chunks/DlIBaGjY.js","_app/immutable/chunks/DxSOTiY2.js","_app/immutable/chunks/D7VV4X-8.js","_app/immutable/chunks/bf3FOAR_.js","_app/immutable/chunks/CSsnQ7i2.js","_app/immutable/chunks/BdG0KSB2.js","_app/immutable/chunks/BPiAbArq.js","_app/immutable/chunks/C4-uZRU6.js","_app/immutable/chunks/BCz5OXXD.js","_app/immutable/chunks/DRUiW6Zw.js","_app/immutable/chunks/CsA2x4iF.js","_app/immutable/chunks/CYgJF_JY.js","_app/immutable/chunks/CHRSknKA.js","_app/immutable/chunks/yAhaO9Md.js","_app/immutable/chunks/PD1Wq3xD.js","_app/immutable/chunks/Bt-Xh7oU.js","_app/immutable/chunks/BeImZ7I_.js","_app/immutable/chunks/DvPjbdiY.js","_app/immutable/chunks/CEVJ7K31.js","_app/immutable/chunks/BBo6I-Ix.js","_app/immutable/chunks/C1FmrZbK.js","_app/immutable/chunks/BtrPhJEK.js","_app/immutable/chunks/IdnDkL5k.js","_app/immutable/chunks/BVg5wqNm.js","_app/immutable/chunks/BWMYve5J.js","_app/immutable/chunks/B7pZD2Tm.js"];
const stylesheets = ["_app/immutable/assets/User.DXh0bXFJ.css","_app/immutable/assets/Dictionary.C_-Gj36F.css","_app/immutable/assets/9.CB9hl8xZ.css"];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=9-CIhbXmk4.js.map
