import { s as subscribe, e as is_promise, n as noop } from './utils-EiTRXYbg.js';
import { c as create_ssr_component, e as escape, v as validate_component } from './ssr-C099ZcAV.js';
import './ProgressBar.svelte_svelte_type_style_lang-DykzLE77.js';
import { P as ProgressBar } from './ProgressBar-Dg8VUUsC.js';
import { b as branding } from './configuration-5_HU3Jec.js';
import { C as Content } from './Content-CtpYCKJp.js';
import { U as UserForm } from './UserForm-BOJ2x2xV.js';
import { R as RoleStore } from './Roles-DREcG-yb.js';
import { C as ConnectionsStore } from './Connections-DJIq0v4i.js';
import './index2-Bx7ZSImw.js';
import './AngleButton-C0svtr3S.js';
import './client-DpIAX_q0.js';
import './exports-BGi7-Rnc.js';
import './stores2-DM9tzbse.js';
import './Privileges-CP-P0XVS.js';
import './User-D2U6RL_p.js';
import './index-DzcLzHBX.js';

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
//# sourceMappingURL=_page.svelte-BAsrOqAN.js.map
