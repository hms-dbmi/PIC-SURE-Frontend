import { x as push, U as copy_payload, V as assign_payload, z as pop, a1 as head, K as escape_html, R as ensure_array_like, N as attr } from './index-BKfiikQf.js';
import './index-BB9JrA1L.js';
import { T as Tabs, a as TabItem, C as CodeBlock } from './TabItem-DPoodVM7.js';
import { b as branding } from './configuration-D-fruRXg.js';
import { C as Content } from './Content-CXUsf3rW.js';
import { U as UserToken } from './UserToken-DBNjKxOS.js';
import { h as html } from './html-FW6Ia4bL.js';
import './machine.svelte-D_VZYMjT.js';
import './client-HRCS46UK.js';
import './exports-CKriv3vT.js';
import './toaster-DzAsAKEJ.js';
import './Forms-DH01zSCL.js';
import './CopyButton-CS6A5jqC.js';
import './Popover-3fcJP7wJ.js';
import './Modal-DVSOHq6m.js';
import './User-DPh8mmLT.js';
import './index2-CvuFLVuQ.js';
import './stores-DhwnhD2d.js';
import './Loading-DKkczq09.js';

function _page($$payload, $$props) {
  push();
  let tabSet = "Python";
  let $$settled = true;
  let $$inner_payload;
  function $$render_inner($$payload2) {
    head($$payload2, ($$payload3) => {
      $$payload3.title = `<title>${escape_html(branding.applicationName)} | API</title>`;
    });
    Content($$payload2, {
      title: "Prepare for Analysis with the PIC-SURE API",
      children: ($$payload3) => {
        const each_array = ensure_array_like(branding.analysisConfig.cards);
        $$payload3.out += `<section><p class="mt-4">The PIC-SURE Application Programming Interface (API) can be used in an analysis environment of
      your choice. This API is available in both Python and R coding languages.</p> <p>${html(branding.analysisConfig.instructions.connection)}</p> <div class="flex justify-center">`;
        UserToken($$payload3);
        $$payload3.out += `<!----></div> <p>${html(branding.analysisConfig.instructions.execution)}</p> `;
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
                $$payload5.out += `<!---->Python`;
              },
              $$slots: { default: true }
            });
            $$payload4.out += `<!----> `;
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
                $$payload5.out += `<!---->R`;
              },
              $$slots: { default: true }
            });
            $$payload4.out += `<!---->`;
          }, content = function($$payload4) {
            $$payload4.out += `<!---->`;
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
            $$payload4.out += `<!----> <!---->`;
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
            $$payload4.out += `<!---->`;
          };
          Tabs($$payload3, {
            value: tabSet,
            onValueChange: (e) => tabSet = e.value,
            list,
            content,
            $$slots: { list: true, content: true }
          });
        }
        $$payload3.out += `<!----></section> <section id="info-cards" class="w-full flex flex-wrap flex-row justify-center mt-6"><!--[-->`;
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let card = each_array[$$index];
          $$payload3.out += `<a${attr("href", card.link)}${attr("target", card.link.startsWith("http") ? "_blank" : "_self")} class="p-4 basis-2/4 max-w-sm min-h-48 mb-8"><div class="card card-hover border border-surface-200 bg-surface-100 hover:scale-105 hover:shadow-lg"><header class="card-header flex flex-col items-center"><h4 class="my-1"${attr("data-testid", card.header)}>${escape_html(card.header)}</h4> <hr/></header> <section class="p-4 whitespace-pre-wrap flex flex-col"${attr("data-testid", card.body)}><div>${escape_html(card.body)}</div> <div class="flex justify-center"><div class="btn preset-filled-primary-500 mt-3 w-fit">Learn More</div></div></section></div></a>`;
        }
        $$payload3.out += `<!--]--></section>`;
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
//# sourceMappingURL=_page.svelte-DTy0EciD.js.map
