import { s as subscribe, e as is_promise, n as noop } from './utils-EiTRXYbg.js';
import { c as create_ssr_component, e as escape, v as validate_component } from './ssr-C099ZcAV.js';
import { p as page } from './stores3-BdNELvYD.js';
import './ProgressBar.svelte_svelte_type_style_lang-DykzLE77.js';
import { P as ProgressBar } from './ProgressBar-Dg8VUUsC.js';
import { b as branding } from './configuration-5_HU3Jec.js';
import { C as Content } from './Content-CtpYCKJp.js';
import { R as RoleForm } from './RoleForm-A02FpUEN.js';
import { R as RoleStore } from './Roles-DREcG-yb.js';
import { P as PrivilegesStore } from './Privileges-CP-P0XVS.js';
import './client-DpIAX_q0.js';
import './exports-BGi7-Rnc.js';
import './index2-Bx7ZSImw.js';
import './AngleButton-C0svtr3S.js';
import './stores2-DM9tzbse.js';
import './Validation-DXCOBx8m.js';
import './User-D2U6RL_p.js';
import './index-DzcLzHBX.js';

const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $page, $$unsubscribe_page;
  let $privilegeList, $$unsubscribe_privilegeList;
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  const { loadRoles, getRole } = RoleStore;
  const { privilegeList, loadPrivileges } = PrivilegesStore;
  $$unsubscribe_privilegeList = subscribe(privilegeList, (value) => $privilegeList = value);
  let role;
  async function load() {
    await loadRoles();
    role = await getRole($page.params.uuid);
    await loadPrivileges();
  }
  $$unsubscribe_page();
  $$unsubscribe_privilegeList();
  return `${$$result.head += `<!-- HEAD_svelte-45ifm1_START -->${$$result.title = `<title>${escape(branding.applicationName)} | Edit Role</title>`, ""}<!-- HEAD_svelte-45ifm1_END -->`, ""} ${validate_component(Content, "Content").$$render(
    $$result,
    {
      title: "Edit Role",
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
            return ` <section id="role-edit">${validate_component(RoleForm, "RoleForm").$$render($$result, { privilegeList: $privilegeList, role }, {}, {})}</section> `;
          }();
        }(load())}`;
      }
    }
  )}`;
});

export { Page as default };
//# sourceMappingURL=_page.svelte-CM8-PK4W.js.map
