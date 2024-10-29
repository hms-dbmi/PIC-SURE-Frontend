import { a as subscribe, m as is_promise, n as noop } from './lifecycle-GVhEEkqU.js';
import { c as create_ssr_component, e as escape, v as validate_component } from './ssr-Di-o4HBA.js';
import { p as page } from './stores3-DsZ2QG0u.js';
import './ProgressBar.svelte_svelte_type_style_lang-D52eF_WP.js';
import { P as ProgressBar } from './ProgressBar-BKXHCANO.js';
import { b as branding } from './configuration-CHJZnZTS.js';
import { C as Content } from './Content-BUgV6smf.js';
import { U as UserForm } from './UserForm-BRXkLDhc.js';
import { U as UsersStore, C as ConnectionsStore } from './Connections-CD63sofG.js';
import { R as RoleStore } from './Roles-DAzDO6dr.js';
import './client-TAfaRk9z.js';
import './exports-CTha0ECg.js';
import './index2-CV6P_ZFI.js';
import './AngleButton-Cxjzo9QZ.js';
import './stores2-DrFt-twL.js';
import './Privileges-CBKVrBv7.js';
import './User-BlJO9WgU.js';
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
//# sourceMappingURL=_page.svelte-PDxDcwfQ.js.map
