import { x as push, a1 as head, z as pop, K as escape_html, X as await_block, T as store_get, W as unsubscribe_stores } from './index-C5NonOVO.js';
import { p as page } from './index3-D0mgFMjB.js';
import { b as branding } from './configuration-CSskKBur.js';
import { C as Content } from './Content-DHBbMVB_.js';
import { R as RoleForm } from './RoleForm-KSDirQYa.js';
import { g as getRole } from './Roles-CWZH5hrE.js';
import { a as privilegeList, l as loadPrivileges } from './Privileges-B908xk15.js';
import { L as Loading } from './Loading-Drx6gnkR.js';
import './client-BWx-wafP.js';
import './client2-CLhyDddE.js';
import './exports-Cnt0TmSD.js';
import './User-ByrNDeqq.js';
import './index2-CvuFLVuQ.js';

function _page($$payload, $$props) {
  push();
  var $$store_subs;
  let role = { name: "", description: "", privileges: [] };
  async function load() {
    role = await getRole(page.params.uuid);
    await loadPrivileges();
  }
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>${escape_html(branding.applicationName)} | Edit Role</title>`;
  });
  Content($$payload, {
    title: "Edit Role",
    backUrl: "/admin/configuration",
    backTitle: "Back to Configuration",
    children: ($$payload2) => {
      await_block(
        $$payload2,
        load(),
        () => {
          Loading($$payload2, {});
        },
        () => {
          $$payload2.out += `<section id="role-edit">`;
          RoleForm($$payload2, {
            privilegeList: store_get($$store_subs ??= {}, "$privilegeList", privilegeList),
            role
          });
          $$payload2.out += `<!----></section>`;
        }
      );
      $$payload2.out += `<!--]-->`;
    }
  });
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}

export { _page as default };
//# sourceMappingURL=_page.svelte-C6o5hkAp.js.map
