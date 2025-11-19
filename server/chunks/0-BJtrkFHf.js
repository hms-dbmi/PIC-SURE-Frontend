import '@sveltejs/kit';
import './configuration-CBIXsjx2.js';
import './User-01eW3TFo.js';
import { g as getAllProviderData } from './AuthProviderRegistry-DQ6xXw8B.js';
import './utils-B7NzVBxP.js';
import './index-DMPVr6nO.js';
import './client2-DxcZr6Tp.js';
import '@sveltejs/kit/internal';
import './index2-Bp7szfwE.js';

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
const component = async () => component_cache ??= (await import('./_layout.svelte-CuaDmd7x.js')).default;
const universal_id = "src/routes/+layout.ts";
const server_id = "src/routes/+layout.server.ts";
const imports = ["_app/immutable/nodes/0.BEoKxUSe.js","_app/immutable/chunks/hUONLBj8.js","_app/immutable/chunks/D0iwhpLH.js","_app/immutable/chunks/BOAiLg0g.js","_app/immutable/chunks/M2p3ZkHt.js","_app/immutable/chunks/xU7jw7XU.js","_app/immutable/chunks/DhSNEPDw.js","_app/immutable/chunks/DVtHS8ol.js","_app/immutable/chunks/C8tG8t5X.js","_app/immutable/chunks/Dkbkn6HV.js","_app/immutable/chunks/Jem-ehAR.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/Bt-Xh7oU.js","_app/immutable/chunks/COZ3s8UQ.js","_app/immutable/chunks/BG76zvuN.js"];
const stylesheets = ["_app/immutable/assets/User.D5ff5RAM.css","_app/immutable/assets/0.CI8uozRc.css"];
const fonts = ["_app/immutable/assets/fa-brands-400.D_cYUPeE.woff2","_app/immutable/assets/fa-brands-400.D1LuMI3I.ttf","_app/immutable/assets/fa-regular-400.BjRzuEpd.woff2","_app/immutable/assets/fa-regular-400.DZaxPHgR.ttf","_app/immutable/assets/fa-solid-900.CTAAxXor.woff2","_app/immutable/assets/fa-solid-900.D0aA9rwL.ttf","_app/immutable/assets/fa-v4compatibility.C9RhG_FT.woff2","_app/immutable/assets/fa-v4compatibility.CCth-dXg.ttf"];

export { component, fonts, imports, index, _layout_server_ts as server, server_id, stylesheets, _layout_ts as universal, universal_id };
//# sourceMappingURL=0-BJtrkFHf.js.map
