import { x as push, a1 as head, z as pop, K as escape_html, X as await_block, T as store_get, W as unsubscribe_stores } from './index-C5NonOVO.js';
import { b as branding } from './configuration-CSskKBur.js';
import { C as Content } from './Content-DHBbMVB_.js';
import { R as RoleForm } from './RoleForm-KSDirQYa.js';
import { P as PrivilegesStore } from './Privileges-B908xk15.js';
import { L as Loading } from './Loading-Drx6gnkR.js';
import './client2-CLhyDddE.js';
import './exports-Cnt0TmSD.js';
import './Roles-CWZH5hrE.js';
import './User-ByrNDeqq.js';
import './index2-CvuFLVuQ.js';
import './index3-D0mgFMjB.js';
import './client-BWx-wafP.js';

function _page($$payload, $$props) {
  push();
  var $$store_subs;
  const { privilegeList, loadPrivileges } = PrivilegesStore;
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>${escape_html(branding.applicationName)} | New Role</title>`;
  });
  Content($$payload, {
    title: "New Role",
    backUrl: "/admin/configuration",
    backTitle: "Back to Configuration",
    children: ($$payload2) => {
      await_block(
        $$payload2,
        loadPrivileges(),
        () => {
          Loading($$payload2, {});
        },
        () => {
          $$payload2.out += `<section id="role-new">`;
          RoleForm($$payload2, {
            privilegeList: store_get($$store_subs ??= {}, "$privilegeList", privilegeList)
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
//# sourceMappingURL=_page.svelte-CjPz5pT-.js.map
