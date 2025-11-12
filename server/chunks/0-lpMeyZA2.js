import '@sveltejs/kit';
import './configuration-wjj69jIJ.js';
import './User-CGCqDR6a.js';
import { g as getAllProviderData } from './AuthProviderRegistry-DQ6xXw8B.js';
import './utils-Dn8W3aSK.js';
import './index-BYsoXH7a.js';
import './client2-2LGcfZLB.js';
import '@sveltejs/kit/internal';
import './index2-DXnmzf54.js';

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
const component = async () => component_cache ??= (await import('./_layout.svelte-q93uUbBF.js')).default;
const universal_id = "src/routes/+layout.ts";
const server_id = "src/routes/+layout.server.ts";
const imports = ["_app/immutable/nodes/0.Dw9uu-IO.js","_app/immutable/chunks/hUONLBj8.js","_app/immutable/chunks/D0iwhpLH.js","_app/immutable/chunks/i859GThY.js","_app/immutable/chunks/tvkVmxlD.js","_app/immutable/chunks/B9BhT3Ut.js","_app/immutable/chunks/pV5yBOfK.js","_app/immutable/chunks/D3FUfhzK.js","_app/immutable/chunks/CPDBQclr.js","_app/immutable/chunks/BLfKYx2_.js","_app/immutable/chunks/B9OKY7FI.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/Bt-Xh7oU.js","_app/immutable/chunks/COZ3s8UQ.js","_app/immutable/chunks/BAa5cEXk.js","_app/immutable/chunks/B3YVaWvx.js"];
const stylesheets = ["_app/immutable/assets/User.D5ff5RAM.css","_app/immutable/assets/0.CVbaVk9f.css"];
const fonts = ["_app/immutable/assets/fa-brands-400.D_cYUPeE.woff2","_app/immutable/assets/fa-brands-400.D1LuMI3I.ttf","_app/immutable/assets/fa-regular-400.BjRzuEpd.woff2","_app/immutable/assets/fa-regular-400.DZaxPHgR.ttf","_app/immutable/assets/fa-solid-900.CTAAxXor.woff2","_app/immutable/assets/fa-solid-900.D0aA9rwL.ttf","_app/immutable/assets/fa-v4compatibility.C9RhG_FT.woff2","_app/immutable/assets/fa-v4compatibility.CCth-dXg.ttf"];

export { component, fonts, imports, index, _layout_server_ts as server, server_id, stylesheets, _layout_ts as universal, universal_id };
//# sourceMappingURL=0-lpMeyZA2.js.map
