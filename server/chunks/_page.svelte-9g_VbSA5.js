import { x as push, a1 as head, z as pop, K as escape_html, X as await_block, T as store_get, W as unsubscribe_stores } from './index-C5NonOVO.js';
import { b as branding } from './configuration-CSskKBur.js';
import { C as Content } from './Content-DHBbMVB_.js';
import { P as PrivilegeForm } from './PrivilegeForm-DcFdfnfk.js';
import { A as ApplicationStore } from './Application-B-1BUU3m.js';
import { L as Loading } from './Loading-Drx6gnkR.js';
import './client2-CLhyDddE.js';
import './exports-Cnt0TmSD.js';
import './Privileges-B908xk15.js';
import './User-ByrNDeqq.js';
import './index2-CvuFLVuQ.js';
import './index3-D0mgFMjB.js';
import './client-BWx-wafP.js';

function _page($$payload, $$props) {
  push();
  var $$store_subs;
  const { applicationList, loadApplications } = ApplicationStore;
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>${escape_html(branding.applicationName)} | New Privilege</title>`;
  });
  Content($$payload, {
    title: "New Privilege",
    backUrl: "/admin/configuration",
    backTitle: "Back to Configuration",
    children: ($$payload2) => {
      await_block(
        $$payload2,
        loadApplications(),
        () => {
          Loading($$payload2, {});
        },
        () => {
          $$payload2.out += `<section id="privilege-new">`;
          PrivilegeForm($$payload2, {
            applicationList: store_get($$store_subs ??= {}, "$applicationList", applicationList)
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
//# sourceMappingURL=_page.svelte-9g_VbSA5.js.map
