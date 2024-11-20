import { a as subscribe, l as is_promise, n as noop } from './lifecycle-DtuISP6h.js';
import { c as create_ssr_component, e as escape, v as validate_component } from './ssr-BRJpAXVH.js';
import { p as page } from './stores4-B2YFsTYy.js';
import './ProgressBar.svelte_svelte_type_style_lang-3a6XZCfa.js';
import { P as ProgressBar } from './ProgressBar-DwvUjrxy.js';
import { b as branding } from './configuration-zUcJ0Kpb.js';
import { C as Content } from './Content-D53qfAxy.js';
import { U as UserForm } from './UserForm-NNd6Yj2_.js';
import { U as UsersStore, C as ConnectionsStore } from './Connections-BXXlNWz7.js';
import { R as RoleStore } from './Roles-BFvyema1.js';
import './client-TAfaRk9z.js';
import './exports-CTha0ECg.js';
import './index2-BVONNh3m.js';
import './AngleButton-C6YzBYNH.js';
import './stores2-Cy1ftf_v.js';
import './Privileges-CoWiNxg3.js';
import './User-Dh89vg_C.js';
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
//# sourceMappingURL=_page.svelte-C-3tUOCK.js.map
