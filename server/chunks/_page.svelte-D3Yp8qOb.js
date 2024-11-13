import { a as subscribe, m as is_promise, n as noop } from './lifecycle-GVhEEkqU.js';
import { c as create_ssr_component, e as escape, v as validate_component } from './ssr-Di-o4HBA.js';
import './ProgressBar.svelte_svelte_type_style_lang-D52eF_WP.js';
import { P as ProgressBar } from './ProgressBar-BKXHCANO.js';
import { b as branding } from './configuration-B3dQYR0_.js';
import { C as Content } from './Content-BUgV6smf.js';
import { R as RoleForm } from './RoleForm-C8ng6q8M.js';
import { P as PrivilegesStore } from './Privileges-CHGFe2Ry.js';
import './index2-CV6P_ZFI.js';
import './AngleButton-Cxjzo9QZ.js';
import './client-TAfaRk9z.js';
import './exports-CTha0ECg.js';
import './stores2-DrFt-twL.js';
import './Validation-DXCOBx8m.js';
import './Roles-DfgD0zyS.js';
import './User-DwYSDSFP.js';
import './index-DzcLzHBX.js';
import './stores3-DsZ2QG0u.js';

const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $privilegeList, $$unsubscribe_privilegeList;
  const { privilegeList, loadPrivileges } = PrivilegesStore;
  $$unsubscribe_privilegeList = subscribe(privilegeList, (value) => $privilegeList = value);
  $$unsubscribe_privilegeList();
  return `${$$result.head += `<!-- HEAD_svelte-1qrv63f_START -->${$$result.title = `<title>${escape(branding.applicationName)} | New Role</title>`, ""}<!-- HEAD_svelte-1qrv63f_END -->`, ""} ${validate_component(Content, "Content").$$render(
    $$result,
    {
      title: "New Role",
      backUrl: "/admin/authorization",
      backTitle: "Back to Authorization"
    },
    {},
    {
      default: () => {
        return `${function(__value) {
          if (is_promise(__value)) {
            __value.then(null, noop);
            return ` <h3 class="text-left" data-svelte-h="svelte-16fo5h6">Loading</h3> ${validate_component(ProgressBar, "ProgressBar").$$render($$result, { animIndeterminate: "anim-progress-bar" }, {}, {})} `;
          }
          return function() {
            return ` <section id="role-new">${validate_component(RoleForm, "RoleForm").$$render($$result, { privilegeList: $privilegeList }, {}, {})}</section> `;
          }();
        }(loadPrivileges())}`;
      }
    }
  )}`;
});

export { Page as default };
//# sourceMappingURL=_page.svelte-D3Yp8qOb.js.map
