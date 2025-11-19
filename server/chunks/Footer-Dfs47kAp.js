import { x as push, R as props_id, S as ensure_array_like, T as spread_attributes, z as pop, U as store_get, V as copy_payload, W as assign_payload, X as unsubscribe_stores, N as attr_class, M as escape_html, Q as stringify, O as attr, Y as await_block, Z as bind_props } from './index-DMPVr6nO.js';
import { g as group, m as machine, c as connect, u as user, i as isLoggedIn } from './User-01eW3TFo.js';
import { u as useMachine, n as normalizeProps, L as Loading } from './Loading-DAyWVuL0.js';
import { p as page } from './index2-Bp7szfwE.js';
import { b as branding, f as features } from './configuration-CBIXsjx2.js';
import '@sveltejs/kit/internal';
import './utils-B7NzVBxP.js';
import './client2-DxcZr6Tp.js';
import '@sveltejs/kit';
import { s as sanitizeHTML } from './HTML-1Mhr8hI4.js';
import { h as html } from './html2-FW6Ia4bL.js';
import { M as Modal_1 } from './Modal-dMSGxUC4.js';

function Toast($$payload, $$props) {
  push();
  const { $$slots, $$events, ...props } = $$props;
  const service = useMachine(machine, () => ({ ...props.toast, parent: props.parent, index: props.index }));
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
  $$payload.out.push(`<div${spread_attributes(
    {
      class: `${stringify(props.base)} ${stringify(props.width)} ${stringify(props.padding)} ${stringify(props.rounded)} ${stringify(rxState)} ${stringify(props.classes)}`,
      ...api.getRootProps(),
      "data-testid": "toast-root"
    },
    "svelte-rtmh8b"
  )}><div${attr_class(`${stringify(props.messageBase)} ${stringify(props.messageClasses)}`)} data-testid="toast-message"><span${spread_attributes(
    {
      class: `${stringify(props.titleBase)} ${stringify(props.titleClasses)}`,
      ...api.getTitleProps(),
      "data-testid": "toast-title"
    },
    "svelte-rtmh8b"
  )}>${escape_html(api.title)}</span> <span${spread_attributes(
    {
      class: `${stringify(props.descriptionBase)} ${stringify(props.descriptionClasses)}`,
      ...api.getDescriptionProps(),
      "data-testid": "toast-description"
    },
    "svelte-rtmh8b"
  )}>${escape_html(api.description)}</span></div> `);
  if (api.closable) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<button${spread_attributes(
      {
        class: `${stringify(props.btnDismissBase)} ${stringify(props.btnDismissClasses)}`,
        title: props.btnDismissTitle,
        "aria-label": props.btnDismissAriaLabel,
        ...api.getCloseTriggerProps(),
        "data-testid": "toast-dismiss"
      },
      "svelte-rtmh8b"
    )}>×</button>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div>`);
  pop();
}
function Toaster($$payload, $$props) {
  push();
  const id = props_id($$payload);
  const {
    toaster,
    base = "flex justify-between items-center gap-3",
    width = "min-w-xs",
    padding = "p-3",
    rounded = "rounded-container",
    classes = "",
    messageBase = "grid",
    messageClasses = "",
    titleBase = "font-semibold",
    titleClasses = "",
    descriptionBase = "text-sm",
    descriptionClasses = "",
    btnDismissBase = "btn-icon hover:preset-tonal",
    btnDismissClasses = "",
    btnDismissTitle = "Dismiss",
    btnDismissAriaLabel = "Dismiss",
    stateInfo = "preset-outlined-surface-200-800 preset-filled-surface-50-950",
    stateSuccess = "preset-filled-success-500",
    stateWarning = "preset-filled-warning-500",
    stateError = "preset-filled-error-500"
  } = $$props;
  const service = useMachine(group.machine, () => ({ id, store: toaster }));
  const api = group.connect(service, normalizeProps);
  const each_array = ensure_array_like(api.getToasts());
  $$payload.out.push(`<div${spread_attributes({ ...api.getGroupProps(), "data-testid": "toaster-root" }, null)}><!--[-->`);
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
      btnDismissTitle,
      btnDismissAriaLabel,
      stateInfo,
      stateError,
      stateWarning,
      stateSuccess,
      toast: toast2,
      index,
      parent: service
    });
  }
  $$payload.out.push(`<!--]--></div>`);
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
      $$payload.out.push(`<div id="terms-of-service">${html(sanitizeHTML(termsHTML))}</div> <footer class="modal-footer flex justify-end space-x-2 mt-6">`);
      if (enforceTerms) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<button type="button" data-testid="terms-reject-btn" class="btn border preset-tonal-primary hover:preset-filled-primary-500">Reject</button> <button type="button" data-testid="terms-accept-btn" class="btn preset-filled-primary-500">Accept</button>`);
      } else {
        $$payload.out.push("<!--[!-->");
        $$payload.out.push(`<button type="button" data-testid="terms-close-btn" class="btn border preset-tonal-primary hover:preset-filled-primary-500">Close</button>`);
      }
      $$payload.out.push(`<!--]--></footer>`);
    }
  );
  $$payload.out.push(`<!--]-->`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  bind_props($$props, { modalOpen });
  pop();
}
function Footer($$payload, $$props) {
  push();
  var $$store_subs;
  let { showSitemap = branding?.footer?.showSitemap || false } = $$props;
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
      $$payload2.out.push("<!--[-->");
      const each_array = ensure_array_like(sitemap);
      $$payload2.out.push(`<div id="sitemap-footer"><div class="flex flex-wrap place-content-center"><!--[-->`);
      for (let $$index_1 = 0, $$length = each_array.length; $$index_1 < $$length; $$index_1++) {
        let section = each_array[$$index_1];
        if (section.show) {
          $$payload2.out.push("<!--[-->");
          const each_array_1 = ensure_array_like(section.links);
          $$payload2.out.push(`<ul class="basis-1/8"><li class="font-bold text-center">${escape_html(section.category)}</li> <!--[-->`);
          for (let $$index = 0, $$length2 = each_array_1.length; $$index < $$length2; $$index++) {
            let link = each_array_1[$$index];
            if (!link.feature || features[link.feature]) {
              $$payload2.out.push("<!--[-->");
              $$payload2.out.push(`<li class="text-center"><a${attr("target", link.newTab ? "_blank" : "_self")}${attr("href", link.url)} class="hover:underline">${escape_html(link.title)}</a></li>`);
            } else {
              $$payload2.out.push("<!--[!-->");
            }
            $$payload2.out.push(`<!--]-->`);
          }
          $$payload2.out.push(`<!--]--></ul>`);
        } else {
          $$payload2.out.push("<!--[!-->");
        }
        $$payload2.out.push(`<!--]-->`);
      }
      $$payload2.out.push(`<!--]--></div></div>`);
    } else {
      $$payload2.out.push("<!--[!-->");
    }
    $$payload2.out.push(`<!--]--> <footer id="main-footer" class="flex relativem mt-4"><ul>`);
    {
      $$payload2.out.push("<!--[-->");
      $$payload2.out.push(`<li>`);
      {
        let trigger = function($$payload3) {
          $$payload3.out.push(`<!---->Terms of Service`);
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
      $$payload2.out.push(`<!----></li>`);
    }
    $$payload2.out.push(`<!--]--> <!--[-->`);
    for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
      let link = each_array_2[$$index_2];
      $$payload2.out.push(`<li><a class="hover:underline text-[0.74rem]"${attr("target", link.newTab ? "_blank" : "_self")}${attr("href", link.url)}>${escape_html(link.title)}</a></li>`);
    }
    $$payload2.out.push(`<!--]--></ul></footer>`);
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
//# sourceMappingURL=Footer-Dfs47kAp.js.map
