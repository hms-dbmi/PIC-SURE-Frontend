import { x as push, V as copy_payload, W as assign_payload, z as pop, a8 as head, M as escape_html, Y as await_block, U as store_get, Z as bind_props, X as unsubscribe_stores } from './index-C9dy-hDW.js';
import { g as goto } from './client2-BVaV_p61.js';
import { a6 as get, a8 as Psama, a7 as isTopAdmin, a3 as post, t as toaster } from './User-CeJunCPd.js';
import { b as branding } from './configuration-BAm0JRx1.js';
import { s as sanitizeHTML } from './HTML-1Mhr8hI4.js';
import { C as Content } from './Content-B-tyG1Sn.js';
import { E as ErrorAlert } from './ErrorAlert-BNxDBqzK.js';
import { L as Loading } from './Loading-Bei-CWQ1.js';
import { M as Modal_1 } from './Modal-C5zQSBqd.js';
import { h as html } from './html2-FW6Ia4bL.js';
import '@sveltejs/kit/internal';
import './utils-D3IkxnGP.js';
import '@sveltejs/kit';
import './index2-CFqWCRce.js';
import 'dompurify';

function Editor($$payload, $$props) {
  push();
  let {
    content = void 0,
    embedOptions = false,
    fontOptions = false,
    headerDropdown = true,
    alignOptions = true
  } = $$props;
  $$payload.out.push(`<div id="editor" class="bg-white dark:bg-black"></div>`);
  bind_props($$props, { content });
  pop();
}
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  let terms = "";
  let original = "";
  let dirty = terms !== original;
  let modalOpen = false;
  async function load() {
    terms = await get(Psama.TOS + "/latest");
    original = terms;
  }
  async function onCommit() {
    await post(Psama.TOS + "/update", terms, { "Content-Type": "text/html" }).then(() => {
      toaster.success({ description: "Terms have been successfully published." });
      goto();
    }).catch(() => toaster.error({
      description: "An error occured while publishing these terms. Make a backup and try again or contact an administrator."
    }));
  }
  let $$settled = true;
  let $$inner_payload;
  function $$render_inner($$payload2) {
    head($$payload2, ($$payload3) => {
      $$payload3.title = `<title>${escape_html(branding.applicationName)} | Edit Terms of Service</title>`;
    });
    Content($$payload2, {
      title: "Edit Terms of Service",
      backUrl: "/admin/configuration",
      backTitle: "Back to Configuration",
      children: ($$payload3) => {
        await_block(
          $$payload3,
          load(),
          () => {
            Loading($$payload3, {});
          },
          () => {
            if (!store_get($$store_subs ??= {}, "$isTopAdmin", isTopAdmin)) {
              $$payload3.out.push("<!--[-->");
              ErrorAlert($$payload3, {
                "data-testid": "admin-warning",
                title: "Top Administrator Only",
                color: "warning",
                children: ($$payload4) => {
                  $$payload4.out.push(`<p>Configurations are READ ONLY for admin users. Please contact your administrator to make
          changes.</p>`);
                }
              });
              $$payload3.out.push(`<!----> <div id="terms-of-service" class="bg-white dark:bg-black border px-2">${html(sanitizeHTML(terms))}</div>`);
            } else {
              $$payload3.out.push("<!--[!-->");
              Editor($$payload3, {
                fontOptions: true,
                get content() {
                  return terms;
                },
                set content($$value) {
                  terms = $$value;
                  $$settled = false;
                }
              });
            }
            $$payload3.out.push(`<!--]--> <div class="flex justify-end">`);
            {
              let trigger = function($$payload4) {
                $$payload4.out.push(`<!---->Publish`);
              };
              Modal_1($$payload3, {
                title: "Publish",
                width: "w-1/3",
                "data-testid": "publish-terms",
                triggerBase: "btn preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500 mt-3",
                open: modalOpen,
                disabled: !store_get($$store_subs ??= {}, "$isTopAdmin", isTopAdmin) || !dirty,
                withDefault: true,
                onconfirm: onCommit,
                cancelClass: "border preset-tonal-error hover:preset-filled-error-500",
                trigger,
                children: ($$payload4) => {
                  $$payload4.out.push(`<div>Once published, these terms will be live and every user will be prompted to accept them on
          their next login.</div> <div class="mt-3">Do you wish to continue?</div>`);
                },
                $$slots: { trigger: true, default: true }
              });
            }
            $$payload3.out.push(`<!----></div>`);
          }
        );
        $$payload3.out.push(`<!--]-->`);
      }
    });
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

export { _page as default };
//# sourceMappingURL=_page.svelte-DNF6_IQ0.js.map
