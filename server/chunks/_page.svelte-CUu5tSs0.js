import { a as subscribe, l as is_promise, n as noop } from './lifecycle-DtuISP6h.js';
import { c as create_ssr_component, e as escape, v as validate_component } from './ssr-BRJpAXVH.js';
import { p as page } from './stores4-C3NPX6l0.js';
import './ProgressBar.svelte_svelte_type_style_lang-3a6XZCfa.js';
import { P as ProgressBar } from './ProgressBar-DwvUjrxy.js';
import { b as branding } from './configuration-CJ60Yp9o.js';
import { C as Content } from './Content-DMwoUi6K.js';
import { U as UsersStore } from './Users-DtXf0HAv.js';
import { R as RoleStore } from './Roles-vkUyDBMO.js';
import { C as ConnectionsStore } from './Connections-CisbM2q4.js';
import './client-BR749xJD.js';
import './exports-kR70XCWV.js';
import './index2-BVONNh3m.js';
import './AngleButton-C6YzBYNH.js';
import './User-DLjB6rDR.js';
import './index-DzcLzHBX.js';

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
            return ` <section id="role-view"><table class="table bg-transparent"><tbody><tr><td data-svelte-h="svelte-s62l6t">Id:</td> <td>${escape(user.uuid)}</td></tr> <tr><td data-svelte-h="svelte-1aqbduw">Email:</td> <td>${escape(user.email)}</td></tr> <tr><td data-svelte-h="svelte-l7nagq">Active:</td> <td>${escape(user.active)}</td></tr> ${user.subject ? `<tr><td data-svelte-h="svelte-1kscmm0">Subject:</td> <td>${escape(user.subject)}</td></tr>` : ``} <tr><td data-svelte-h="svelte-1o2bwbo">Connection:</td> <td>${escape(typeof connection !== "string" ? connection.label : user.connection)}</td></tr> <tr><td data-svelte-h="svelte-eum8k3">Roles:</td> <td>${escape(roles.map((p) => p.name).join(", "))}</td></tr></tbody></table></section> `;
          }();
        }(load())}`;
      }
    }
  )}`;
});

export { Page as default };
//# sourceMappingURL=_page.svelte-CUu5tSs0.js.map
