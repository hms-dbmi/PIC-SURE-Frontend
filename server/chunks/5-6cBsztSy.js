import { r as redirect } from './index-DzcLzHBX.js';
import { f as features } from './configuration-CJ60Yp9o.js';
import { i as isTokenExpired, u as user } from './User-DLjB6rDR.js';
import { b as browser } from './index3-CbPqsRYI.js';
import { g as getAllProviderData } from './AuthProviderRegistry-DQ6xXw8B.js';
import './index2-BVONNh3m.js';
import './lifecycle-DtuISP6h.js';
import './client-BR749xJD.js';
import './exports-kR70XCWV.js';
import './stores4-C3NPX6l0.js';
import './false-CRHihH2U.js';

const load$1 = ({ url }) => {
  if (!features.login.open && browser && (!localStorage.getItem("token") || isTokenExpired(localStorage.getItem("token") || ""))) {
    user.set({});
    throw redirect(302, `/login?redirectTo=${url.pathname}`);
  }
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

const index = 5;
let component_cache;
const component = async () => component_cache ??= (await import('./_layout.svelte-BwN0HwDt.js')).default;
const universal_id = "src/routes/(picsure)/+layout.ts";
const server_id = "src/routes/(picsure)/+layout.server.ts";
const imports = ["_app/immutable/nodes/5.4GIUUS78.js","_app/immutable/chunks/BdhbO9MB.js","_app/immutable/chunks/ClzUMQ0P.js","_app/immutable/chunks/CDvIr29H.js","_app/immutable/chunks/Di2X-GR-.js","_app/immutable/chunks/BEf3cR2P.js","_app/immutable/chunks/BYEsVfC0.js","_app/immutable/chunks/Bt-Xh7oU.js","_app/immutable/chunks/ByE-_V18.js","_app/immutable/chunks/CgU5AtxT.js","_app/immutable/chunks/DPeOhoNv.js","_app/immutable/chunks/DOV-xyFJ.js","_app/immutable/chunks/evP0TUj8.js","_app/immutable/chunks/4MwYNI-R.js","_app/immutable/chunks/BszA2q6R.js","_app/immutable/chunks/DYMkpHtv.js","_app/immutable/chunks/FXurGCgU.js","_app/immutable/chunks/DRE3Lf26.js","_app/immutable/chunks/D0QH3NT1.js","_app/immutable/chunks/UPDULkoE.js","_app/immutable/chunks/mmDljT_r.js","_app/immutable/chunks/BpCLhCzN.js","_app/immutable/chunks/RqbRZT9a.js","_app/immutable/chunks/BjYfhs4G.js","_app/immutable/chunks/CNSnqmgY.js","_app/immutable/chunks/CeoJdS-C.js","_app/immutable/chunks/C1FmrZbK.js","_app/immutable/chunks/CcXNpHEf.js","_app/immutable/chunks/BJ-g7xSB.js","_app/immutable/chunks/BRd0ga1M.js","_app/immutable/chunks/DvF23Exx.js","_app/immutable/chunks/Bq_4NOFD.js","_app/immutable/chunks/CQG7Hqyb.js","_app/immutable/chunks/DMy9hZg4.js","_app/immutable/chunks/CMZPebYK.js","_app/immutable/chunks/o1WbVMGB.js","_app/immutable/chunks/BgFwHOmu.js","_app/immutable/chunks/BzYLfMT5.js","_app/immutable/chunks/CfB1CGkb.js","_app/immutable/chunks/DM6fdRU2.js","_app/immutable/chunks/DSNfWxqp.js","_app/immutable/chunks/BiPL43FU.js","_app/immutable/chunks/O_-Yg511.js","_app/immutable/chunks/CjJvbZ1d.js","_app/immutable/chunks/Cpj98o6Y.js"];
const stylesheets = ["_app/immutable/assets/5.DaCZLeP_.css","_app/immutable/assets/ProgressBar.DVz1FANQ.css","_app/immutable/assets/Footer.Bq9_U1Kf.css","_app/immutable/assets/Logo.DVIg6BDV.css","_app/immutable/assets/OptionsSelectionList.CaaaFOu-.css","_app/immutable/assets/AddFilter.BenMoii_.css","_app/immutable/assets/Pagination.CSdchOBD.css","_app/immutable/assets/ExportStepper.DdL848Ly.css","_app/immutable/assets/Table.D4lXsFHR.css","_app/immutable/assets/UserToken.Dz7rjtc7.css"];
const fonts = [];

export { component, fonts, imports, index, _layout_server_ts as server, server_id, stylesheets, _layout_ts as universal, universal_id };
//# sourceMappingURL=5-6cBsztSy.js.map
