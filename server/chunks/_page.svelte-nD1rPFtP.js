import { x as push, a8 as head, z as pop, M as escape_html, Y as await_block, U as store_get, X as unsubscribe_stores } from './index-DMPVr6nO.js';
import { b as branding } from './configuration-CBIXsjx2.js';
import { C as Content } from './Content-DMJk6TmZ.js';
import { P as PrivilegeForm } from './PrivilegeForm-CDHwtCmO.js';
import { A as ApplicationStore } from './Application-DYgV737M.js';
import { L as Loading } from './Loading-DAyWVuL0.js';
import './client2-DxcZr6Tp.js';
import '@sveltejs/kit/internal';
import './utils-B7NzVBxP.js';
import './Privileges-GMiwBHrM.js';
import './User-01eW3TFo.js';
import '@sveltejs/kit';
import './index2-Bp7szfwE.js';

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
//# sourceMappingURL=_page.svelte-nD1rPFtP.js.map
