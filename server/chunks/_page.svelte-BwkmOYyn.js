import { a as subscribe, l as is_promise, n as noop } from './lifecycle-DtuISP6h.js';
import { c as create_ssr_component, e as escape, v as validate_component } from './ssr-BRJpAXVH.js';
import './ProgressBar.svelte_svelte_type_style_lang-3a6XZCfa.js';
import { P as ProgressBar } from './ProgressBar-DwvUjrxy.js';
import { b as branding } from './configuration-Bm4Mu1_g.js';
import { C as Content } from './Content-DMwoUi6K.js';
import { R as RoleForm } from './RoleForm-DQ1XHOAP.js';
import { P as PrivilegesStore } from './Privileges-C5IyGZZ5.js';
import './index2-BVONNh3m.js';
import './AngleButton-C6YzBYNH.js';
import './client-BR749xJD.js';
import './exports-kR70XCWV.js';
import './stores2-Cy1ftf_v.js';
import './Roles-qC0hIO7F.js';
import './User-Cv0Sr19m.js';
import './index-CvuFLVuQ.js';
import './stores4-C3NPX6l0.js';

const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $privilegeList, $$unsubscribe_privilegeList;
  const { privilegeList, loadPrivileges } = PrivilegesStore;
  $$unsubscribe_privilegeList = subscribe(privilegeList, (value) => $privilegeList = value);
  $$unsubscribe_privilegeList();
  return `${$$result.head += `<!-- HEAD_svelte-1qrv63f_START -->${$$result.title = `<title>${escape(branding.applicationName)} | New Role</title>`, ""}<!-- HEAD_svelte-1qrv63f_END -->`, ""} ${validate_component(Content, "Content").$$render(
    $$result,
    {
      title: "New Role",
      backUrl: "/admin/configuration",
      backTitle: "Back to Configuration"
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
//# sourceMappingURL=_page.svelte-BwkmOYyn.js.map
