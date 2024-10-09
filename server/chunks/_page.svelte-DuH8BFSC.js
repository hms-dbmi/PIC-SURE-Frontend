import { s as subscribe, e as is_promise, n as noop } from './utils-EiTRXYbg.js';
import { c as create_ssr_component, e as escape, v as validate_component } from './ssr-C099ZcAV.js';
import { p as page } from './stores3-BdNELvYD.js';
import './ProgressBar.svelte_svelte_type_style_lang-DykzLE77.js';
import { P as ProgressBar } from './ProgressBar-Dg8VUUsC.js';
import { b as branding } from './configuration-5_HU3Jec.js';
import { C as Content } from './Content-CtpYCKJp.js';
import { U as UserForm } from './UserForm-BOJ2x2xV.js';
import { U as UsersStore, C as ConnectionsStore } from './Connections-DJIq0v4i.js';
import { R as RoleStore } from './Roles-DREcG-yb.js';
import './client-DpIAX_q0.js';
import './exports-BGi7-Rnc.js';
import './index2-Bx7ZSImw.js';
import './AngleButton-C0svtr3S.js';
import './stores2-DM9tzbse.js';
import './Privileges-CP-P0XVS.js';
import './User-D2U6RL_p.js';
import './index-DzcLzHBX.js';

const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $page, $$unsubscribe_page;
  let $connections, $$unsubscribe_connections;
  let $roleList, $$unsubscribe_roleList;
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  const { getUser, loadUsers } = UsersStore;
  const { roleList, loadRoles } = RoleStore;
  $$unsubscribe_roleList = subscribe(roleList, (value) => $roleList = value);
  const { connections, loadConnections } = ConnectionsStore;
  $$unsubscribe_connections = subscribe(connections, (value) => $connections = value);
  let user;
  async function load() {
    await loadUsers();
    user = await getUser($page.params.uuid);
    await loadRoles();
    await loadConnections();
  }
  $$unsubscribe_page();
  $$unsubscribe_connections();
  $$unsubscribe_roleList();
  return `${$$result.head += `<!-- HEAD_svelte-hiwdb0_START -->${$$result.title = `<title>${escape(branding.applicationName)} | Edit User</title>`, ""}<!-- HEAD_svelte-hiwdb0_END -->`, ""} ${validate_component(Content, "Content").$$render(
    $$result,
    {
      title: "Edit User",
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
            return ` <section id="user-edit">${validate_component(UserForm, "UserForm").$$render(
              $$result,
              {
                connections: $connections,
                roleList: $roleList,
                user
              },
              {},
              {}
            )}</section> `;
          }();
        }(load())}`;
      }
    }
  )}`;
});

export { Page as default };
//# sourceMappingURL=_page.svelte-DuH8BFSC.js.map
