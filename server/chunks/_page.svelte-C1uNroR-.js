import { a as subscribe, l as is_promise, n as noop } from './lifecycle-DtuISP6h.js';
import { c as create_ssr_component, e as escape, v as validate_component } from './ssr-BRJpAXVH.js';
import { p as page } from './stores4-C3NPX6l0.js';
import './ProgressBar.svelte_svelte_type_style_lang-3a6XZCfa.js';
import { P as ProgressBar } from './ProgressBar-DwvUjrxy.js';
import { b as branding } from './configuration-wvkhv90d.js';
import { C as Content } from './Content-DMwoUi6K.js';
import { U as UserForm } from './UserForm-DYdI2FTl.js';
import { U as UsersStore } from './Users-5pc3xGUc.js';
import { R as RoleStore } from './Roles-cZVhFyLm.js';
import { C as ConnectionsStore } from './Connections-Datxqc4r.js';
import './client-BR749xJD.js';
import './exports-kR70XCWV.js';
import './index2-BVONNh3m.js';
import './AngleButton-C6YzBYNH.js';
import './stores2-Cy1ftf_v.js';
import './Privileges-DCNkXxvM.js';
import './User-Clr_TyZW.js';
import './index-CvuFLVuQ.js';

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
//# sourceMappingURL=_page.svelte-C1uNroR-.js.map
