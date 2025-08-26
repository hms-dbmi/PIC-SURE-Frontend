import { x as push, Q as props_id, R as ensure_array_like, S as spread_attributes, z as pop, T as store_get, U as copy_payload, V as assign_payload, W as unsubscribe_stores, M as attr_class, K as escape_html, P as stringify, N as attr, X as await_block, Y as bind_props } from './index-C5NonOVO.js';
import { g as group, m as machine, c as connect, u as user, i as isLoggedIn } from './User-ByrNDeqq.js';
import { u as useMachine, n as normalizeProps, L as Loading } from './Loading-Drx6gnkR.js';
import { p as page } from './index3-D0mgFMjB.js';
import { b as branding, f as features } from './configuration-CSskKBur.js';
import DOMPurify from 'dompurify';
import './client2-CLhyDddE.js';
import './index2-CvuFLVuQ.js';
import './client-BWx-wafP.js';
import { h as html } from './html-FW6Ia4bL.js';
import { M as Modal_1 } from './Modal-tsNejdoN.js';

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
function Terms($$payload, $$props) {
  push();
  var $$store_subs;
  let { modalOpen = false } = $$props;
  let terms = Promise.resolve("");
  let enforceTerms = features.enforceTermsOfService && store_get($$store_subs ??= {}, "$isLoggedIn", isLoggedIn) && !store_get($$store_subs ??= {}, "$user", user).acceptedTOS;
  await_block(
    $$payload,
    terms,
    () => {
      Loading($$payload, {});
    },
    (termsHTML) => {
      $$payload.out += `<div id="terms-of-service">${html(DOMPurify.sanitize(termsHTML))}</div> <footer class="modal-footer flex justify-end space-x-2 mt-6">`;
      if (enforceTerms) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<button type="button" data-testid="terms-reject-btn" class="btn border preset-tonal-primary hover:preset-filled-primary-500">Reject</button> <button type="button" data-testid="terms-accept-btn" class="btn preset-filled-primary-500">Accept</button>`;
      } else {
        $$payload.out += "<!--[!-->";
        $$payload.out += `<button type="button" data-testid="terms-close-btn" class="btn border preset-tonal-primary hover:preset-filled-primary-500">Close</button>`;
      }
      $$payload.out += `<!--]--></footer>`;
    }
  );
  $$payload.out += `<!--]-->`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  bind_props($$props, { modalOpen });
  pop();
}
function Footer($$payload, $$props) {
  push();
  var $$store_subs;
  let {
    showSitemap = branding?.footer?.showSitemap || false
  } = $$props;
  let hideSitemap = !showSitemap || branding?.footer?.excludeSitemapOn?.find((hide) => page.url.pathname.includes(hide));
  let sitemap = branding?.sitemap?.map((section) => ({
    ...section,
    show: (!section.privilege || store_get($$store_subs ??= {}, "$user", user).privileges && store_get($$store_subs ??= {}, "$user", user).privileges.includes(section.privilege)) && (!section.feature || features[section.feature])
  }));
  let modalOpen = features.enforceTermsOfService && store_get($$store_subs ??= {}, "$isLoggedIn", isLoggedIn) && !store_get($$store_subs ??= {}, "$user", user).acceptedTOS;
  let modalClosable = !features.enforceTermsOfService || !store_get($$store_subs ??= {}, "$isLoggedIn", isLoggedIn) || store_get($$store_subs ??= {}, "$isLoggedIn", isLoggedIn) && !!store_get($$store_subs ??= {}, "$user", user)?.acceptedTOS;
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
            if (!link.feature || features[link.feature]) {
              $$payload2.out += "<!--[-->";
              $$payload2.out += `<li class="text-center"><a${attr("target", link.newTab ? "_blank" : "_self")}${attr("href", link.url)} class="hover:underline">${escape_html(link.title)}</a></li>`;
            } else {
              $$payload2.out += "<!--[!-->";
            }
            $$payload2.out += `<!--]-->`;
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
    {
      $$payload2.out += "<!--[-->";
      $$payload2.out += `<li>`;
      {
        let trigger = function($$payload3) {
          $$payload3.out += `<!---->Terms of Service`;
        };
        Modal_1($$payload2, {
          "data-testid": "terms-of-service",
          width: "w-3/4",
          height: "h-full",
          triggerBase: "hover:underline text-[0.74rem]",
          withDefault: false,
          footerButtons: false,
          closeable: modalClosable,
          get open() {
            return modalOpen;
          },
          set open($$value) {
            modalOpen = $$value;
            $$settled = false;
          },
          trigger,
          children: ($$payload3) => {
            Terms($$payload3, {
              get modalOpen() {
                return modalOpen;
              },
              set modalOpen($$value) {
                modalOpen = $$value;
                $$settled = false;
              }
            });
          },
          $$slots: { trigger: true, default: true }
        });
      }
      $$payload2.out += `<!----></li>`;
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
//# sourceMappingURL=Footer-DE3obZpr.js.map
