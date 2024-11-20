import { a as subscribe, l as is_promise, n as noop } from './lifecycle-DtuISP6h.js';
import { c as create_ssr_component, e as escape, v as validate_component } from './ssr-BRJpAXVH.js';
import { p as page } from './stores4-B2YFsTYy.js';
import './ProgressBar.svelte_svelte_type_style_lang-3a6XZCfa.js';
import { P as ProgressBar } from './ProgressBar-DwvUjrxy.js';
import { b as branding } from './configuration-zUcJ0Kpb.js';
import { C as Content } from './Content-D53qfAxy.js';
import { R as RoleForm } from './RoleForm-DHPAyWfA.js';
import { R as RoleStore } from './Roles-BFvyema1.js';
import { P as PrivilegesStore } from './Privileges-CoWiNxg3.js';
import './client-TAfaRk9z.js';
import './exports-CTha0ECg.js';
import './index2-BVONNh3m.js';
import './AngleButton-C6YzBYNH.js';
import './stores2-Cy1ftf_v.js';
import './Validation-DXCOBx8m.js';
import './User-Dh89vg_C.js';
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
//# sourceMappingURL=_page.svelte-BRXwAfTG.js.map
