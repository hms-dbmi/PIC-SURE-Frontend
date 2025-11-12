import { x as push, a4 as head, z as pop, M as escape_html, Y as await_block, U as store_get, X as unsubscribe_stores } from './index-BYsoXH7a.js';
import { b as branding } from './configuration-wjj69jIJ.js';
import { C as Content } from './Content-D47GFKQW.js';
import { P as PrivilegeForm } from './PrivilegeForm-SZunhHuQ.js';
import { A as ApplicationStore } from './Application-BxxudjlX.js';
import { L as Loading } from './Loading-D4A6B7i5.js';
import './client2-2LGcfZLB.js';
import '@sveltejs/kit/internal';
import './utils-Dn8W3aSK.js';
import './Privileges-BTHtczqR.js';
import './User-CGCqDR6a.js';
import '@sveltejs/kit';
import './index2-DXnmzf54.js';

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
          $$payload2.out.push(`<section id="privilege-new">`);
          PrivilegeForm($$payload2, {
            applicationList: store_get($$store_subs ??= {}, "$applicationList", applicationList)
          });
          $$payload2.out.push(`<!----></section>`);
        }
      );
      $$payload2.out.push(`<!--]-->`);
    }
  });
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}

export { _page as default };
//# sourceMappingURL=_page.svelte-BX4rU2L-.js.map
