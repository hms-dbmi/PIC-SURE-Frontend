import { s as subscribe, e as is_promise, n as noop } from './utils-EiTRXYbg.js';
import { c as create_ssr_component, e as escape, v as validate_component } from './ssr-C099ZcAV.js';
import './ProgressBar.svelte_svelte_type_style_lang-DykzLE77.js';
import { P as ProgressBar } from './ProgressBar-Dg8VUUsC.js';
import { b as branding } from './configuration-5_HU3Jec.js';
import { C as Content } from './Content-CtpYCKJp.js';
import { P as PrivilegeForm } from './PrivilegeForm-BuzJYCmo.js';
import { A as ApplicationStore } from './Application-fGEUROsL.js';
import './index2-Bx7ZSImw.js';
import './AngleButton-C0svtr3S.js';
import './client-DpIAX_q0.js';
import './exports-BGi7-Rnc.js';
import './stores2-DM9tzbse.js';
import './Validation-DXCOBx8m.js';
import './Privileges-CP-P0XVS.js';
import './User-D2U6RL_p.js';
import './index-DzcLzHBX.js';

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
//# sourceMappingURL=_page.svelte-BJiuwsjF.js.map
