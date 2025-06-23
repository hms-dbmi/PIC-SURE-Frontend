import { x as push, Q as props_id, R as ensure_array_like, S as spread_attributes, z as pop, T as store_get, U as copy_payload, V as assign_payload, W as unsubscribe_stores, M as attr_class, K as escape_html, P as stringify, N as attr } from './index-BKfiikQf.js';
import { g as group, m as machine, c as connect } from './toaster-DzAsAKEJ.js';
import './index-BB9JrA1L.js';
import { u as useMachine, n as normalizeProps } from './machine.svelte-D_VZYMjT.js';
import { p as page } from './stores-DhwnhD2d.js';
import { b as branding, f as features } from './configuration-D-fruRXg.js';
import { u as user } from './User-DPh8mmLT.js';
import { M as Modal_1 } from './Modal-DVSOHq6m.js';

function Toast($$payload, $$props) {
  push();
  const { $$slots, $$events, ...props } = $$props;
  const service = useMachine(machine, () => ({
    ...props.toast,
    parent: props.parent,
    index: props.index
  }));
  const api = connect(service, normalizeProps);
  const rxState = (() => {
    switch (api.type) {
      case "success":
        return props.stateSuccess;
      case "warning":
        return props.stateWarning;
      case "error":
        return props.stateError;
      default:
        return props.stateInfo;
    }
  })();
  $$payload.out += `<div${spread_attributes(
    {
      class: `${stringify(props.base)} ${stringify(props.width)} ${stringify(props.padding)} ${stringify(props.rounded)} ${stringify(rxState)} ${stringify(props.classes)}`,
      ...api.getRootProps(),
      "data-testid": "toast-root"
    },
    "svelte-vdfzso"
  )}><div${attr_class(`${stringify(props.messageBase)} ${stringify(props.messageClasses)}`)} data-testid="toast-message"><span${spread_attributes(
    {
      class: `${stringify(props.titleBase)} ${stringify(props.titleClasses)}`,
      ...api.getTitleProps(),
      "data-testid": "toast-title"
    },
    "svelte-vdfzso"
  )}>${escape_html(api.title)}</span> <span${spread_attributes(
    {
      class: `${stringify(props.descriptionBase)} ${stringify(props.descriptionClasses)}`,
      ...api.getDescriptionProps(),
      "data-testid": "toast-description"
    },
    "svelte-vdfzso"
  )}>${escape_html(api.description)}</span></div> `;
  if (api.closable) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<button${spread_attributes(
      {
        class: `${stringify(props.btnDismissBase)} ${stringify(props.btnDismissClasses)}`,
        ...api.getCloseTriggerProps(),
        "data-testid": "toast-dismiss"
      },
      "svelte-vdfzso"
    )}>×</button>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div>`;
  pop();
}
function Toaster($$payload, $$props) {
  push();
  const id = props_id($$payload);
  const {
    // Toaster
    toaster,
    // Toast
    base = "flex justify-between items-center gap-3",
    width = "min-w-xs",
    padding = "p-3",
    rounded = "rounded-container",
    classes = "",
    // Message
    messageBase = "grid",
    messageClasses = "",
    // Title
    titleBase = "font-semibold",
    titleClasses = "",
    // Description
    descriptionBase = "text-sm",
    descriptionClasses = "",
    // Dismiss Button
    btnDismissBase = "btn-icon hover:preset-tonal",
    btnDismissClasses = "",
    // State
    stateInfo = "preset-outlined-surface-200-800 preset-filled-surface-50-950",
    stateSuccess = "preset-filled-success-500",
    stateWarning = "preset-filled-warning-500",
    stateError = "preset-filled-error-500"
  } = $$props;
  const service = useMachine(group.machine, () => ({ id, store: toaster }));
  const api = group.connect(service, normalizeProps);
  const each_array = ensure_array_like(api.getToasts());
  $$payload.out += `<div${spread_attributes(
    {
      ...api.getGroupProps(),
      "data-testid": "toaster-root"
    },
    null
  )}><!--[-->`;
  for (let index = 0, $$length = each_array.length; index < $$length; index++) {
    let toast2 = each_array[index];
    Toast($$payload, {
      base,
      width,
      padding,
      rounded,
      classes,
      messageBase,
      messageClasses,
      titleBase,
      titleClasses,
      descriptionBase,
      descriptionClasses,
      btnDismissBase,
      btnDismissClasses,
      stateInfo,
      stateError,
      stateWarning,
      stateSuccess,
      toast: toast2,
      index,
      parent: service
    });
  }
  $$payload.out += `<!--]--></div>`;
  pop();
}
function Terms($$payload) {
  $$payload.out += `<h1>PIC-SURE Terms of Service</h1> <div class="subtitle">Terms as of 22 November 2023</div> <p>These Terms of Service constitute a legally binding agreement made between you, whether personally
  or on behalf of an entity (“you”, “your”) and Harvard Medical School (“University”, “we”, “our”),
  concerning your access to and use of PIC-SURE (“PIC-SURE”). You agree to access and use PIC-SURE
  for lawful purposes only. By accessing PIC-SURE, you expressly consent to the monitoring of your
  actions, content, data transiting and storage therein.</p> <h2>By accessing and using PIC-SURE, you agree that you must:</h2> <ul><li>Conduct only authorized business on the system.</li> <li>Follow all laws and regulations regarding research involving human data and data privacy that
    are applicable in the area where the research is conducted. In the United States, this includes
    all applicable federal, state, and local laws. Outside of the United States, other laws will
    apply.</li> <li>Safeguard system resources against waste, loss, abuse, unauthorized use or disclosure, and
    misappropriation.</li> <li>Respect the privacy of research participants at all times. Do not use or disclose any
    information that directly identifies one or more participants. If you become aware of any
    information that directly identifies one or more participants, notify the PIC-SURE team
    immediately using the <a href="https://hms-dbmi.atlassian.net/servicedesk/customer/portal/5" target="_blank">Help Desk</a>.</li> <li>Do not attempt to re-identify research participants or their relatives. If you unintentionally
    re-identify participants through the process of my work, contact the PIC-SURE team immediately
    using the <a href="https://hms-dbmi.atlassian.net/servicedesk/customer/portal/5" target="_blank">Help Desk</a>. If you become aware of any uses or disclosures of data that could endanger the security or
    privacy of research participants, contact the PIC-SURE team immediately using the <a href="https://hms-dbmi.atlassian.net/servicedesk/customer/portal/5" target="_blank">Help Desk</a>.</li> <li>Report all security incidents or suspected incidents (e.g., improper or suspicious acts) related
    to PIC-SURE using the <a href="https://hms-dbmi.atlassian.net/servicedesk/customer/portal/5" target="_blank">Help Desk</a>.</li> <li>Contact the PIC-SURE team using the <a href="https://hms-dbmi.atlassian.net/servicedesk/customer/portal/5" target="_blank">Help Desk</a> if you do not understand any of these rules.</li></ul> <h2>By agreeing to the Terms of Service you understand and agree to the following:</h2> <ul><li>If the University provides links that are maintained or controlled by external organizations,
    the listing of links are not an endorsement of information, products, or services, and do not
    imply a direct association between the University and the operators of the outside resource
    links.</li> <li>Neither the University nor its employees warrant that PIC-SURE will be uninterrupted,
    problem-free, free of omissions, or error-free; nor do they make any warranty as to the results
    that may be obtained from PIC-SURE. You expressly understand and agree that your use of
    PIC-SURE, or any material available through it, is at your own risk.</li> <li>In no event will the University, its affiliates or participating institutions, or their
    respective directors, officers, employees, faculty members or students be liable for any
    damages, include incidental, indirect, special, punitive, exemplary, or consequential damages,
    arising out of your use of or inability to use of PIC-SURE, including without limitation, loss
    of revenue or anticipated profits, loss of goodwill, loss of data, computer failure or
    malfunction, or any and all other damages.</li> <li>The University maintains the right to modify these Terms of Service at any time, and may do so
    by posting notice of such modifications to the PIC-SURE website.</li> <li>Any modification made is effective immediately upon posting the modification (unless otherwise
    stated). You should visit this page periodically to review the current Terms of Service.</li></ul> <h2>By accessing and using PIC-SURE, you agree that you must NOT:</h2> <ul><li>Use PIC-SURE to commit a criminal offense or engage in inappropriate or malicious behavior, or
    to encourage others to conduct acts that would constitute a criminal offense or give rise to
    civil liability.</li> <li>Browse, search or reveal any protected data except in accordance with that which is required to
    perform your legitimate tasks or assigned duties.</li> <li>Retrieve protected data or information, or in any other way disclose information, for someone
    who does not have authority to access that information.</li> <li>Establish any unauthorized interfaces between systems, networks, and applications owned by the
    University.</li></ul>`;
}
function Footer($$payload, $$props) {
  push();
  var $$store_subs;
  let {
    showSitemap = branding?.footer?.showSitemap || false
  } = $$props;
  let hideSitemap = !showSitemap || branding?.footer?.excludeSitemapOn?.find((hide) => store_get($$store_subs ??= {}, "$page", page).url.pathname.includes(hide));
  let sitemap = branding?.sitemap?.map((section) => ({
    ...section,
    show: !section.privilege || store_get($$store_subs ??= {}, "$user", user).privileges && store_get($$store_subs ??= {}, "$user", user).privileges.includes(section.privilege)
  }));
  let modalOpen = false;
  let $$settled = true;
  let $$inner_payload;
  function $$render_inner($$payload2) {
    const each_array_2 = ensure_array_like(branding?.footer?.links);
    if (!hideSitemap && branding?.sitemap?.length > 0) {
      $$payload2.out += "<!--[-->";
      const each_array = ensure_array_like(sitemap);
      $$payload2.out += `<div id="sitemap-footer"><div class="flex flex-wrap place-content-center"><!--[-->`;
      for (let $$index_1 = 0, $$length = each_array.length; $$index_1 < $$length; $$index_1++) {
        let section = each_array[$$index_1];
        if (section.show) {
          $$payload2.out += "<!--[-->";
          const each_array_1 = ensure_array_like(section.links);
          $$payload2.out += `<ul class="basis-1/8"><li class="font-bold text-center">${escape_html(section.category)}</li> <!--[-->`;
          for (let $$index = 0, $$length2 = each_array_1.length; $$index < $$length2; $$index++) {
            let link = each_array_1[$$index];
            $$payload2.out += `<li class="text-center"><a${attr("target", link.newTab ? "_blank" : "_self")}${attr("href", link.url)} class="hover:underline">${escape_html(link.title)}</a></li>`;
          }
          $$payload2.out += `<!--]--></ul>`;
        } else {
          $$payload2.out += "<!--[!-->";
        }
        $$payload2.out += `<!--]-->`;
      }
      $$payload2.out += `<!--]--></div></div>`;
    } else {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--> <footer id="main-footer" class="flex relativem mt-4"><ul>`;
    if (features.termsOfService) {
      $$payload2.out += "<!--[-->";
      $$payload2.out += `<li>`;
      {
        let trigger = function($$payload3) {
          $$payload3.out += `<!---->Terms of Service`;
        };
        Modal_1($$payload2, {
          width: "w-3/4",
          height: "h-full",
          withDefault: false,
          footerButtons: false,
          triggerBase: "hover:underline text-[0.74rem]",
          get open() {
            return modalOpen;
          },
          set open($$value) {
            modalOpen = $$value;
            $$settled = false;
          },
          trigger,
          children: ($$payload3) => {
            $$payload3.out += `<div id="terms-of-service">`;
            Terms($$payload3);
            $$payload3.out += `<!----></div> <div class="text-right"><button class="btn preset-filled-primary-500 hover:preset-filled-secondary-500">Accept</button></div>`;
          },
          $$slots: { trigger: true, default: true }
        });
      }
      $$payload2.out += `<!----></li>`;
    } else {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--> <!--[-->`;
    for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
      let link = each_array_2[$$index_2];
      $$payload2.out += `<li><a class="hover:underline text-[0.74rem]"${attr("target", link.newTab ? "_blank" : "_self")}${attr("href", link.url)}>${escape_html(link.title)}</a></li>`;
    }
    $$payload2.out += `<!--]--></ul></footer>`;
  }
  do {
    $$settled = true;
    $$inner_payload = copy_payload($$payload);
    $$render_inner($$inner_payload);
  } while (!$$settled);
  assign_payload($$payload, $$inner_payload);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}

export { Footer as F, Toaster as T };
//# sourceMappingURL=Footer-kKtSBvC8.js.map
