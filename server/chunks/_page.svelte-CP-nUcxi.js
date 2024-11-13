import { a as subscribe, m as is_promise, n as noop } from './lifecycle-GVhEEkqU.js';
import { c as create_ssr_component, e as escape, v as validate_component } from './ssr-Di-o4HBA.js';
import './ProgressBar.svelte_svelte_type_style_lang-D52eF_WP.js';
import { P as ProgressBar } from './ProgressBar-BKXHCANO.js';
import { b as branding } from './configuration-B3dQYR0_.js';
import { C as Content } from './Content-BUgV6smf.js';
import { P as PrivilegeForm } from './PrivilegeForm-BSP3X0l6.js';
import { A as ApplicationStore } from './Application-DPjyto7-.js';
import './index2-CV6P_ZFI.js';
import './AngleButton-Cxjzo9QZ.js';
import './client-TAfaRk9z.js';
import './exports-CTha0ECg.js';
import './stores2-DrFt-twL.js';
import './Validation-DXCOBx8m.js';
import './Privileges-CHGFe2Ry.js';
import './User-DwYSDSFP.js';
import './index-DzcLzHBX.js';
import './stores3-DsZ2QG0u.js';

const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $applicationList, $$unsubscribe_applicationList;
  const { applicationList, loadApplications } = ApplicationStore;
  $$unsubscribe_applicationList = subscribe(applicationList, (value) => $applicationList = value);
  $$unsubscribe_applicationList();
  return `${$$result.head += `<!-- HEAD_svelte-kpk5we_START -->${$$result.title = `<title>${escape(branding.applicationName)} | New Privilege</title>`, ""}<!-- HEAD_svelte-kpk5we_END -->`, ""} ${validate_component(Content, "Content").$$render(
    $$result,
    {
      title: "New Privilege",
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
            return ` <section id="privilege-new">${validate_component(PrivilegeForm, "PrivilegeForm").$$render($$result, { applicationList: $applicationList }, {}, {})}</section> `;
          }();
        }(loadApplications())}`;
      }
    }
  )}`;
});

export { Page as default };
//# sourceMappingURL=_page.svelte-CP-nUcxi.js.map
