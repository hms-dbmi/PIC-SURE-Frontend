import { a as subscribe, l as is_promise, n as noop } from './lifecycle-DtuISP6h.js';
import { c as create_ssr_component, e as escape, v as validate_component } from './ssr-BRJpAXVH.js';
import { p as page } from './stores4-B2YFsTYy.js';
import './ProgressBar.svelte_svelte_type_style_lang-3a6XZCfa.js';
import { P as ProgressBar } from './ProgressBar-DwvUjrxy.js';
import { b as branding } from './configuration-zUcJ0Kpb.js';
import { C as Content } from './Content-D53qfAxy.js';
import { U as UsersStore, C as ConnectionsStore } from './Connections-BXXlNWz7.js';
import { R as RoleStore } from './Roles-BFvyema1.js';
import './client-TAfaRk9z.js';
import './exports-CTha0ECg.js';
import './index2-BVONNh3m.js';
import './AngleButton-C6YzBYNH.js';
import './User-Dh89vg_C.js';
import './index-CvuFLVuQ.js';

const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $page, $$unsubscribe_page;
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  const { loadUsers, getUser } = UsersStore;
  const { getRole } = RoleStore;
  const { getConnection } = ConnectionsStore;
  let user;
  let roles;
  let connection;
  async function load() {
    await loadUsers();
    user = await getUser($page.params.uuid);
    connection = await getConnection(user.connection) || "";
    roles = await Promise.all(user.roles.map(getRole));
  }
  $$unsubscribe_page();
  return `${$$result.head += `<!-- HEAD_svelte-mtqxya_START -->${$$result.title = `<title>${escape(branding.applicationName)} | User Summary</title>`, ""}<!-- HEAD_svelte-mtqxya_END -->`, ""} ${validate_component(Content, "Content").$$render(
    $$result,
    {
      title: "User Summary",
      backUrl: "/admin/users",
      backTitle: "Back to Users"
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
            return ` <section id="role-view"><table class="table bg-transparent"><tr><td data-svelte-h="svelte-s62l6t">Id:</td> <td>${escape(user.uuid)}</td></tr> <tr><td data-svelte-h="svelte-1aqbduw">Email:</td> <td>${escape(user.email)}</td></tr> <tr><td data-svelte-h="svelte-l7nagq">Active:</td> <td>${escape(user.active)}</td></tr> ${user.subject ? `<tr><td data-svelte-h="svelte-1kscmm0">Subject:</td> <td>${escape(user.subject)}</td></tr>` : ``} <tr><td data-svelte-h="svelte-1o2bwbo">Connection:</td> <td>${escape(typeof connection !== "string" ? connection.label : user.connection)}</td></tr> <tr><td data-svelte-h="svelte-eum8k3">Roles:</td> <td>${escape(roles.map((p) => p.name).join(", "))}</td></tr></table></section> `;
          }();
        }(load())}`;
      }
    }
  )}`;
});

export { Page as default };
//# sourceMappingURL=_page.svelte-CDmt5wU8.js.map
