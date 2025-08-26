import { x as push, a1 as head, z as pop, K as escape_html, X as await_block, T as store_get, W as unsubscribe_stores } from './index-C5NonOVO.js';
import { p as page } from './index3-D0mgFMjB.js';
import { b as branding } from './configuration-CSskKBur.js';
import { C as Content } from './Content-DHBbMVB_.js';
import { P as PrivilegeForm } from './PrivilegeForm-DcFdfnfk.js';
import { g as getPrivilege } from './Privileges-B908xk15.js';
import { a as applicationList, l as loadApplications } from './Application-B-1BUU3m.js';
import { L as Loading } from './Loading-Drx6gnkR.js';
import './client-BWx-wafP.js';
import './client2-CLhyDddE.js';
import './exports-Cnt0TmSD.js';
import './User-ByrNDeqq.js';
import './index2-CvuFLVuQ.js';

function _page($$payload, $$props) {
  push();
  var $$store_subs;
  let privilege = { name: "", description: "", application: "" };
  async function load() {
    privilege = await getPrivilege(page.params.uuid);
    await loadApplications();
  }
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>${escape_html(branding.applicationName)} | Edit Privilege</title>`;
  });
  Content($$payload, {
    title: "Edit Privilege",
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
          $$payload2.out += `<section id="privilege-edit">`;
          PrivilegeForm($$payload2, {
            applicationList: store_get($$store_subs ??= {}, "$applicationList", applicationList),
            privilege
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
//# sourceMappingURL=_page.svelte-o0dA_9uw.js.map
