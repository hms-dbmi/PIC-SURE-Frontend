import { a as subscribe, m as is_promise, n as noop } from './lifecycle-GVhEEkqU.js';
import { c as create_ssr_component, e as escape, v as validate_component } from './ssr-Di-o4HBA.js';
import { p as page } from './stores3-DsZ2QG0u.js';
import './ProgressBar.svelte_svelte_type_style_lang-D52eF_WP.js';
import { P as ProgressBar } from './ProgressBar-BKXHCANO.js';
import { b as branding } from './configuration-B3dQYR0_.js';
import { C as Content } from './Content-BUgV6smf.js';
import { R as RoleStore } from './Roles-DfgD0zyS.js';
import { P as PrivilegesStore } from './Privileges-CHGFe2Ry.js';
import './client-TAfaRk9z.js';
import './exports-CTha0ECg.js';
import './index2-CV6P_ZFI.js';
import './AngleButton-Cxjzo9QZ.js';
import './User-DwYSDSFP.js';
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
//# sourceMappingURL=_page.svelte-DgteCb2k.js.map
