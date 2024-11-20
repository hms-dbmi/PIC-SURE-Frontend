import { a as subscribe, l as is_promise, n as noop } from './lifecycle-DtuISP6h.js';
import { c as create_ssr_component, e as escape, v as validate_component } from './ssr-BRJpAXVH.js';
import { p as page } from './stores4-B2YFsTYy.js';
import './ProgressBar.svelte_svelte_type_style_lang-3a6XZCfa.js';
import { P as ProgressBar } from './ProgressBar-DwvUjrxy.js';
import { b as branding } from './configuration-zUcJ0Kpb.js';
import { C as Content } from './Content-D53qfAxy.js';
import { P as PrivilegeForm } from './PrivilegeForm-BKF5BGnW.js';
import { P as PrivilegesStore } from './Privileges-CoWiNxg3.js';
import { A as ApplicationStore } from './Application-B2i1x32u.js';
import './client-TAfaRk9z.js';
import './exports-CTha0ECg.js';
import './index2-BVONNh3m.js';
import './AngleButton-C6YzBYNH.js';
import './stores2-Cy1ftf_v.js';
import './Validation-DXCOBx8m.js';
import './User-Dh89vg_C.js';
import './index-CvuFLVuQ.js';

const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $page, $$unsubscribe_page;
  let $applicationList, $$unsubscribe_applicationList;
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  const { loadPrivileges, getPrivilege } = PrivilegesStore;
  const { applicationList, loadApplications } = ApplicationStore;
  $$unsubscribe_applicationList = subscribe(applicationList, (value) => $applicationList = value);
  let privilege;
  async function load() {
    await loadPrivileges();
    privilege = await getPrivilege($page.params.uuid);
    await loadApplications();
  }
  $$unsubscribe_page();
  $$unsubscribe_applicationList();
  return `${$$result.head += `<!-- HEAD_svelte-1n430ne_START -->${$$result.title = `<title>${escape(branding.applicationName)} | Edit Privilege</title>`, ""}<!-- HEAD_svelte-1n430ne_END -->`, ""} ${validate_component(Content, "Content").$$render(
    $$result,
    {
      title: "Edit Privilege",
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
//# sourceMappingURL=_page.svelte-ChMxO2ud.js.map
