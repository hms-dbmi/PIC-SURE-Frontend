import { x as push, V as copy_payload, W as assign_payload, z as pop, a8 as head, M as escape_html, S as ensure_array_like, O as attr } from './index-DMPVr6nO.js';
import { T as Tabs } from './index3-BTFwLm73.js';
import './User-01eW3TFo.js';
import { b as branding } from './configuration-CBIXsjx2.js';
import './HTML-1Mhr8hI4.js';
import { C as Content } from './Content-DMJk6TmZ.js';
import { U as UserToken } from './UserToken-rZOsbhyB.js';
import { T as TabItem, C as CodeBlock } from './TabItem-DxysY_aO.js';
import { h as html } from './html2-FW6Ia4bL.js';
import './Loading-DAyWVuL0.js';
import './create-context-CgHykjw-.js';
import './utils-B7NzVBxP.js';
import '@sveltejs/kit';
import './client2-DxcZr6Tp.js';
import '@sveltejs/kit/internal';
import './index2-Bp7szfwE.js';
import 'dompurify';
import './Forms-DH01zSCL.js';
import './CopyButton-C8qhQbgh.js';
import './Popover-7q3Ft3Q-.js';
import '@floating-ui/dom';
import './Modal-dMSGxUC4.js';
import 'shiki/core';
import 'shiki/engine/javascript';
import 'shiki/themes/dark-plus.mjs';
import 'shiki/langs/console.mjs';
import 'shiki/langs/python.mjs';
import 'shiki/langs/r.mjs';

function _page($$payload, $$props) {
  push();
  let tabSet = "Python";
  let connection = "";
  let execution = "";
  let $$settled = true;
  let $$inner_payload;
  function $$render_inner($$payload2) {
    head($$payload2, ($$payload3) => {
      $$payload3.title = `<title>${escape_html(branding.applicationName)} | API</title>`;
    });
    Content($$payload2, {
      title: "Prepare for Analysis with the PIC-SURE API",
      children: ($$payload3) => {
        const each_array = ensure_array_like(branding.analysisConfig.api.cards);
        $$payload3.out.push(`<section><p class="mt-4">The PIC-SURE Application Programming Interface (API) can be used in an analysis environment of
      your choice. This API is available in both Python and R coding languages.</p> <p>${html(connection)}</p> <div class="flex justify-center">`);
        UserToken($$payload3);
        $$payload3.out.push(`<!----></div> <p>${html(execution)}</p> `);
        {
          let list = function($$payload4) {
            TabItem($$payload4, {
              value: "Python",
              get group() {
                return tabSet;
              },
              set group($$value) {
                tabSet = $$value;
                $$settled = false;
              },
              children: ($$payload5) => {
                $$payload5.out.push(`<!---->Python`);
              },
              $$slots: { default: true }
            });
            $$payload4.out.push(`<!----> `);
            TabItem($$payload4, {
              value: "R",
              get group() {
                return tabSet;
              },
              set group($$value) {
                tabSet = $$value;
                $$settled = false;
              },
              children: ($$payload5) => {
                $$payload5.out.push(`<!---->R`);
              },
              $$slots: { default: true }
            });
            $$payload4.out.push(`<!---->`);
          }, content = function($$payload4) {
            $$payload4.out.push(`<!---->`);
            Tabs.Panel($$payload4, {
              value: "Python",
              children: ($$payload5) => {
                CodeBlock($$payload5, {
                  lang: "python",
                  code: branding.explorePage.codeBlocks.PythonAPI || "Code not set"
                });
              },
              $$slots: { default: true }
            });
            $$payload4.out.push(`<!----> <!---->`);
            Tabs.Panel($$payload4, {
              value: "R",
              children: ($$payload5) => {
                CodeBlock($$payload5, {
                  lang: "r",
                  code: branding.explorePage.codeBlocks.RAPI || "Code not set"
                });
              },
              $$slots: { default: true }
            });
            $$payload4.out.push(`<!---->`);
          };
          Tabs($$payload3, {
            value: tabSet,
            onValueChange: (e) => tabSet = e.value,
            list,
            content,
            $$slots: { list: true, content: true }
          });
        }
        $$payload3.out.push(`<!----></section> <section id="info-cards" class="w-full flex flex-wrap flex-row justify-center mt-6"><!--[-->`);
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let card = each_array[$$index];
          $$payload3.out.push(`<a${attr("href", card.link)}${attr("target", card.link.startsWith("http") ? "_blank" : "_self")} class="p-4 basis-2/4 max-w-sm min-h-48 mb-8"><div class="card card-hover border border-surface-200 bg-surface-100 hover:scale-105 hover:shadow-lg"><header class="card-header flex flex-col items-center"><h4 class="my-1"${attr("data-testid", card.header)}>${escape_html(card.header)}</h4> <hr/></header> <section class="p-4 whitespace-pre-wrap flex flex-col"${attr("data-testid", card.body)}><div>${escape_html(card.body)}</div> <div class="flex justify-center"><div class="btn preset-filled-primary-500 mt-3 w-fit">Learn More</div></div></section></div></a>`);
        }
        $$payload3.out.push(`<!--]--></section>`);
      }
    });
  }
  do {
    $$settled = true;
    $$inner_payload = copy_payload($$payload);
    $$render_inner($$inner_payload);
  } while (!$$settled);
  assign_payload($$payload, $$inner_payload);
  pop();
}

export { _page as default };
//# sourceMappingURL=_page.svelte-Bn6uDAEB.js.map
