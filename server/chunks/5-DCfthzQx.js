import { r as redirect } from './index-DzcLzHBX.js';
import { f as features } from './configuration-5_HU3Jec.js';
import { i as isTokenExpired } from './User-D2U6RL_p.js';
import { b as browser } from './index3-C8Afr38c.js';
import './index2-Bx7ZSImw.js';
import './utils-EiTRXYbg.js';
import './client-DpIAX_q0.js';
import './exports-BGi7-Rnc.js';
import './prod-ssr-DxkyU4_t.js';

const load = ({ url }) => {
  if (!features.login.open && browser && (!localStorage.getItem("token") || isTokenExpired(localStorage.getItem("token") || ""))) {
    throw redirect(302, `/login?redirectTo=${url.pathname}`);
  }
};

var _layout_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 5;
let component_cache;
const component = async () => component_cache ??= (await import('./_layout.svelte-C8lNfLtm.js')).default;
const universal_id = "src/routes/(picsure)/+layout.ts";
const imports = ["_app/immutable/nodes/5.BqL4t0xh.js","_app/immutable/chunks/index.CJi4hZKd.js","_app/immutable/chunks/entry.D9nKiiu7.js","_app/immutable/chunks/scheduler.bui7uCNy.js","_app/immutable/chunks/configuration.CIpdfyUx.js","_app/immutable/chunks/User.D1BG6p9P.js","_app/immutable/chunks/stores.CGSu9-ky.js","_app/immutable/chunks/index.Bt-Xh7oU.js","_app/immutable/chunks/index.Divvo4fc.js","_app/immutable/chunks/CodeBlock.iEDhD8KX.js","_app/immutable/chunks/CopyButton.BNNi8mRq.js","_app/immutable/chunks/popup.SGhM0iEx.js","_app/immutable/chunks/ProgressBar.svelte_svelte_type_style_lang.B7SkmbeT.js","_app/immutable/chunks/stores.CsbPyROH.js","_app/immutable/chunks/AddFilter.DKqbiERy.js","_app/immutable/chunks/OptionsSelectionList.qVZJIXX4.js","_app/immutable/chunks/each.Ct-HShz-.js","_app/immutable/chunks/ProgressRadial.CtNAsR5Q.js","_app/immutable/chunks/Filter.BoavJqGc.js","_app/immutable/chunks/Row.B9Nl9j0R.js","_app/immutable/chunks/index.D4B8xqkz.js","_app/immutable/chunks/stores.ClIv_1MU.js","_app/immutable/chunks/dictionary.81xI9LLS.js","_app/immutable/chunks/Logo.BzMTzviT.js","_app/immutable/chunks/Export.CC8Iq2Jz.js","_app/immutable/chunks/await_block.DenEio6G.js","_app/immutable/chunks/SNPFilter.i8u2Z8QA.js","_app/immutable/chunks/QueryBuilder.D0GTx0p-.js","_app/immutable/chunks/CardButton.Dg6cVRuf.js","_app/immutable/chunks/SidePanel.P7QvXKLj.js","_app/immutable/chunks/ExportStepper.xafGb6Pe.js","_app/immutable/chunks/AngleButton.Fz8rojsH.js","_app/immutable/chunks/Table.BpsTUvy6.js","_app/immutable/chunks/UserToken.Cp9kT_qm.js","_app/immutable/chunks/ErrorAlert.Bn1vPw-K.js","_app/immutable/chunks/Footer.DxzrHmJR.js","_app/immutable/chunks/_commonjsHelpers.Cpj98o6Y.js"];
const stylesheets = ["_app/immutable/assets/5.DBa2URDD.css","_app/immutable/assets/ProgressBar.BNOpJ5it.css","_app/immutable/assets/AddFilter.w0npkmpW.css","_app/immutable/assets/OptionsSelectionList.D-6RNjhU.css","_app/immutable/assets/Row.DSoFQOOZ.css","_app/immutable/assets/Logo.CJ2CJIMx.css","_app/immutable/assets/ExportStepper.B4y2qB0F.css","_app/immutable/assets/Table.Vm3C8nKw.css","_app/immutable/assets/UserToken.B9D0wnKw.css","_app/immutable/assets/Footer.iVZ5XeGQ.css"];
const fonts = [];

export { component, fonts, imports, index, stylesheets, _layout_ts as universal, universal_id };
//# sourceMappingURL=5-DCfthzQx.js.map
