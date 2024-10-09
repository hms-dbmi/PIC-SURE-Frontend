import { s as subscribe, e as is_promise, n as noop } from './utils-EiTRXYbg.js';
import { c as create_ssr_component, e as escape, v as validate_component } from './ssr-C099ZcAV.js';
import { p as page } from './stores3-BdNELvYD.js';
import './ProgressBar.svelte_svelte_type_style_lang-DykzLE77.js';
import { P as ProgressBar } from './ProgressBar-Dg8VUUsC.js';
import { b as branding } from './configuration-5_HU3Jec.js';
import { C as Content } from './Content-CtpYCKJp.js';
import { U as UsersStore, C as ConnectionsStore } from './Connections-DJIq0v4i.js';
import { R as RoleStore } from './Roles-DREcG-yb.js';
import './client-DpIAX_q0.js';
import './exports-BGi7-Rnc.js';
import './index2-Bx7ZSImw.js';
import './AngleButton-C0svtr3S.js';
import './User-D2U6RL_p.js';
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
            return ` <section id="role-view"><table class="table bg-transparent"><tr><td data-svelte-h="svelte-s62l6t">Id:</td> <td>${escape(user.uuid)}</td></tr> <tr><td data-svelte-h="svelte-1aqbduw">Email:</td> <td>${escape(user.email)}</td></tr> <tr><td data-svelte-h="svelte-l7nagq">Active:</td> <td>${escape(user.active)}</td></tr> ${user.subject ? `<tr><td data-svelte-h="svelte-1kscmm0">Subject:</td> <td>${escape(user.subject)}</td></tr>` : ``} <tr><td data-svelte-h="svelte-1o2bwbo">Connection:</td> <td>${escape(typeof connection !== "string" ? connection.label : user.connection)}</td></tr> <tr><td data-svelte-h="svelte-eum8k3">Roles:</td> <td>${escape(roles.map((p) => p.name).join(", "))}</td></tr></table></section> `;
          }();
        }(load())}`;
      }
    }
  )}`;
});

export { Page as default };
//# sourceMappingURL=_page.svelte-CLny_qw4.js.map
