import { c as create_ssr_component, e as escape, v as validate_component, b as each, a as add_attribute } from './ssr-BRJpAXVH.js';
import { C as Content } from './Content-DMwoUi6K.js';
import { U as UserToken } from './UserToken-CfRPWPLL.js';
import { b as branding } from './configuration-GpO7NgNq.js';
import './ProgressBar.svelte_svelte_type_style_lang-3a6XZCfa.js';
import { c as codeBlocks, T as TabGroup, C as CodeBlock, a as Tab } from './codeBlocks-D7Bb9quT.js';
import './lifecycle-DtuISP6h.js';
import './AngleButton-C6YzBYNH.js';
import './client-BR749xJD.js';
import './exports-kR70XCWV.js';
import './stores-CeRLSJyW.js';
import './index2-BVONNh3m.js';
import './stores2-Cy1ftf_v.js';
import './ProgressRadial-STSdW-aK.js';
import './CopyButton-BtLZ49Iw.js';
import './User-H6u4bNR9.js';
import './index-CvuFLVuQ.js';
import './stores4-C3NPX6l0.js';

const css = {
  code: "a.pic-sure-info-card.svelte-pjjuju{max-width:25rem;min-height:18rem;margin:0 8px}",
  map: `{"version":3,"file":"+page.svelte","sources":["+page.svelte"],"sourcesContent":["<script lang=\\"ts\\">import Content from \\"$lib/components/Content.svelte\\";\\nimport UserToken from \\"$lib/components/UserToken.svelte\\";\\nimport { branding } from \\"$lib/configuration\\";\\nimport { CodeBlock, Tab, TabGroup } from \\"@skeletonlabs/skeleton\\";\\nimport codeBlocks from \\"$lib/assets/codeBlocks.json\\";\\nlet tabSet = 0;\\n<\/script>\\n\\n<svelte:head>\\n  <title>{branding.applicationName} | API</title>\\n</svelte:head>\\n\\n<Content title=\\"Prepare for Analysis with the PIC-SURE API\\">\\n  <section class=\\"flex flex-col gap-8\\">\\n    <p class=\\"mt-4\\">\\n      The PIC-SURE Application Programming Interface (API) can be used in an analysis environment of\\n      your choice. This API is available in both Python and R coding languages.\\n    </p>\\n    <!-- eslint-disable-next-line svelte/no-at-html-tags -->\\n    <p>{@html branding.analysisConfig.instructions.connection}</p>\\n    <div class=\\"flex justify-center\\"><UserToken /></div>\\n    <!-- eslint-disable-next-line svelte/no-at-html-tags -->\\n    <p>{@html branding.analysisConfig.instructions.execution}</p>\\n    <TabGroup class=\\"card p-4\\">\\n      <Tab bind:group={tabSet} name=\\"python\\" value={0}>Python</Tab>\\n      <Tab bind:group={tabSet} name=\\"r\\" value={1}>R</Tab>\\n      <svelte:fragment slot=\\"panel\\">\\n        {#if tabSet === 0}\\n          <CodeBlock\\n            language=\\"python\\"\\n            lineNumbers={true}\\n            buttonCopied=\\"Copied!\\"\\n            code={codeBlocks?.bdcPythonAPI || 'Code not set'}\\n          ></CodeBlock>\\n        {:else if tabSet === 1}\\n          <CodeBlock language=\\"r\\" lineNumbers={true} code={codeBlocks?.bdcRAPI || 'Code not set'}\\n          ></CodeBlock>\\n        {/if}\\n      </svelte:fragment>\\n    </TabGroup>\\n  </section>\\n  <section id=\\"info-cards\\" class=\\"w-full flex flex-wrap flex-row justify-center mt-6\\">\\n    {#each branding.analysisConfig.cards as card}\\n      <a\\n        href={card.link}\\n        target={card.link.startsWith('http') ? '_blank' : '_self'}\\n        class=\\"pic-sure-info-card p-4 basis-2/4\\"\\n      >\\n        <div class=\\"card card-hover\\">\\n          <header class=\\"card-header flex flex-col items-center\\">\\n            <h4 class=\\"my-1\\" data-testid={card.header}>{card.header}</h4>\\n            <hr class=\\"!border-t-2\\" />\\n          </header>\\n          <section class=\\"p-4 whitespace-pre-wrap flex flex-col\\" data-testid={card.body}>\\n            <div>{card.body}</div>\\n            <div class=\\"flex justify-center\\">\\n              <div class=\\"btn variant-filled-primary mt-3 w-fit\\">Learn More</div>\\n            </div>\\n          </section>\\n        </div>\\n      </a>\\n    {/each}\\n  </section>\\n</Content>\\n\\n<style>\\n  a.pic-sure-info-card {\\n    max-width: 25rem;\\n    min-height: 18rem;\\n    margin: 0 8px;\\n  }</style>\\n"],"names":[],"mappings":"AAkEE,CAAC,iCAAoB,CACnB,SAAS,CAAE,KAAK,CAChB,UAAU,CAAE,KAAK,CACjB,MAAM,CAAE,CAAC,CAAC,GACZ"}`
};
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let tabSet = 0;
  $$result.css.add(css);
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
                  code: codeBlocks?.bdcPythonAPI
                },
                {},
                {}
              )}` : `${tabSet === 1 ? `${validate_component(CodeBlock, "CodeBlock").$$render(
                $$result,
                {
                  language: "r",
                  lineNumbers: true,
                  code: codeBlocks?.bdcRAPI
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
            return `<a${add_attribute("href", card.link, 0)}${add_attribute("target", card.link.startsWith("http") ? "_blank" : "_self", 0)} class="pic-sure-info-card p-4 basis-2/4 svelte-pjjuju"><div class="card card-hover"><header class="card-header flex flex-col items-center"><h4 class="my-1"${add_attribute("data-testid", card.header, 0)}>${escape(card.header)}</h4> <hr class="!border-t-2"></header> <section class="p-4 whitespace-pre-wrap flex flex-col"${add_attribute("data-testid", card.body, 0)}><div>${escape(card.body)}</div> <div class="flex justify-center" data-svelte-h="svelte-1127l30"><div class="btn variant-filled-primary mt-3 w-fit">Learn More</div></div> </section></div> </a>`;
          })}</section>`;
        }
      }
    )}`;
  } while (!$$settled);
  return $$rendered;
});

export { Page as default };
//# sourceMappingURL=_page.svelte-DaYW1rWf.js.map
