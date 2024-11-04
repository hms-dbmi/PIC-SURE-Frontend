import { a as subscribe, m as is_promise, n as noop } from './lifecycle-GVhEEkqU.js';
import { c as create_ssr_component, e as escape, v as validate_component } from './ssr-Di-o4HBA.js';
import { p as page } from './stores3-DsZ2QG0u.js';
import './ProgressBar.svelte_svelte_type_style_lang-D52eF_WP.js';
import { P as ProgressBar } from './ProgressBar-BKXHCANO.js';
import { b as branding } from './configuration-CHJZnZTS.js';
import { C as Content } from './Content-BUgV6smf.js';
import { P as PrivilegeForm } from './PrivilegeForm-Dah9HlDn.js';
import { P as PrivilegesStore } from './Privileges-jkKxsELb.js';
import { A as ApplicationStore } from './Application-BKKK6xkC.js';
import './client-TAfaRk9z.js';
import './exports-CTha0ECg.js';
import './index2-CV6P_ZFI.js';
import './AngleButton-Cxjzo9QZ.js';
import './stores2-DrFt-twL.js';
import './Validation-DXCOBx8m.js';
import './User-BLfUZEEV.js';
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
//# sourceMappingURL=_page.svelte-amglQSq4.js.map
