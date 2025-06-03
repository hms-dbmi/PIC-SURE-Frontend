import { c as create_ssr_component, e as escape, v as validate_component, b as each, a as add_attribute } from './ssr-BRJpAXVH.js';
import { C as Content } from './Content-DMwoUi6K.js';
import { U as UserToken } from './UserToken-DV_tTtBe.js';
import { b as branding } from './configuration-Bm4Mu1_g.js';
import './ProgressBar.svelte_svelte_type_style_lang-3a6XZCfa.js';
import { T as TabGroup, C as CodeBlock, a as Tab } from './CodeBlock-D3P8-iRB.js';
import './lifecycle-DtuISP6h.js';
import './AngleButton-C6YzBYNH.js';
import './client-BR749xJD.js';
import './exports-kR70XCWV.js';
import './stores-CeRLSJyW.js';
import './index2-BVONNh3m.js';
import './stores2-Cy1ftf_v.js';
import './ProgressRadial-STSdW-aK.js';
import './CopyButton-BtLZ49Iw.js';
import './User-Cv0Sr19m.js';
import './index-CvuFLVuQ.js';
import './stores4-C3NPX6l0.js';

const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let tabSet = 0;
  let $$settled;
  let $$rendered;
  let previous_head = $$result.head;
  do {
    $$settled = true;
    $$result.head = previous_head;
    $$rendered = `${$$result.head += `<!-- HEAD_svelte-6qg1j1_START -->${$$result.title = `<title>${escape(branding.applicationName)} | API</title>`, ""}<!-- HEAD_svelte-6qg1j1_END -->`, ""} ${validate_component(Content, "Content").$$render(
      $$result,
      {
        title: "Prepare for Analysis with the PIC-SURE API"
      },
      {},
      {
        default: () => {
          return `<section class="flex flex-col gap-8"><p class="mt-4" data-svelte-h="svelte-sllq2c">The PIC-SURE Application Programming Interface (API) can be used in an analysis environment of
      your choice. This API is available in both Python and R coding languages.</p>  <p><!-- HTML_TAG_START -->${branding.analysisConfig.instructions.connection}<!-- HTML_TAG_END --></p> <div class="flex justify-center">${validate_component(UserToken, "UserToken").$$render($$result, {}, {}, {})}</div>  <p><!-- HTML_TAG_START -->${branding.analysisConfig.instructions.execution}<!-- HTML_TAG_END --></p> ${validate_component(TabGroup, "TabGroup").$$render($$result, { class: "card p-4" }, {}, {
            panel: () => {
              return `${tabSet === 0 ? `${validate_component(CodeBlock, "CodeBlock").$$render(
                $$result,
                {
                  language: "python",
                  lineNumbers: true,
                  buttonCopied: "Copied!",
                  code: branding.explorePage.codeBlocks.PythonAPI || "Code not set"
                },
                {},
                {}
              )}` : `${tabSet === 1 ? `${validate_component(CodeBlock, "CodeBlock").$$render(
                $$result,
                {
                  language: "r",
                  lineNumbers: true,
                  code: branding.explorePage.codeBlocks.RAPI || "Code not set"
                },
                {},
                {}
              )}` : ``}`} `;
            },
            default: () => {
              return `${validate_component(Tab, "Tab").$$render(
                $$result,
                { name: "python", value: 0, group: tabSet },
                {
                  group: ($$value) => {
                    tabSet = $$value;
                    $$settled = false;
                  }
                },
                {
                  default: () => {
                    return `Python`;
                  }
                }
              )} ${validate_component(Tab, "Tab").$$render(
                $$result,
                { name: "r", value: 1, group: tabSet },
                {
                  group: ($$value) => {
                    tabSet = $$value;
                    $$settled = false;
                  }
                },
                {
                  default: () => {
                    return `R`;
                  }
                }
              )}`;
            }
          })}</section> <section id="info-cards" class="w-full flex flex-wrap flex-row justify-center mt-6">${each(branding.analysisConfig.cards, (card) => {
            return `<a${add_attribute("href", card.link, 0)}${add_attribute("target", card.link.startsWith("http") ? "_blank" : "_self", 0)} class="p-4 basis-2/4 max-w-sm min-h-48 mb-8"><div class="card card-hover"><header class="card-header flex flex-col items-center"><h4 class="my-1"${add_attribute("data-testid", card.header, 0)}>${escape(card.header)}</h4> <hr class="!border-t-2"></header> <section class="p-4 whitespace-pre-wrap flex flex-col"${add_attribute("data-testid", card.body, 0)}><div>${escape(card.body)}</div> <div class="flex justify-center" data-svelte-h="svelte-1127l30"><div class="btn variant-filled-primary mt-3 w-fit">Learn More</div></div> </section></div> </a>`;
          })}</section>`;
        }
      }
    )}`;
  } while (!$$settled);
  return $$rendered;
});

export { Page as default };
//# sourceMappingURL=_page.svelte-BCEGfzz2.js.map
