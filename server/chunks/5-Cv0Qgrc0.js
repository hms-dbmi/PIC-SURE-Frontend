import { r as redirect } from './index-DzcLzHBX.js';
import { f as features } from './configuration-BRozmRr_.js';
import { i as isTokenExpired, u as user } from './User-BiqhXRJx.js';
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
const component = async () => component_cache ??= (await import('./_layout.svelte-zeG94R4z.js')).default;
const universal_id = "src/routes/(picsure)/+layout.ts";
const server_id = "src/routes/(picsure)/+layout.server.ts";
const imports = ["_app/immutable/nodes/5.EDAhRD9J.js","_app/immutable/chunks/BMXiGua7.js","_app/immutable/chunks/DbCUu2ok.js","_app/immutable/chunks/ms4W0FFX.js","_app/immutable/chunks/DtgW4YdH.js","_app/immutable/chunks/Mlk3P4MA.js","_app/immutable/chunks/DJNTpv-S.js","_app/immutable/chunks/Bt-Xh7oU.js","_app/immutable/chunks/Dic8leaQ.js","_app/immutable/chunks/CZo8xcKQ.js","_app/immutable/chunks/D-Fh3BOg.js","_app/immutable/chunks/CyU2ApvK.js","_app/immutable/chunks/DXYyDbgV.js","_app/immutable/chunks/DPXl_zux.js","_app/immutable/chunks/CNVevkUA.js","_app/immutable/chunks/FXurGCgU.js","_app/immutable/chunks/Bc1452Xg.js","_app/immutable/chunks/D0QH3NT1.js","_app/immutable/chunks/qZoVHSKs.js","_app/immutable/chunks/CGEKtPRW.js","_app/immutable/chunks/Chejunr_.js","_app/immutable/chunks/CgVvlcVD.js","_app/immutable/chunks/DOLMvtmf.js","_app/immutable/chunks/C1FmrZbK.js","_app/immutable/chunks/CsIFIBo4.js","_app/immutable/chunks/DwhXHaxl.js","_app/immutable/chunks/p31sxE8M.js","_app/immutable/chunks/DvF23Exx.js","_app/immutable/chunks/C-_8pOTT.js","_app/immutable/chunks/CogeFkuM.js","_app/immutable/chunks/EjM2LYay.js","_app/immutable/chunks/Dtgb29oS.js","_app/immutable/chunks/CAZLaZaf.js","_app/immutable/chunks/BRyMNWTL.js","_app/immutable/chunks/DTdbEHrg.js","_app/immutable/chunks/C5bVM5mj.js","_app/immutable/chunks/ZHaJR6_M.js","_app/immutable/chunks/NZH_emzZ.js","_app/immutable/chunks/DZDLcI0b.js","_app/immutable/chunks/CFuEX8XF.js","_app/immutable/chunks/CV_55p54.js","_app/immutable/chunks/BNXs1SYO.js","_app/immutable/chunks/Cpj98o6Y.js"];
const stylesheets = ["_app/immutable/assets/5.DaCZLeP_.css","_app/immutable/assets/ProgressBar.DVz1FANQ.css","_app/immutable/assets/Footer.Bq9_U1Kf.css","_app/immutable/assets/Logo.DVIg6BDV.css","_app/immutable/assets/OptionsSelectionList.CaaaFOu-.css","_app/immutable/assets/AddFilter.BenMoii_.css","_app/immutable/assets/Row.CVATQcd7.css","_app/immutable/assets/ExportStepper.DF9I7j8o.css","_app/immutable/assets/Table.mLdLB0VW.css","_app/immutable/assets/UserToken.Dz7rjtc7.css"];
const fonts = [];

export { component, fonts, imports, index, _layout_server_ts as server, server_id, stylesheets, _layout_ts as universal, universal_id };
//# sourceMappingURL=5-Cv0Qgrc0.js.map
