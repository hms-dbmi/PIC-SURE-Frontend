import { r as redirect } from './index-DzcLzHBX.js';
import { f as features } from './configuration-B3dQYR0_.js';
import { i as isTokenExpired, u as user } from './User-DwYSDSFP.js';
import { b as browser } from './index3-C8Afr38c.js';
import { g as getAllProviderData } from './AuthProviderRegistry-DQ6xXw8B.js';
import './index2-CV6P_ZFI.js';
import './lifecycle-GVhEEkqU.js';
import './client-TAfaRk9z.js';
import './exports-CTha0ECg.js';
import './stores3-DsZ2QG0u.js';
import './prod-ssr-DxkyU4_t.js';

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
const component = async () => component_cache ??= (await import('./_layout.svelte-C6hL7pvd.js')).default;
const universal_id = "src/routes/(picsure)/+layout.ts";
const server_id = "src/routes/(picsure)/+layout.server.ts";
const imports = ["_app/immutable/nodes/5.77q6u0kW.js","_app/immutable/chunks/index.RDckgBtK.js","_app/immutable/chunks/entry.BzyMyMCS.js","_app/immutable/chunks/scheduler.bui7uCNy.js","_app/immutable/chunks/configuration.D7nHe1C4.js","_app/immutable/chunks/User.DxvYFzcG.js","_app/immutable/chunks/stores.WcJ0rjcA.js","_app/immutable/chunks/index.Bt-Xh7oU.js","_app/immutable/chunks/index.CNwEczq-.js","_app/immutable/chunks/codeBlocks.Dav8erH8.js","_app/immutable/chunks/CopyButton.8PIXlBbJ.js","_app/immutable/chunks/popup.C3QNdKz8.js","_app/immutable/chunks/ProgressBar.svelte_svelte_type_style_lang.DAEU1KBT.js","_app/immutable/chunks/stores.CGVgmJb2.js","_app/immutable/chunks/transitions.FXurGCgU.js","_app/immutable/chunks/index.D4B8xqkz.js","_app/immutable/chunks/Footer.q_S45mmV.js","_app/immutable/chunks/each.VHlBgARd.js","_app/immutable/chunks/stores.EYwnRdwT.js","_app/immutable/chunks/Logo.DwZyQt99.js","_app/immutable/chunks/AuthProviderRegistry.CoVZEDvP.js","_app/immutable/chunks/preload-helper.C1FmrZbK.js","_app/immutable/chunks/Export.mXxhtLBN.js","_app/immutable/chunks/await_block.B6WJ5gpV.js","_app/immutable/chunks/OptionsSelectionList.CL6EweHi.js","_app/immutable/chunks/ProgressRadial.CbTPnjvT.js","_app/immutable/chunks/Filter.C-osvDvX.js","_app/immutable/chunks/SNPFilter.DZVbFfXp.js","_app/immutable/chunks/QueryBuilder.CQd9tm7B.js","_app/immutable/chunks/AddFilter.CNkMDehf.js","_app/immutable/chunks/Row.CBmsuhWK.js","_app/immutable/chunks/dictionary.CWXs9J8o.js","_app/immutable/chunks/CardButton.Br5wRS_G.js","_app/immutable/chunks/SidePanel.B_LKE-yU.js","_app/immutable/chunks/ExportStepper.wuoyhiNJ.js","_app/immutable/chunks/AngleButton.DmvF9EC0.js","_app/immutable/chunks/Table.6dwzo0We.js","_app/immutable/chunks/UserToken.D7f26EUP.js","_app/immutable/chunks/ErrorAlert.VXgRa8sz.js","_app/immutable/chunks/_commonjsHelpers.Cpj98o6Y.js"];
const stylesheets = ["_app/immutable/assets/5.DaCZLeP_.css","_app/immutable/assets/ProgressBar.DVz1FANQ.css","_app/immutable/assets/Footer.Bq9_U1Kf.css","_app/immutable/assets/Logo.DVIg6BDV.css","_app/immutable/assets/OptionsSelectionList.CaaaFOu-.css","_app/immutable/assets/AddFilter.BenMoii_.css","_app/immutable/assets/Row.CVATQcd7.css","_app/immutable/assets/ExportStepper.DUxlTL12.css","_app/immutable/assets/Table.BZ0nK9bf.css","_app/immutable/assets/UserToken.Dz7rjtc7.css"];
const fonts = [];

export { component, fonts, imports, index, _layout_server_ts as server, server_id, stylesheets, _layout_ts as universal, universal_id };
//# sourceMappingURL=5-5l7mpmOP.js.map
