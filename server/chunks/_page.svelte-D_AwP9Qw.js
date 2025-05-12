import { a as subscribe, l as is_promise, n as noop } from './lifecycle-DtuISP6h.js';
import { c as create_ssr_component, e as escape, v as validate_component } from './ssr-BRJpAXVH.js';
import { p as page } from './stores4-C3NPX6l0.js';
import './ProgressBar.svelte_svelte_type_style_lang-3a6XZCfa.js';
import { P as ProgressBar } from './ProgressBar-DwvUjrxy.js';
import { b as branding } from './configuration-CJ60Yp9o.js';
import { C as Content } from './Content-DMwoUi6K.js';
import { P as PrivilegeForm } from './PrivilegeForm-BJYVgip3.js';
import { g as getPrivilege } from './Privileges-DNoWQh2T.js';
import { a as applicationList, l as loadApplications } from './Application-aBs0XQ8V.js';
import './client-BR749xJD.js';
import './exports-kR70XCWV.js';
import './index2-BVONNh3m.js';
import './AngleButton-C6YzBYNH.js';
import './stores2-Cy1ftf_v.js';
import './User-DLjB6rDR.js';
import './index-DzcLzHBX.js';

const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $page, $$unsubscribe_page;
  let $applicationList, $$unsubscribe_applicationList;
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  $$unsubscribe_applicationList = subscribe(applicationList, (value) => $applicationList = value);
  let privilege;
  async function load() {
    privilege = await getPrivilege($page.params.uuid);
    await loadApplications();
  }
  $$unsubscribe_page();
  $$unsubscribe_applicationList();
  return `${$$result.head += `<!-- HEAD_svelte-1n430ne_START -->${$$result.title = `<title>${escape(branding.applicationName)} | Edit Privilege</title>`, ""}<!-- HEAD_svelte-1n430ne_END -->`, ""} ${validate_component(Content, "Content").$$render(
    $$result,
    {
      title: "Edit Privilege",
      backUrl: "/admin/configuration",
      backTitle: "Back to Configuration"
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
            return ` <section id="privilege-edit">${validate_component(PrivilegeForm, "PrivilegeForm").$$render(
              $$result,
              {
                applicationList: $applicationList,
                privilege
              },
              {},
              {}
            )}</section> `;
          }();
        }(load())}`;
      }
    }
  )}`;
});

export { Page as default };
//# sourceMappingURL=_page.svelte-D_AwP9Qw.js.map
