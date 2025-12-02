import '@sveltejs/kit';
import './configuration-BAm0JRx1.js';
import './User-CeJunCPd.js';
import { g as getAllProviderData } from './AuthProviderRegistry-DQ6xXw8B.js';
import './utils-D3IkxnGP.js';
import './index-C9dy-hDW.js';
import './client2-BVaV_p61.js';
import '@sveltejs/kit/internal';
import './index2-CFqWCRce.js';

const load$1 = async ({ url, fetch }) => {
};

var _layout_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load$1
});

const load = async () => {
  const providers = getAllProviderData();
  return {
    providers
  };
};

var _layout_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 0;
let component_cache;
const component = async () => component_cache ??= (await import('./_layout.svelte-BSu76MlH.js')).default;
const universal_id = "src/routes/+layout.ts";
const server_id = "src/routes/+layout.server.ts";
const imports = ["_app/immutable/nodes/0.YXH0YsHi.js","_app/immutable/chunks/hUONLBj8.js","_app/immutable/chunks/D0iwhpLH.js","_app/immutable/chunks/BZHGrlEE.js","_app/immutable/chunks/BNC-bmXQ.js","_app/immutable/chunks/xU7jw7XU.js","_app/immutable/chunks/DhSNEPDw.js","_app/immutable/chunks/DVtHS8ol.js","_app/immutable/chunks/C8tG8t5X.js","_app/immutable/chunks/BPde4ukL.js","_app/immutable/chunks/CftmxiRQ.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/Bt-Xh7oU.js","_app/immutable/chunks/COZ3s8UQ.js","_app/immutable/chunks/BG76zvuN.js","_app/immutable/chunks/CJ66PCUx.js"];
const stylesheets = ["_app/immutable/assets/User.D5ff5RAM.css","_app/immutable/assets/0.CI8uozRc.css"];
const fonts = ["_app/immutable/assets/fa-brands-400.D_cYUPeE.woff2","_app/immutable/assets/fa-brands-400.D1LuMI3I.ttf","_app/immutable/assets/fa-regular-400.BjRzuEpd.woff2","_app/immutable/assets/fa-regular-400.DZaxPHgR.ttf","_app/immutable/assets/fa-solid-900.CTAAxXor.woff2","_app/immutable/assets/fa-solid-900.D0aA9rwL.ttf","_app/immutable/assets/fa-v4compatibility.C9RhG_FT.woff2","_app/immutable/assets/fa-v4compatibility.CCth-dXg.ttf"];

export { component, fonts, imports, index, _layout_server_ts as server, server_id, stylesheets, _layout_ts as universal, universal_id };
//# sourceMappingURL=0-Bmj96gVW.js.map
