import { x as push, a1 as head, z as pop, K as escape_html, _ as await_block, T as store_get, W as unsubscribe_stores } from './index-BKfiikQf.js';
import { p as page } from './index3-BXxOVXV0.js';
import { b as branding } from './configuration-D-fruRXg.js';
import { C as Content } from './Content-CXUsf3rW.js';
import { P as PrivilegeForm } from './PrivilegeForm-DP5HGDAx.js';
import { g as getPrivilege } from './Privileges-BTeK4lJj.js';
import { a as applicationList, l as loadApplications } from './Application-DC9Zpzca.js';
import { L as Loading } from './Loading-DKkczq09.js';
import './client2-B5hsHc_n.js';
import './client-HRCS46UK.js';
import './exports-CKriv3vT.js';
import './User-DPh8mmLT.js';
import './index2-CvuFLVuQ.js';
import './stores-DhwnhD2d.js';
import './toaster-DzAsAKEJ.js';
import './index-BB9JrA1L.js';
import './machine.svelte-D_VZYMjT.js';

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
//# sourceMappingURL=_page.svelte-DYxyz7sc.js.map
