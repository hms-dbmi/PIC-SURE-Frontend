import { s as subscribe, e as is_promise, n as noop } from './utils-EiTRXYbg.js';
import { c as create_ssr_component, e as escape, v as validate_component } from './ssr-C099ZcAV.js';
import { p as page } from './stores3-BdNELvYD.js';
import './ProgressBar.svelte_svelte_type_style_lang-DykzLE77.js';
import { P as ProgressBar } from './ProgressBar-Dg8VUUsC.js';
import { b as branding } from './configuration-5_HU3Jec.js';
import { C as Content } from './Content-CtpYCKJp.js';
import { R as RoleStore } from './Roles-DREcG-yb.js';
import { P as PrivilegesStore } from './Privileges-CP-P0XVS.js';
import './client-DpIAX_q0.js';
import './exports-BGi7-Rnc.js';
import './index2-Bx7ZSImw.js';
import './AngleButton-C0svtr3S.js';
import './User-D2U6RL_p.js';
import './index-DzcLzHBX.js';

const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $page, $$unsubscribe_page;
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  const { loadRoles, getRole } = RoleStore;
  const { loadPrivileges, getPrivilege } = PrivilegesStore;
  let role;
  let privileges;
  async function load() {
    await loadRoles();
    await loadPrivileges();
    role = await getRole($page.params.uuid);
    privileges = await Promise.all(role.privileges.map(getPrivilege));
  }
  $$unsubscribe_page();
  return `${$$result.head += `<!-- HEAD_svelte-72v14l_START -->${$$result.title = `<title>${escape(branding.applicationName)} | Role Summary</title>`, ""}<!-- HEAD_svelte-72v14l_END -->`, ""} ${validate_component(Content, "Content").$$render(
    $$result,
    {
      title: "Role Summary",
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
            return ` <section id="role-view"><table class="table bg-transparent"><tr><td data-svelte-h="svelte-czj0bp">ID:</td> <td>${escape(role.uuid)}</td></tr> <tr><td data-svelte-h="svelte-1h12c2b">Name:</td> <td>${escape(role.name)}</td></tr> <tr><td data-svelte-h="svelte-9t1c8u">Description:</td> <td>${escape(role.description)}</td></tr> <tr><td data-svelte-h="svelte-bu3atw">Privileges:</td> <td>${escape(privileges.map((p) => p.name).join(", "))}</td></tr></table></section> `;
          }();
        }(load())}`;
      }
    }
  )}`;
});

export { Page as default };
//# sourceMappingURL=_page.svelte-CZPtqAji.js.map
