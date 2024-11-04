import { a as subscribe, m as is_promise, n as noop } from './lifecycle-GVhEEkqU.js';
import { c as create_ssr_component, e as escape, v as validate_component } from './ssr-Di-o4HBA.js';
import { p as page } from './stores3-DsZ2QG0u.js';
import './ProgressBar.svelte_svelte_type_style_lang-D52eF_WP.js';
import { P as ProgressBar } from './ProgressBar-BKXHCANO.js';
import { b as branding } from './configuration-CHJZnZTS.js';
import { C as Content } from './Content-BUgV6smf.js';
import { R as RoleForm } from './RoleForm-BHI-CCwn.js';
import { R as RoleStore } from './Roles-CfgEvBZ_.js';
import { P as PrivilegesStore } from './Privileges-jkKxsELb.js';
import './client-TAfaRk9z.js';
import './exports-CTha0ECg.js';
import './index2-CV6P_ZFI.js';
import './AngleButton-Cxjzo9QZ.js';
import './stores2-DrFt-twL.js';
import './Validation-DXCOBx8m.js';
import './User-BLfUZEEV.js';
import './index-CvuFLVuQ.js';

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
//# sourceMappingURL=_page.svelte-X4vxy5St.js.map
