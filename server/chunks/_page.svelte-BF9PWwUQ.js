import { a as subscribe, l as is_promise, n as noop } from './lifecycle-DtuISP6h.js';
import { c as create_ssr_component, e as escape, v as validate_component } from './ssr-BRJpAXVH.js';
import './ProgressBar.svelte_svelte_type_style_lang-3a6XZCfa.js';
import { P as ProgressBar } from './ProgressBar-DwvUjrxy.js';
import { b as branding } from './configuration-zUcJ0Kpb.js';
import { C as Content } from './Content-D53qfAxy.js';
import { U as UserForm } from './UserForm-NNd6Yj2_.js';
import { R as RoleStore } from './Roles-BFvyema1.js';
import { C as ConnectionsStore } from './Connections-BXXlNWz7.js';
import './index2-BVONNh3m.js';
import './AngleButton-C6YzBYNH.js';
import './client-TAfaRk9z.js';
import './exports-CTha0ECg.js';
import './stores2-Cy1ftf_v.js';
import './Privileges-CoWiNxg3.js';
import './User-Dh89vg_C.js';
import './index-CvuFLVuQ.js';
import './stores4-B2YFsTYy.js';

const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $connections, $$unsubscribe_connections;
  let $roleList, $$unsubscribe_roleList;
  const { roleList, loadRoles } = RoleStore;
  $$unsubscribe_roleList = subscribe(roleList, (value) => $roleList = value);
  const { connections, loadConnections } = ConnectionsStore;
  $$unsubscribe_connections = subscribe(connections, (value) => $connections = value);
  async function load() {
    await loadConnections();
    await loadRoles();
  }
  $$unsubscribe_connections();
  $$unsubscribe_roleList();
  return `${$$result.head += `<!-- HEAD_svelte-s89u64_START -->${$$result.title = `<title>${escape(branding.applicationName)} | New User</title>`, ""}<!-- HEAD_svelte-s89u64_END -->`, ""} ${validate_component(Content, "Content").$$render(
    $$result,
    {
      title: "New User",
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
            return ` <section id="user-new">${validate_component(UserForm, "UserForm").$$render(
              $$result,
              {
                connections: $connections,
                roleList: $roleList
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
//# sourceMappingURL=_page.svelte-BF9PWwUQ.js.map
