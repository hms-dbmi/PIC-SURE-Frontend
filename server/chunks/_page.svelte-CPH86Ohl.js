import { a as subscribe, l as is_promise, n as noop } from './lifecycle-DtuISP6h.js';
import { c as create_ssr_component, e as escape, v as validate_component } from './ssr-BRJpAXVH.js';
import { p as page } from './stores4-B2YFsTYy.js';
import './ProgressBar.svelte_svelte_type_style_lang-3a6XZCfa.js';
import { P as ProgressBar } from './ProgressBar-DwvUjrxy.js';
import { b as branding } from './configuration-zUcJ0Kpb.js';
import { C as Content } from './Content-D53qfAxy.js';
import { R as RoleStore } from './Roles-BFvyema1.js';
import { P as PrivilegesStore } from './Privileges-CoWiNxg3.js';
import './client-TAfaRk9z.js';
import './exports-CTha0ECg.js';
import './index2-BVONNh3m.js';
import './AngleButton-C6YzBYNH.js';
import './User-Dh89vg_C.js';
import './index-CvuFLVuQ.js';

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
//# sourceMappingURL=_page.svelte-CPH86Ohl.js.map
