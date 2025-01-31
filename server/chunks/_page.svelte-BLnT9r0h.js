import { a as subscribe, l as is_promise, n as noop } from './lifecycle-DtuISP6h.js';
import { c as create_ssr_component, e as escape, v as validate_component } from './ssr-BRJpAXVH.js';
import { p as page } from './stores4-C3NPX6l0.js';
import './ProgressBar.svelte_svelte_type_style_lang-3a6XZCfa.js';
import { P as ProgressBar } from './ProgressBar-DwvUjrxy.js';
import { b as branding } from './configuration-BRozmRr_.js';
import { C as Content } from './Content-DMwoUi6K.js';
import { P as PrivilegesStore } from './Privileges-Bs-kA03i.js';
import { A as ApplicationStore } from './Application-DOF6hYP5.js';
import './client-BR749xJD.js';
import './exports-kR70XCWV.js';
import './index2-BVONNh3m.js';
import './AngleButton-C6YzBYNH.js';
import './User-BiqhXRJx.js';
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
            return ` <section id="privilege-view" class="m-3"><table class="table bg-transparent"><tbody><tr><td data-svelte-h="svelte-czj0bp">ID:</td> <td>${escape(privilege.uuid)}</td></tr> <tr><td data-svelte-h="svelte-1h12c2b">Name:</td> <td>${escape(privilege.name)}</td></tr> <tr><td data-svelte-h="svelte-9t1c8u">Description:</td> <td>${escape(privilege.description)}</td></tr> <tr>${typeof application !== "string" ? `<td class="align-top" data-svelte-h="svelte-5ja3ya">Application:</td> <td><table class="table bg-transparent"><tbody><tr><td data-svelte-h="svelte-czj0bp">ID:</td> <td>${escape(application.uuid)}</td></tr> <tr><td data-svelte-h="svelte-1h12c2b">Name:</td> <td>${escape(application.name)}</td></tr> <tr><td data-svelte-h="svelte-9t1c8u">Description:</td> <td>${escape(application.description)}</td></tr> <tr><td data-svelte-h="svelte-xp95fj">Enabled:</td> <td>${escape(application.enable ? "Yes" : "No")}</td></tr></tbody></table></td>` : `<td data-svelte-h="svelte-1lh2n8i">Application:</td> <td data-svelte-h="svelte-l9b6no">none</td>`}</tr></tbody></table></section> `;
          }();
        }(load())}`;
      }
    }
  )}`;
});

export { Page as default };
//# sourceMappingURL=_page.svelte-BLnT9r0h.js.map
