import { a as subscribe, m as is_promise, n as noop } from './lifecycle-GVhEEkqU.js';
import { c as create_ssr_component, e as escape, v as validate_component } from './ssr-Di-o4HBA.js';
import { p as page } from './stores3-DsZ2QG0u.js';
import './ProgressBar.svelte_svelte_type_style_lang-D52eF_WP.js';
import { P as ProgressBar } from './ProgressBar-BKXHCANO.js';
import { b as branding } from './configuration-CHJZnZTS.js';
import { C as Content } from './Content-BUgV6smf.js';
import { P as PrivilegesStore } from './Privileges-CBKVrBv7.js';
import { A as ApplicationStore } from './Application-CyYi2gGq.js';
import './client-TAfaRk9z.js';
import './exports-CTha0ECg.js';
import './index2-CV6P_ZFI.js';
import './AngleButton-Cxjzo9QZ.js';
import './User-BlJO9WgU.js';
import './index-CvuFLVuQ.js';

const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $page, $$unsubscribe_page;
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  const { loadPrivileges, getPrivilege } = PrivilegesStore;
  const { getApplication } = ApplicationStore;
  let privilege;
  let application = "";
  async function load() {
    await loadPrivileges();
    privilege = await getPrivilege($page.params.uuid);
    if (privilege.application) {
      application = await getApplication(privilege.application) || "";
    }
  }
  $$unsubscribe_page();
  return `${$$result.head += `<!-- HEAD_svelte-f764m4_START -->${$$result.title = `<title>${escape(branding.applicationName)} | Privilege Summary</title>`, ""}<!-- HEAD_svelte-f764m4_END -->`, ""} ${validate_component(Content, "Content").$$render(
    $$result,
    {
      title: "Privilege Summary",
      backUrl: "/admin/authorization",
      backTitle: "Back to Authorization"
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
            return ` <section id="privilege-view" class="m-3"><table class="table bg-transparent"><tr><td data-svelte-h="svelte-czj0bp">ID:</td> <td>${escape(privilege.uuid)}</td></tr> <tr><td data-svelte-h="svelte-1h12c2b">Name:</td> <td>${escape(privilege.name)}</td></tr> <tr><td data-svelte-h="svelte-9t1c8u">Description:</td> <td>${escape(privilege.description)}</td></tr> <tr>${typeof application !== "string" ? `<td class="align-top" data-svelte-h="svelte-5ja3ya">Application:</td> <td><table class="table bg-transparent"><tr><td data-svelte-h="svelte-czj0bp">ID:</td> <td>${escape(application.uuid)}</td></tr> <tr><td data-svelte-h="svelte-1h12c2b">Name:</td> <td>${escape(application.name)}</td></tr> <tr><td data-svelte-h="svelte-9t1c8u">Description:</td> <td>${escape(application.description)}</td></tr> <tr><td data-svelte-h="svelte-xp95fj">Enabled:</td> <td>${escape(application.enable ? "Yes" : "No")}</td></tr></table></td>` : `<td data-svelte-h="svelte-1lh2n8i">Application:</td> <td data-svelte-h="svelte-l9b6no">none</td>`}</tr></table></section> `;
          }();
        }(load())}`;
      }
    }
  )}`;
});

export { Page as default };
//# sourceMappingURL=_page.svelte-BDi90P1r.js.map
