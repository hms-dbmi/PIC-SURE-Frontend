import { s as subscribe, e as is_promise, n as noop } from './utils-EiTRXYbg.js';
import { c as create_ssr_component, e as escape, v as validate_component } from './ssr-C099ZcAV.js';
import { p as page } from './stores3-BdNELvYD.js';
import './ProgressBar.svelte_svelte_type_style_lang-DykzLE77.js';
import { P as ProgressBar } from './ProgressBar-Dg8VUUsC.js';
import { b as branding } from './configuration-5_HU3Jec.js';
import { C as Content } from './Content-CtpYCKJp.js';
import { P as PrivilegesStore } from './Privileges-CP-P0XVS.js';
import { A as ApplicationStore } from './Application-fGEUROsL.js';
import './client-DpIAX_q0.js';
import './exports-BGi7-Rnc.js';
import './index2-Bx7ZSImw.js';
import './AngleButton-C0svtr3S.js';
import './User-D2U6RL_p.js';
import './index-DzcLzHBX.js';

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
//# sourceMappingURL=_page.svelte-C-sMf92T.js.map
