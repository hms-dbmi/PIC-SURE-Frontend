import { a as subscribe, l as is_promise, n as noop } from './lifecycle-DtuISP6h.js';
import { c as create_ssr_component, e as escape, v as validate_component } from './ssr-BRJpAXVH.js';
import './ProgressBar.svelte_svelte_type_style_lang-3a6XZCfa.js';
import { P as ProgressBar } from './ProgressBar-DwvUjrxy.js';
import { b as branding } from './configuration-GpO7NgNq.js';
import { C as Content } from './Content-DMwoUi6K.js';
import { U as UserForm } from './UserForm-BF8DEzct.js';
import { R as RoleStore } from './Roles-CnefkO98.js';
import { C as ConnectionsStore } from './Connections-CKCS-Xz7.js';
import './index2-BVONNh3m.js';
import './AngleButton-C6YzBYNH.js';
import './client-BR749xJD.js';
import './exports-kR70XCWV.js';
import './stores2-Cy1ftf_v.js';
import './Users-D5L4zrbw.js';
import './User-H6u4bNR9.js';
import './index-CvuFLVuQ.js';
import './stores4-C3NPX6l0.js';
import './Privileges-BZMt1DNq.js';

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
//# sourceMappingURL=_page.svelte-NvY9cqHD.js.map
