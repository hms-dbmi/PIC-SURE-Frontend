import { a as subscribe, l as is_promise, n as noop } from './lifecycle-DtuISP6h.js';
import { c as create_ssr_component, e as escape, v as validate_component } from './ssr-BRJpAXVH.js';
import { p as page } from './stores4-C3NPX6l0.js';
import './ProgressBar.svelte_svelte_type_style_lang-3a6XZCfa.js';
import { P as ProgressBar } from './ProgressBar-DwvUjrxy.js';
import { b as branding } from './configuration-BRozmRr_.js';
import { C as Content } from './Content-DMwoUi6K.js';
import { R as RoleForm } from './RoleForm-C3YXCUV6.js';
import { R as RoleStore } from './Roles-Dqc7AHOa.js';
import { P as PrivilegesStore } from './Privileges-Bs-kA03i.js';
import './client-BR749xJD.js';
import './exports-kR70XCWV.js';
import './index2-BVONNh3m.js';
import './AngleButton-C6YzBYNH.js';
import './stores2-Cy1ftf_v.js';
import './Validation-DXCOBx8m.js';
import './User-BiqhXRJx.js';
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
//# sourceMappingURL=_page.svelte-CetQ_efs.js.map
